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
	deleteLinkFromDatabase
} = require('../../services/videoService');

router.get('/all', async (req, res) => {
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
		const updatedVideo = req.body;
		updatedVideo.id = req.params.id;
		const record = await updateLinkInDatabase(updatedVideo);
		res.status(200).json({
			message: 'Video link updated successfully',
			record
		});
	} catch (error) {
		console.error('Error updating video link:', error);
		res.status(500).send('Error updating video link');
	}
});

router.delete('/:id', async (req, res) => {
	try {
		const id = req.params.id;
		await deleteLinkFromDatabase(id);
		res.status(200).json({
			message: `The video link with id ${id} has been deleted.`
		});
	} catch (error) {
		console.error(`Error deleting video link with id ${id}:`, error);
		res.status(500).json({
			error: `Error deleting video link with id ${id}: ${error.message}`
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