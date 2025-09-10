const moment = require('moment');
const Video = require('../models/video');
const {
  MAX_TRIES,
  RETRY_DELAY
} = require('../config/constants');
const logger = require('../logger/logger');
const videoCacheService = require('./videoCacheService');

let isGeneratingVideo = false;
let pendingPromise = null;

function addLinkToDatabase(link, createdAt = new Date()) {
  if (!link) throw new Error('Link is missing');
  return Video.create({ link, createdAt }).then((newVideo) => newVideo.toJSON());
}

const delay = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

async function getRandomKeyword() {
  return videoCacheService.getRandomKeyword();
}

async function getRandomYouTubeVideoEmbedLink(keyword) {
  return videoCacheService.getYouTubeVideo(keyword);
}

async function generateRandomLink() {
  if (isGeneratingVideo) {
    logger.warn('Video generation already in progress. Returning pending promise.');
    return pendingPromise;
  }

  isGeneratingVideo = true;

  pendingPromise = (async () => {
    try {
      // First, try to get a random cached video (fastest option)
      const cachedVideo = videoCacheService.getRandomCachedVideo();
      if (cachedVideo) {
        const newVideo = await addLinkToDatabase(cachedVideo);
        logger.info('Used cached video for fast response');
        return { link: newVideo.link };
      }

      // If no cached video, generate new one with smart rate limiting
      let tries = 0;
      while (tries < MAX_TRIES) {
        // eslint-disable-next-line no-await-in-loop
        const keyword = await getRandomKeyword();
        // eslint-disable-next-line no-await-in-loop
        const link = await getRandomYouTubeVideoEmbedLink(keyword);

        if (link) {
          // eslint-disable-next-line no-await-in-loop
          const newVideo = await addLinkToDatabase(link);
          logger.info(`Generated new video with rate-limited API calls: ${keyword}`);
          return { link: newVideo.link };
        }

        // Reduced retry delay since we have smarter caching now
        // eslint-disable-next-line no-await-in-loop
        await delay(RETRY_DELAY);
        // eslint-disable-next-line no-plusplus
        tries++;
      }

      // Final fallback
      const fallbackLink = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      const newFallbackVideo = await addLinkToDatabase(fallbackLink);
      logger.info('Used final fallback video');
      return { link: newFallbackVideo.link };
    } catch (error) {
      logger.error('Error generating video URL:', error);
      const fallbackLink = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      const newFallbackVideo = await addLinkToDatabase(fallbackLink);
      return { link: newFallbackVideo.link };
    } finally {
      isGeneratingVideo = false;
      pendingPromise = null;
    }
  })();

  return pendingPromise;
}

const getAllLinksFromDatabase = async () => {
  const videos = await Video.findAll({ attributes: ['id', 'link', 'createdAt'] });
  return videos.map((video) => video.toJSON());
};

const getByIdFromDatabase = async (id) => {
  const video = await Video.findOne({ where: { id }, attributes: ['id', 'link', 'createdAt'] });
  return video ? video.toJSON() : null;
};

const getLastVideoLink = async () => {
  try {
    const video = await Video.findOne({ order: [['createdAt', 'DESC']] });

    if (video) {
      logger.info('Found video:', video);
      return video.toJSON();
    }
    const { link } = await generateRandomLink();
    const newVideo = await addLinkToDatabase(link);
    return newVideo;
  } catch (error) {
    logger.error('Error fetching the last video link:', error);
    throw new Error('Error fetching the last video link');
  }
};

const updateLinkInDatabase = async (updatedVideo) => {
  const { id, link, createdAt } = updatedVideo;

  if (!id) throw new Error('ID is not provided');
  logger.info('Updating video with ID:', id);

  try {
    const video = await Video.findByPk(id);
    if (!video) throw new Error('Video not found');

    const formattedDate = moment(createdAt).isValid() ? moment(createdAt).toDate() : null;
    if (!formattedDate) throw new Error('Invalid date');

    await video.update({ link, createdAt: formattedDate });

    logger.info('Updated video:', video);

    return video.toJSON();
  } catch (error) {
    logger.error('Error updating video:', error.message);
    throw error;
  }
};

const deleteLinkFromDatabase = async (id) => {
  const result = await Video.destroy({ where: { id } });
  return result ? 1 : 0;
};

const generateAndStoreRandomVideo = async () => {
  try {
    const { link } = await generateRandomLink();
    const newVideo = await addLinkToDatabase(link);
    logger.info(`New video added: ${newVideo.link}`);
  } catch (err) {
    logger.error(`Error generating and storing video: ${err.message}`);
  }
};

module.exports = {
  generateRandomLink,
  addLinkToDatabase,
  getAllLinksFromDatabase,
  getByIdFromDatabase,
  getLastVideoLink,
  updateLinkInDatabase,
  deleteLinkFromDatabase,
  generateAndStoreRandomVideo,
  // Cache management functions
  getCacheStats: () => videoCacheService.getCacheStats(),
  clearCache: () => videoCacheService.clearCache()
};
