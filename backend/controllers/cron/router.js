/**
 * @swagger
 * /cron/run:
 *   get:
 *     summary: Run the cron job manually to generate and store a random video.
 *     tags: [Cron]
 *     responses:
 *       200:
 *         description: The cron job has been successfully applied.
 *       500:
 *         description: Something went wrong during the cron job execution.
 */
const express = require('express');
const router = express.Router();
const {
	generateAndStoreRandomVideo
} = require('../../services/videoService');

router.get('/run', async (req, res) => {
	const options = {
		timeZone: 'Europe/Budapest',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	};

	try {
		await generateAndStoreRandomVideo();
		const formattedDate = new Date().toLocaleString('hu-HU', options);
		res.status(200).send(`The cron job has been successfully applied at ${formattedDate}`);
	} catch (err) {
		console.error('Error running cron job manually:', err);
		const formattedDate = new Date().toLocaleString('hu-HU', options);
		res.status(500).send(`Something went wrong at ${formattedDate}`);
	}
});

module.exports = router;