const randomVideo = require('../services/randomVideoService');
const videoSchema = require('../models/video');

const cronJob = async () => {
	try {
		let tries = 0;
		let video = null;
		while (!video && tries < 3) {
			try {
				video = await randomVideo.getRandomVideo();
				console.log('Video link generation successful.');
				if (video) {
					try {
						const result = await videoSchema.addLinkToDatabase(video);
						console.log(`New video link added to database: ${result.link}`);
					} catch (error) {
						console.error(error);
					}
				}
			} catch (err) {
				console.error(err.message);
			}
			tries++;
		}
	} catch (err) {
		console.error(err.message);
	}
};


module.exports = {
	cronJob
};