const cron = require('cron');
const randomVideo = require('./randomVideo');
const database = require('./database');

// Hozzuk létre a feladatot, amely minden 24 órában lefut
const task = new cron.CronJob({
	cronTime: '0 0 */24 * * *',
	onTick: async function () {
		try {
			const video = await randomVideo.getRandomVideo();
			const result = await database.addLinkToDatabase(video);
			console.log(`New video link has been added to the database: ${result.link}`);
		} catch (error) {
			console.error(error);
		}
	},
	start: true,
	timeZone: 'Europe/Budapest'
});

module.exports = task;