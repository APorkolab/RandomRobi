const axios = require('axios');
const Video = require('../models/video');
const moment = require('moment');
const {
    MAX_TRIES,
    RETRY_DELAY
} = require('../config/constants');
const logger = require('../logger/logger');

let isGeneratingVideo = false;
let pendingPromise = null;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getRandomKeyword() {
    try {
        const response = await axios.get('https://random-word-api.herokuapp.com/word?number=1', {
            timeout: 5000 // 5 second timeout
        });
        return response.data[0];
    } catch (error) {
        logger.error('Error fetching random keyword:', error);
        // Return a fallback keyword instead of throwing
        const fallbackKeywords = ['music', 'technology', 'science', 'gaming', 'cooking', 'travel'];
        const randomIndex = Math.floor(Math.random() * fallbackKeywords.length);
        return fallbackKeywords[randomIndex];
    }
}

async function getRandomYouTubeVideoEmbedLink(keyword) {
    try {
        const response = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}`);
        const html = response.data;

        // Find the ytInitialData JSON
        const match = html.match(/var ytInitialData = (.*?);<\/script>/);
        if (!match || !match[1]) {
            logger.warn(`No ytInitialData found for keyword: ${keyword}`);
            return null;
        }

        const ytInitialData = JSON.parse(match[1]);
        const contents = ytInitialData.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents;

        const videoLinks = contents
            .filter(item => item.videoRenderer)
            .map(item => item.videoRenderer.videoId);

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
        logger.warn("Video generation already in progress. Returning pending promise.");
        return pendingPromise;
    }

    isGeneratingVideo = true;

    pendingPromise = (async () => {
        try {
            let tries = 0;
            while (tries < MAX_TRIES) {
                const keyword = await getRandomKeyword();
                const link = await getRandomYouTubeVideoEmbedLink(keyword);

                if (link) {
                    const newVideo = await addLinkToDatabase(link);
                    return { link: newVideo.link };
                }

                await delay(RETRY_DELAY);
                tries++;
            }

            const fallbackLink = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
            await addLinkToDatabase(fallbackLink);
            return { link: fallbackLink };

        } catch (error) {
            logger.error('Error generating video URL:', error);
            const fallbackLink = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
            await addLinkToDatabase(fallbackLink);
            return { link: fallbackLink };
        } finally {
            isGeneratingVideo = false;
            pendingPromise = null;
        }
    })();

    return pendingPromise;
}

const addLinkToDatabase = async (link, createdAt = new Date()) => {
    if (!link) throw new Error('Link is missing');
    const newVideo = await Video.create({ link, createdAt });
    return newVideo.toJSON();
};

const getAllLinksFromDatabase = async () => {
    const videos = await Video.findAll({ attributes: ['id', 'link', 'createdAt'] });
    return videos.map(video => video.toJSON());
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
        } else {
            const { link } = await generateRandomLink();
            const newVideo = await addLinkToDatabase(link);
            return newVideo;
        }
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