const dotenv = require('dotenv');
const logger = require('./logger/logger');
const app = require('./server');
const port = process.env.PORT || 3000;
const http = require('http');
const randomVideo = require('./services/randomVideoService');
const database = require('./models/video');

const {
	CronJob
} = require('cron');
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

server.listen(port, () => {
	console.log(`App listening at http://localhost:${port}`);
});

// Schedule cron job to update video every 24 hours
// const task = new CronJob('0 0 * * ', async () => {
const task = new CronJob('1 0 * * *', async () => {
	try {
		const videoData = await randomVideo.getRandomVideo();
		await database.addLinkToDatabase(videoData);
	} catch (error) {
		console.error(error);
	}
}, null, true, 'Europe/Budapest');

task.start();