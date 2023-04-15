const cron = require('node-cron');
const randomVideo = require('../services/randomVideoService');
const videoSchema = require('../models/video');

const task = async () => {
	try {
		await cron.schedule('0 */12 * * *', async function () {
			this.stop();
			let tries = 0;
			let video = null;
			while (!video && tries < 3) {
				try {

					video = await randomVideo.getRandomVideo();
					console.log('Video link generation successful.');
				} catch (error) {
					console.error(error);
					tries++;
				}
			}

			if (video) {
				try {
					// Call the addLinkToDatabase method
					const result = await videoSchema.addLinkToDatabase(video);
					console.log(`New video link added to database: ${result.link}`);
				} catch (error) {
					console.error(error);
				}
			}

			// Enable the schedule
			this.start();
		}, {
			scheduled: true,
			timezone: "Europe/Budapest"
		});

	} catch (err) {
		console.log(err.message);
	}
};

// Export the corrected method
module.exports = {
	task
};