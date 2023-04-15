"use strict";
const axios = require('axios');
const crypto = require('crypto');

const express = require('express');
// const router = express.Router();
// const BASE_API_URL = "https://www.googleapis.com/youtube/v3/search";




const MAX_RESULTS = 1; // number of results to return
const MAX_TRIES = 5; // maximum number of retries
const RETRY_DELAY = 1000; // delay between retries in milliseconds
const BASE_API_URL = "https://youtube.googleapis.com/youtube/v3/search";
let isGeneratingVideo = false;

async function getRandomVideo() {
	require('dotenv').config();
	// Check if another getRandomVideo call is already in progress
	if (isGeneratingVideo) {
		throw new Error("Video generation already in progress");
	}

	isGeneratingVideo = true; // set flag to prevent additional requests

	try {
		if (!process.env.API_KEY) {
			throw new Error("API_KEY environment variable not set");
		}

		const categoryId = crypto.randomInt(1, 44);

		await new Promise(resolve => setTimeout(resolve, 1000));

		const url = `${BASE_API_URL}?part=snippet&maxResults=${MAX_RESULTS}&order=title&type=video&videoCategoryId=${categoryId}&key=${process.env.API_KEY}`;

		const response = await axios.get(url);

		if (response.data.items && response.data.items.length > 0) {
			const videoId = response.data.items[0].id.videoId;
			console.log(`https://www.youtube.com/embed/${videoId}`);
			return `https://www.youtube.com/embed/${videoId}`;
		} else {
			console.log("No video found or the API does not respond");
			throw new Error("No video found or the API does not respond");
		}
	} catch (error) {
		console.log(error);
		throw error;
	} finally {
		isGeneratingVideo = false; // reset flag so new requests can be processed
	}
}

module.exports = {
	getRandomVideo
};