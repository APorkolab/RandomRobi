/**
 * @swagger
 * /cron/run:
 *   get:
 *     summary: Run the cron job manually to generate and store a random video.
 *     tags: [Cron]
 *     responses:
 *       200:
 *         description: The cron job has been successfully applied.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 link:
 *                   type: string
 *                   description: URL of the generated video.
 *                 message:
 *                   type: string
 *                   example: "A cron feladat sikeresen lefutott [dátum]kor. Generált videó: [link]"
 *                   description: Success message.
 *       500:
 *         description: Something went wrong during the cron job execution.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Something went wrong at [dátum]"
 *                   description: Error message.
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
		const result = await generateAndStoreRandomVideo();
		const formattedDate = new Date().toLocaleString('hu-HU', options);
		if (result) {
			res.status(200).send(`A cron feladat sikeresen lefutott ${formattedDate}-kor. Generált videó: ${result.link}`);
		} else {
			res.status(500).send(`A cron feladat lefutott ${formattedDate}-kor, de nem generált új videót.`);
		}
	} catch (err) {
		console.error('Error running cron job manually:', err);
		const formattedDate = new Date().toLocaleString('hu-HU', options);
		res.status(500).send(`Something went wrong at ${formattedDate}`);
	}
});

module.exports = router;