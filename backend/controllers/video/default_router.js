const express = require('express');
const router = express.Router();
const {
	getLastVideoLink,
} = require("../../models/video");

router.get('/', async (req, res) => {
	try {
		const row = await getLastVideoLink();
		res.send(row);
	} catch (error) {
		console.error(error);
		res.status(500).send('Error retrieving video link');
	}
});

module.exports = router;