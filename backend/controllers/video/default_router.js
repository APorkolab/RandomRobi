const express = require('express');
const router = express.Router();
const {
	getLastVideoLink,
	generateRandomLink
} = require("../../models/video");
const videoSchema = require('../../models/video');

router.get('/', async (req, res) => {
	try {
		const row = await getLastVideoLink();
		res.send(row);
	} catch (error) {
		console.error(error);
		res.status(500).send('Error retrieving video link');
	}
});

router.get('/random', async (req, res) => {
	try {
		const rows = await videoSchema.generateRandomLink();
		res.send(rows);
	} catch (error) {
		console.error(error);
		res.status(500).send('Error retrieving video links');
	}
});

module.exports = router;