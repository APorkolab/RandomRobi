"use strict";
const axios = require('axios');
const database = require('../models/video');
const express = require('express');
const router = express.Router();
require('dotenv').config();

router.get('/', async (req, res) => {
	try {
		// Ellenőrzi, hogy volt-e kérés az elmúlt 24 órában
		const lastRequest = req.cookies && req.cookies.lastRequest ? new Date(req.cookies.lastRequest) : null;
		const currentTime = new Date();
		const lastVideoLink = await database.getLastVideoLink();

		if (lastVideoLink) {
			const lastVideoDate = new Date(lastVideoLink.created_at);
			if (lastRequest && isSameDay(lastRequest, lastVideoDate)) {
				// Ha volt kérés az elmúlt 24 órában, visszaadja az előző videó linkjét
				res.send(lastVideoLink);
			} else {
				// Ha több mint 24 óra telt el az utolsó kérés óta, új véletlenszerű videót generál
				const videoData = await getRandomVideo();
				await database.addLinkToDatabase(videoData);
				// Az új videó linkjének megjelenítése a kliensen
				res.send(videoData);
			}
		} else {
			// Ha még nincs videó az adatbázisban, újat generál
			const videoData = await getRandomVideo();
			await database.addLinkToDatabase(videoData);
			// Az új videó linkjének megjelenítése a kliensen
			res.send(videoData);
		}

		// A kérés idejének elmentése a sütibe
		res.cookie('lastRequest', currentTime.toISOString(), {
			maxAge: 24 * 60 * 60 * 1000,
			httpOnly: true
		});
	} catch (err) {
		console.error(err);
		res.status(500).send('Belső szerverhiba');
	}
});


async function getRandomVideo() {
	require('dotenv').config();
	const categoryId = Math.floor(Math.random() * 44) + 1;
	// console.log('categoryId:', categoryId);
	const maxResults = 1; // number of results to return
	const maxTries = 5; // maximum number of retries

	let response = null;
	let tries = 0;

	while (!response && tries < maxTries) {
		try {
			response = await axios.get('https://youtube.googleapis.com/youtube/v3/search', {
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
				return null;
			}

		} catch (error) {
			console.log(error);
			tries++;
		}
	}

	console.log(`Failed to retrieve data after ${maxTries} attempts`);
	return 'https://www.youtube.com/watch?v=1fwJ8H5wWCU';
}

module.exports = {
	getRandomVideo
};