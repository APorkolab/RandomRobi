const cron = require('cron');
const randomVideo = require('./randomVideo');
const database = require('./database');

// Hozzuk létre a feladatot, amely minden 24 órában lefut
const task = new cron.CronJob('0 0 */24 * * *', async function () {
	try {
		// Futtatjuk a randomVideo modulunkat és eltároljuk az eredményt az adatbázisban
		const video = await randomVideo.getRandomVideo();
		await database.addLinkToDatabase(video);
		console.log(`New video link has been added to the database: ${video}`);
	} catch (error) {
		console.error(error);
	}
});

// Indítsuk el a feladatot
task.start();

module.exports = task;