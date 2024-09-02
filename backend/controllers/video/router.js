/**
 * @swagger
 * /video/all:
 *   get:
 *     summary: Retrieve all video links from the database
 *     tags: [Videos]
 *     responses:
 *       200:
 *         description: A list of video links
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   link:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Error retrieving video links
 */

/**
 * @swagger
 * /video/daily:
 *   post:
 *     summary: Add a new video link to the database
 *     tags: [Videos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               link:
 *                 type: string
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Video link added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 record:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     link:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Error adding video link
 */

/**
 * @swagger
 * /video/{id}:
 *   put:
 *     summary: Update an existing video link in the database
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the video link to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               link:
 *                 type: string
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Video link updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 record:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     link:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Video not found
 *       500:
 *         description: Error updating video link
 */

/**
 * @swagger
 * /video/{id}:
 *   delete:
 *     summary: Delete a video link from the database
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the video link to delete
 *     responses:
 *       200:
 *         description: Video link deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Video not found
 *       500:
 *         description: Error deleting video link
 */

/**
 * @swagger
 * /video/latest:
 *   get:
 *     summary: Retrieve the latest video link from the database
 *     tags: [Videos]
 *     responses:
 *       200:
 *         description: The latest video link
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 link:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Error retrieving the latest video link
 */

/**
 * @swagger
 * /video/random:
 *   get:
 *     summary: Generate and retrieve a random video link
 *     tags: [Videos]
 *     responses:
 *       200:
 *         description: A random video link
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 link:
 *                   type: string
 *       500:
 *         description: Error retrieving random video link
 */
const express = require('express');
const router = express.Router();
const {
	getLastVideoLink,
	generateRandomLink,
	getAllLinksFromDatabase,
	addLinkToDatabase,
	updateLinkInDatabase,
	deleteLinkFromDatabase,
	getLinkById
} = require('../../services/videoService');

router.get('/', async (req, res) => {
	try {
		const rows = await getAllLinksFromDatabase();
		res.send(rows);
	} catch (error) {
		console.error('Error retrieving video links:', error);
		res.status(500).send('Error retrieving video links');
	}
});

router.post('/daily', async (req, res) => {
	try {
		const {
			link,
			createdAt
		} = req.body;
		const record = await addLinkToDatabase(link, createdAt);
		res.status(201).json({
			message: 'Video link added successfully',
			record
		});
	} catch (error) {
		console.error('Error adding video link:', error);
		res.status(500).send('Error adding video link');
	}
});

router.put('/:id', async (req, res) => {
	try {
		const id = parseInt(req.params.id, 10);
		const existingVideo = await getLinkById(id);
		if (!existingVideo) {
			return res.status(404).json({ error: `Nem található videó ezzel az azonosítóval: ${id}` });
		}
		const { link, createdAt } = req.body;
		const updatedVideo = { id, link, createdAt };
		const record = await updateLinkInDatabase(updatedVideo);
		if (!record) {
			return res.status(500).json({ error: 'A videó frissítése sikertelen volt' });
		}
		res.status(200).json({
			message: 'A videó link sikeresen frissítve',
			record
		});
	} catch (error) {
		console.error('Hiba a videó link frissítésekor:', error);
		res.status(500).send('Hiba a videó link frissítésekor');
	}
});

router.delete('/:id', async (req, res) => {
	try {
		const id = parseInt(req.params.id, 10);
		const existingVideo = await getLinkById(id);
		if (!existingVideo) {
			return res.status(404).json({ error: `Nem található videó ezzel az azonosítóval: ${id}` });
		}
		await deleteLinkFromDatabase(id);
		res.status(200).json({
			message: `A ${id} azonosítójú videó link törölve lett.`
		});
	} catch (error) {
		console.error(`Hiba a videó link törlésekor:`, error);
		res.status(500).json({
			error: `Hiba a videó link törlésekor: ${error.message}`
		});
	}
});

router.get('/latest', async (req, res) => {
	try {
		const row = await getLastVideoLink();
		res.json(row);
	} catch (error) {
		console.error('Error retrieving video link:', error);
		res.status(500).json('Error retrieving video link');
	}
});

router.get('/random', async (req, res) => {
	try {
		const row = await generateRandomLink();
		res.send(row);
	} catch (error) {
		console.error('Error retrieving random video link:', error);
		res.status(500).send('Error retrieving random video link');
	}
});

module.exports = router;