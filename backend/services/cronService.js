const cron = require('node-cron');
const {
	generateAndStoreRandomVideo
} = require('./videoService');
const logger = require('./logger');

// Ütemezett feladat minden 12 órában
cron.schedule('0 0 */12 * * *', async () => {
	try {
		await generateAndStoreRandomVideo();
		logger.info('Cron job successfully executed');
	} catch (error) {
		logger.error('Error running cron job:', error);
	}
});

module.exports = cron;