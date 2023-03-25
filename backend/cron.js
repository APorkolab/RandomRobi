"use strict";
const cron = require('cron');
const randomVideo = require('./randomVideo');
const database = require('./database');

// Hozzuk létre a feladatot, amely minden 24 órában lefut
const task = new cron.CronJob('0 0 */24 * * *', async function () {
	try {
		// Futtatjuk a randomVideo modulunkat és eltároljuk az eredményt az adatbázisban
		const video = await randomVideo.getRandomVideo();
		const result = await database.addLinkToDatabase(video);
		console.log(`New video link has been added to the database: ${result.link}`);
	} catch (error) {
		console.error(error);
	}
});

// Indítsuk el a feladatot
module.exports = task.start.bind(task);