"use strict";
const axios = require('axios');
const crypto = require('crypto');

const express = require('express');
const router = express.Router();
require('dotenv').config();


// async function getRandomVideo() {
// 	require('dotenv').config();
// 	const categoryId = crypto.randomInt(1, 44);
// 	const maxResults = 1; // number of results to return
// 	const maxTries = 5; // maximum number of retries

// 	let response = null;
// 	let tries = 0;

// 	while (!response && tries < maxTries) {
// 		try {
// 			response = await axios.get('https://youtube.googleapis.com/youtube/v3/search', {
// 				params: {
// 					part: 'snippet',
// 					maxResults: maxResults,
// 					order: 'title',
// 					type: 'video',
// 					videoCategoryId: categoryId,
// 					key: process.env.API_KEY
// 				},
// 				headers: {
// 					'Accept': 'application/json'
// 				}
// 			});

// 			if (response.data.items && response.data.items.length > 0) {
// 				const videoId = response.data.items[0].id.videoId;
// 				console.log(`https://www.youtube.com/embed/${videoId}`);
// 				return `https://www.youtube.com/embed/${videoId}`;
// 			} else {
// 				console.log("No video found or the API does not respond");
// 				tries++;
// 			}
// 		} catch (error) {
// 			console.log(error);
// 			tries++;
// 		}
// 	}

// 	console.log(`Failed to retrieve data after ${maxTries} attempts`);
// 	return 'https://www.youtube.com/embed/1fwJ8H5wWCU';
// }



async function getRandomVideo() {
	require('dotenv').config();
	const categoryId = crypto.randomInt(1, 44);
	const maxResults = 1; // number of results to return
	const maxTries = 5; // maximum number of retries
	const retryDelay = 1000; // delay between retries in milliseconds

	let tries = 0;
	while (tries < maxTries) {
		try {
			const response = await axios.get('https://youtube.googleapis.com/youtube/v3/search', {
				params: {
					part: 'snippet',
					maxResults: maxResults,
					order: 'title',
					type: 'video',
					videoCategoryId: categoryId,
					key: process.env.API_KEY
				},
				headers: {
					'Accept': 'application/json'
				}
			});

			if (response.data.items && response.data.items.length > 0) {
				const videoId = response.data.items[0].id.videoId;
				console.log(`https://www.youtube.com/embed/${videoId}`);
				return `https://www.youtube.com/embed/${videoId}`;
			} else {
				console.log("No video found or the API does not respond");
				tries++;
			}
		} catch (error) {
			console.log(error);
			tries++;
		}

		// Wait before retrying
		await new Promise(resolve => setTimeout(resolve, retryDelay));
	}

	console.log(`Failed to retrieve data after ${maxTries} attempts`);
	return 'https://www.youtube.com/embed/1fwJ8H5wWCU';
}

module.exports = {
	getRandomVideo
};