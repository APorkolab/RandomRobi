const dotenv = require('dotenv');
const logger = require('./logger/logger');
const app = require('./server');
const port = process.env.PORT || 3000;
const http = require('http');
const randomVideo = require('./services/randomVideoService');
const videoSchema = require('./models/video');

const cron = require('node-cron');
const server = http.createServer(app);

const result = dotenv.config();

if (result.error) {
	logger.error(result.error);
	process.exit(1);
}

if (!process.env.API_KEY || !process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD) {
	logger.error('Database credentials not found in environment variables.');
	process.exit(1);
}


// const task = cron.schedule('0 0 0,12 * * *', async () => {

const task = cron.schedule('*/30 * * * * *', async () => {
	console.log('Tarara!');
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

}, null, true, 'Europe/Budapest');
task.start();

server.listen(port, () => {
	console.log(`App listening at http://localhost:${port}`);
});