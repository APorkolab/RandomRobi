const axios = require('axios');
const puppeteer = require('puppeteer');
const Video = require('../models/video');
const {
    MAX_TRIES,
    RETRY_DELAY
} = require('../config/constants');
const logger = require('../logger/logger');

let isGeneratingVideo = false;
let pendingPromise = null;
let browserInstance = null;
let pageInstance = null;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getRandomKeyword() {
    try {
        const response = await axios.get('https://random-word-api.herokuapp.com/word?number=1');
        return response.data[0];
    } catch (error) {
        logger.error('Error fetching random keyword:', error);
        throw new Error('Failed to fetch random keyword');
    }
}

async function initializeBrowser() {
    if (!browserInstance) {
        browserInstance = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--window-size=1280,720',
            ],
            defaultViewport: {
                width: 1280,
                height: 720
            }
        });
        pageInstance = await browserInstance.newPage();
        await pageInstance.setRequestInterception(true);
        pageInstance.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });
    }
}

async function getRandomYouTubeVideoEmbedLink(keyword) {
    try {
        await pageInstance.goto(`https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}`, {
            waitUntil: 'domcontentloaded'
        });

        await pageInstance.waitForSelector('ytd-video-renderer a#video-title', { timeout: 10000 });

        const videoLinks = await pageInstance.$$eval('ytd-video-renderer a#video-title', links =>
            links.map(link => link.href).filter(link => link.includes('watch?v='))
        );

        if (videoLinks.length === 0) {
            logger.warn(`No videos found for keyword: ${keyword}`);
            return null;
        }

        const randomIndex = Math.floor(Math.random() * videoLinks.length);
        const videoUrl = videoLinks[randomIndex];
        const videoIdMatch = videoUrl.match(/v=([^&]+)/);
        const videoId = videoIdMatch ? videoIdMatch[1] : null;

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
        return pendingPromise; // Visszatér az éppen folyamatban lévő ígérettel
    }

    isGeneratingVideo = true;

    pendingPromise = (async () => {
        try {
            await initializeBrowser();

            let tries = 0;
            while (tries < MAX_TRIES) {
                const keyword = await getRandomKeyword();
                const link = await getRandomYouTubeVideoEmbedLink(keyword);

                if (link) {
                    return { link };
                }

                await delay(RETRY_DELAY);
                tries++;
            }

            // Ha nem sikerül linket szerezni, adjuk vissza a Rick Astley linket
            return { link: 'https://www.youtube.com/embed/dQw4w9WgXcQ' };

        } catch (error) {
            logger.error('Error generating video URL:', error);
            // Ha hiba történik, adjuk vissza a Rick Astley linket
            return { link: 'https://www.youtube.com/embed/dQw4w9WgXcQ' };
        } finally {
            isGeneratingVideo = false;
            pendingPromise = null; // Reseteljük a pending promise-t a folyamat végén
        }
    })();

    return pendingPromise;
}

const addLinkToDatabase = async (link, createdAt = new Date()) => {
    if (!link) throw new Error('Link is missing');
    return await Video.create({ link, createdAt });
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
            return newVideo.toJSON();
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

        const formattedDate = moment(createdAt).isValid() ? moment(createdAt).format('YYYY-MM-DD HH:mm:ss') : null;
        if (!formattedDate) throw new Error('Invalid date');

        await Video.update({ link, createdAt: formattedDate }, { where: { id } });

        const updatedVideo = await Video.findByPk(id);
        logger.info('Updated video:', updatedVideo);

        return updatedVideo.toJSON();
    } catch (error) {
        logger.error('Error updating video:', error.message);
        throw new Error(error.message);
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