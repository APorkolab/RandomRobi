const axios = require('axios');
const moment = require('moment');
const Video = require('../models/video');
const {
  MAX_TRIES,
  RETRY_DELAY
} = require('../config/constants');
const logger = require('../logger/logger');
const { getRandomWord } = require('../utils/wordGenerator');

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
  try {
    // Try Datamuse API first (free, reliable, no API key needed)
    const patterns = ['a*', 'b*', 'c*', 'd*', 'e*', 'f*', 'g*', 'h*', 'i*', 'j*', 'k*', 'l*', 'm*', 'n*', 'o*', 'p*', 'r*', 's*', 't*', 'u*', 'v*', 'w*'];
    const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
    const maxWords = Math.floor(Math.random() * 100) + 50; // Get 50-150 words
    
    const response = await axios.get(`https://api.datamuse.com/words?sp=${randomPattern}&max=${maxWords}`, {
      timeout: 5000
    });
    
    if (response.data && response.data.length > 0) {
      const randomIndex = Math.floor(Math.random() * response.data.length);
      const keyword = response.data[randomIndex].word;
      logger.info(`Generated random keyword from Datamuse API: ${keyword}`);
      return keyword;
    }
    
    // Fallback to local word generator if API doesn't return results
    const localKeyword = getRandomWord();
    logger.info(`Using local word generator fallback: ${localKeyword}`);
    return localKeyword;
    
  } catch (error) {
    logger.warn('Datamuse API unavailable, using local word generator:', error.message);
    
    // Fallback to local word generator
    try {
      const localKeyword = getRandomWord();
      logger.info(`Using local word generator: ${localKeyword}`);
      return localKeyword;
    } catch (localError) {
      logger.error('Error with local word generator:', localError);
      // Final fallback to hardcoded keywords
      const fallbackKeywords = ['music', 'technology', 'science', 'gaming', 'cooking', 'travel', 'art', 'sports', 'nature', 'history'];
      const randomIndex = Math.floor(Math.random() * fallbackKeywords.length);
      const fallbackKeyword = fallbackKeywords[randomIndex];
      logger.info(`Using hardcoded fallback keyword: ${fallbackKeyword}`);
      return fallbackKeyword;
    }
  }
}

async function getRandomYouTubeVideoEmbedLink(keyword) {
  try {
    const response = await axios.get(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}`
    );
    const html = response.data;

    // Find the ytInitialData JSON
    const match = html.match(/var ytInitialData = (.*?);<\/script>/);
    if (!match || !match[1]) {
      logger.warn(`No ytInitialData found for keyword: ${keyword}`);
      return null;
    }

    const ytInitialData = JSON.parse(match[1]);
    const { contents } = ytInitialData
      .contents.twoColumnSearchResultsRenderer
      .primaryContents.sectionListRenderer.contents[0].itemSectionRenderer;

    const videoLinks = contents
      .filter((item) => item.videoRenderer)
      .map((item) => item.videoRenderer.videoId);

    if (videoLinks.length === 0) {
      logger.warn(`No videos found for keyword: ${keyword}`);
      return null;
    }

    const randomIndex = Math.floor(Math.random() * videoLinks.length);
    const videoId = videoLinks[randomIndex];

    if (!videoId) {
      throw new Error('Failed to extract video ID');
    }

    return `https://www.youtube.com/embed/${videoId}`;
  } catch (error) {
    logger.error('Error retrieving video link:', error.message);
    return null;
  }
}

async function generateRandomLink() {
  if (isGeneratingVideo) {
    logger.warn('Video generation already in progress. Returning pending promise.');
    return pendingPromise;
  }

  isGeneratingVideo = true;

  pendingPromise = (async () => {
    try {
      let tries = 0;
      while (tries < MAX_TRIES) {
        // eslint-disable-next-line no-await-in-loop
        const keyword = await getRandomKeyword();
        // eslint-disable-next-line no-await-in-loop
        const link = await getRandomYouTubeVideoEmbedLink(keyword);

        if (link) {
          // eslint-disable-next-line no-await-in-loop
          const newVideo = await addLinkToDatabase(link);
          return { link: newVideo.link };
        }

        // eslint-disable-next-line no-await-in-loop
        await delay(RETRY_DELAY);
        // eslint-disable-next-line no-plusplus
        tries++;
      }

      const fallbackLink = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      const newFallbackVideo = await addLinkToDatabase(fallbackLink);
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
  generateAndStoreRandomVideo
};
