const axios = require('axios');
const database = require('./database');
require('dotenv').config();

// Check if there was a request in the last 24 hours
const lastRequest = new Date(req.cookies.lastRequest);
const currentTime = new Date();
const diffTime = (currentTime.getTime() - lastRequest.getTime()) / (1000 * 60 * 60);

if (diffTime < 24) {
	// If there was a request in the last 24 hours, return the previous video link
	database.getLastVideoLink((err, row) => {
		if (err) {
			console.error(err);
			res.status(500).send('Internal server error');
		} else {
			res.render('video', {
				video: row.link
			});
		}
	});
} else {
	// If more than 24 hours have passed since the last request, generate a new random video
	getRandomVideo()
		.then((url) => {
			console.log(url);
			database.insertNewVideoLink(url, (err) => {
				if (err) {
					console.error(err);
					res.status(500).send('Internal server error');
				} else {
					// Display the new video link on the client
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

					// YouTube API call to retrieve the new video link
					const youtubeApiKey = process.env.YOUTUBE_API_KEY;
					const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&order=date&type=video&videoCategoryId=${categoryId}&key=${youtubeApiKey}`;

					axios
						.get(apiUrl)
						.then((response) => {
							const video = response.data.items[0];
							const link = `https://www.youtube.com/watch?v=${video.id.videoId}`;

							// Save the new video link to the database
							database.insertNewVideoLink(link, (err) => {
								if (err) {
									console.error(err);
								}
							});

							// Set the cookies for the next request
							res.cookie('lastRequest', new Date(), {
								maxAge: 24 * 60 * 60 * 1000, // 24 hours
								httpOnly: true,
								sameSite: 'strict'
							});
						})
						.catch((err) => {
							console.error(err);
							res.status(500).send('Internal server error');
						});
				}
			});
		})
		.catch((error) => {
			console.error(error);
			res.status(500).send('Internal server error');
		});
}

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