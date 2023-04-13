// const task = cron.schedule('0 0 0,12 * * *', async () => {
const cron = require('node-cron');
const randomVideo = require('../services/randomVideoService');
const videoSchema = require('../models/video');

const task = async () => {
	try {
		await cron.schedule('0 0 0,12 * * *', async function () {
			// await cron.schedule('* * * * *', async function () {
			let tries = 0;
			let video = null;
			while (!video && tries < 3) {
				try {
					video = await randomVideo.getRandomVideo();
					console.log('The video link generating has been done.');
				} catch (error) {
					console.error(error);
					tries++;
				}
			}

			if (video) {
				try {
					const result = await videoSchema.addLinkToDatabase(video);
					console.log(`New video link has been added to the database: ${result.link}`);
				} catch (error) {
					console.error(error);
				}
			}
		});

	} catch (err) {
		console.log(err.message);
	}

}

module.exports = {
	task
}