"use strict";
const axios = require('axios');
const database = require('./database');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
	try {
		// // Ellenőrzi, hogy volt-e kérés az elmúlt 24 órában
		const lastRequest = req.cookies && req.cookies.lastRequest ? new Date(req.cookies.lastRequest) : null;
		const currentTime = new Date();
		const diffTime = (lastRequest && currentTime.getTime() - lastRequest.getTime()) / (1000 * 60 * 60);
		const lastVideoLink = await database.getLastVideoLink();

		if (lastVideoLink && diffTime < 24) {
			// Ha volt kérés az elmúlt 24 órában, visszaadja az előző videó linkjét
			res.send(videoData);
		} else {
			// Ha több mint 24 óra telt el az utolsó kérés óta, új véletlenszerű videót generál
			const videoData = await getRandomVideo();
			await database.addLinkToDatabase(videoData);
			// Az új videó linkjének megjelenítése a kliensen
			res.send(videoData);
		}
	} catch (err) {
		console.error(err);
		res.status(500).send('Belső szerverhiba');
	}
});



async function getRandomVideo() {

	const categoryId = Math.floor(Math.random() * 44) + 1;
	// console.log('categoryId:', categoryId);
	const maxResults = 1; // number of results to return

	try {
		const response = await axios.get('https://youtube.googleapis.com/youtube/v3/search', {
			params: {
				part: 'snippet',
				maxResults: maxResults,
				order: 'title',
				type: 'video',
				videoCategoryId: categoryId,
				key: process.env.API_KEYY || 'AIzaSyDOWXsCeRJxKYpAql0lHTlqhnRAX7BG6Rs'
			},
			headers: {
				'Accept': 'application/json'
			}
		});
		// console.log(response.data.items[0].id.videoId);
		// return response.data.items[0].id.videoId;

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
		return null; // hiba esetén null érték visszaadása
	}
}




module.exports = {
	getRandomVideo
};