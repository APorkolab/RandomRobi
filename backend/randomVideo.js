const axios = require('axios');
const database = require('./database');
const express = require('express');
const router = express.Router();
require('dotenv').config();

router.get('/random-video', async (req, res) => {
	try {
		// Ellenőrzi, hogy volt-e kérés az elmúlt 24 órában
		const lastRequest = req.cookies && req.cookies.lastRequest ? new Date(req.cookies.lastRequest) : null;
		const currentTime = new Date();
		const diffTime = (lastRequest && currentTime.getTime() - lastRequest.getTime()) / (1000 * 60 * 60);
		const lastVideoLink = await database.getLastVideoLink();

		if (lastVideoLink && diffTime < 24) {
			// Ha volt kérés az elmúlt 24 órában, visszaadja az előző videó linkjét
			const row = await database.getLastVideoLink();
			res.render('video', {
				video: row.link
			});
		} else {
			// Ha több mint 24 óra telt el az utolsó kérés óta, új véletlenszerű videót generál
			const url = await getRandomVideo();
			console.log(url);
			await database.insertNewVideoLink(url);
			// Az új videó linkjének megjelenítése a kliensen
			res.render('video', {
				video: url
			});

			const categories = [
				'1',
				'2',
				'10',
				'15',
				'17',
				'19',
				'20',
				'22',
				'23',
				'24',
				'25',
				'26',
				'27',
				'28',
				'29',
				'30'
			];
			const categoryId =
				categories[Math.floor(Math.random() * categories.length)];

			// YouTube API hívás az új videó linkjének lekéréséhez
			const youtubeApiKey = process.env.YOUTUBE_API_KEY;
			const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&order=date&type=video&videoCategoryId=${categoryId}&key=${youtubeApiKey}`;

			const response = await axios.get(apiUrl);
			const video = response.data.items[0];
			const link = `https://www.youtube.com/watch?v=${video.id.videoId}`;

			// Az új videó linkjének mentése az adatbázisba
			await database.insertNewVideoLink(link);

			// A következő kérés cookie-jainak beállítása
			res.cookie('lastRequest', new Date(), {
				maxAge: 24 * 60 * 60 * 1000, // 24 óra
				httpOnly: true,
				sameSite: 'strict'
			});
		}
	} catch (err) {
		console.error(err);
		res.status(500).send('Belső szerverhiba');
	}
});


async function getRandomVideo() {
	const {
		google
	} = require('googleapis');
	const youtube = google.youtube({
		version: 'v3',
		auth: process.env.YOUTUBE_API_KEY
	});

	const categories = ['1', '2', '10', '15', '17', '19', '20', '22', '23', '24', '25', '26', '27', '28', '29', '30'];
	const categoryId = categories[Math.floor(Math.random() * categories.length)];
	const maxResults = 1; // number of results to return

	const response = await youtube.search.list({
		part: 'id',
		type: 'video',
		videoCategoryId: categoryId,
		maxResults: maxResults,
		order: 'random' // randomize the order of results
	});
	const videoId = response.data.items[0].id.videoId;
	return `https://www.youtube.com/watch?v=${videoId}`;
}
module.exports = getRandomVideo;