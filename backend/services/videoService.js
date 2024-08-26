const axios = require('axios');
const puppeteer = require('puppeteer');
const Video = require('../models/video');
const {
	MAX_TRIES,
	RETRY_DELAY
} = require('../config/constants');
const logger = require('../logger/logger');

let isGeneratingVideo = false;
let browserInstance = null;

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
				'--proxy-server=your-proxy-server-here', // Proxy szerver hozzáadása
			],
			defaultViewport: {
				width: 1280,
				height: 720
			}
		});
	}
}

async function getRandomYouTubeVideoEmbedLink(keyword) {
	const page = await browserInstance.newPage();

	try {
		await page.setRequestInterception(true);
		page.on('request', (req) => {
			if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
				req.abort();
			} else {
				req.continue();
			}
		});

		await page.goto(`https://www.youtube.com/results?search_query=${keyword}`, {
			waitUntil: 'networkidle2'
		});
		await page.waitForSelector('ytd-video-renderer', {
			timeout: 5000
		});

		const videoLinks = await page.evaluate(() => {
			const links = Array.from(document.querySelectorAll('ytd-video-renderer a#video-title'));
			return links.map(link => link.href);
		});

		if (videoLinks.length === 0) {
			throw new Error('No videos found for the generated keyword');
		}

		const randomIndex = Math.floor(Math.random() * videoLinks.length);
		const videoUrl = videoLinks[randomIndex];
		const videoIdMatch = videoUrl.match(/v=([^&]+)/);
		const videoId = videoIdMatch ? videoIdMatch[1] : null;

		if (!videoId) {
			throw new Error('Failed to extract video ID');
		}

		return `https://www.youtube.com/embed/${videoId}`;
	} finally {
		await page.close();
	}
}

async function generateRandomLink() {
	if (isGeneratingVideo) {
		throw new Error("Video generation already in progress");
	}

	isGeneratingVideo = true;

	try {
		await initializeBrowser();

		const keywords = await Promise.all(Array.from({
			length: MAX_TRIES
		}, getRandomKeyword));
		const tasks = keywords.map(keyword => getRandomYouTubeVideoEmbedLink(keyword));

		const results = await Promise.allSettled(tasks);
		const validVideoUrl = results.find(result => result.status === 'fulfilled')?.value;


		if (!validVideoUrl) {
			throw new Error("Failed to generate a valid video URL");
		}

		return {
			link: validVideoUrl
		};
	} catch (error) {
		logger.error('Error generating video URL:', error);
		throw error;
	} finally {
		isGeneratingVideo = false;
	}
}

const addLinkToDatabase = async (link, createdAt = new Date()) => {
	if (!link) throw new Error('Link is missing');
	return await Video.create({
		link,
		createdAt
	});
};

const getAllLinksFromDatabase = async () => {
	const videos = await Video.findAll({
		attributes: ['id', 'link', 'createdAt']
	});
	return videos.map(video => video.toJSON());
};

const getByIdFromDatabase = async (id) => {
	const video = await Video.findOne({
		where: {
			id
		},
		attributes: ['id', 'link', 'createdAt']
	});
	return video ? video.toJSON() : null;
};

const getLastVideoLink = async () => {
	try {
		const video = await Video.findOne({
			order: [
				['createdAt', 'DESC']
			]
		});

		if (video) {
			logger.info('Found video:', video);
			return video.toJSON();
		} else {
			const {
				link
			} = await generateRandomLink();
			const newVideo = await addLinkToDatabase(link);
			return newVideo.toJSON();
		}
	} catch (error) {
		logger.error('Error fetching the last video link:', error);
		throw new Error('Error fetching the last video link');
	}
};

const updateLinkInDatabase = async (updatedVideo) => {
	const {
		id,
		link,
		createdAt
	} = updatedVideo;

	if (!id) throw new Error('ID is not provided');
	logger.info('Updating video with ID:', id);

	try {
		const video = await Video.findByPk(id);
		if (!video) throw new Error('Video not found');

		const formattedDate = moment(createdAt).isValid() ? moment(createdAt).format('YYYY-MM-DD HH:mm:ss') : null;
		if (!formattedDate) throw new Error('Invalid date');

		await Video.update({
			link,
			createdAt: formattedDate
		}, {
			where: {
				id
			}
		});

		const updatedVideo = await Video.findByPk(id);
		logger.info('Updated video:', updatedVideo);

		return updatedVideo.toJSON();
	} catch (error) {
		logger.error('Error updating video:', error.message);
		throw new Error(error.message);
	}
};

const deleteLinkFromDatabase = async (id) => {
	const result = await Video.destroy({
		where: {
			id
		}
	});
	return result ? 1 : 0;
};

const generateAndStoreRandomVideo = async () => {
	try {
		const {
			link
		} = await generateRandomLink();
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