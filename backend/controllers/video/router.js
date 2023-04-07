const express = require('express');
const router = express.Router();
const videoModel = require("../../models/video");

router.get('/all', async (req, res) => {
	try {
		const rows = await videoModel.getAllLinksFromDatabase();
		res.send(rows);
	} catch (error) {
		console.error(error);
		res.status(500).send('Error retrieving video links');
	}
});

router.post('/', async (req, res) => {
	try {
		const {
			link,
			createdAt
		} = req.body;
		const record = await videoModel.addLinkToDatabase(link, createdAt);
		res.status(201).json({
			message: 'Video link added successfully',
			record,
		});
	} catch (error) {
		console.error(error);
		res.status(500).send('Error adding video link');
	}
});



router.put('/:id', async (req, res, next) => {
	const {
		id
	} = req.params;
	const {
		link,
		createdAt
	} = req.body;

	if (!link || !createdAt || !id) {
		return res.status(400).json({
			error: 'Missing fields'
		});
	}

	const isValidDate = (dateString) => {
		return !isNaN(Date.parse(dateString));
	};

	if (!isValidDate(createdAt)) {
		return res.status(400).json({
			error: 'Invalid date format'
		});
	}

	try {
		const video = await videoModel.updateLinkInDatabase(id, {
			link,
			createdAt
		});
		res.status(200).json({
			message: 'Video successfully updated'
		});
	} catch (error) {
		next(error);
	}
});

router.get('/:id', async (req, res, next) => {
	const id = req.params.id;
	try {
		const video = await videoModel.getByIdFromDatabase(id);
		if (video) {
			res.json(video);
		} else {
			res.status(404).json({
				error: 'Video not found'
			});
		}
	} catch (error) {
		next(error);
	}
});

// DELETE
router.delete('/:id', async (req, res) => {
	try {
		const id = req.params.id;
		await videoModel.deleteLinkFromDatabase(id);
		res.status(200).json({
			message: `The video link with id ${id} has been deleted.`
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			error: `Error deleting video link with id ${id}: ${error.message}`
		});
	}
});


module.exports = router;