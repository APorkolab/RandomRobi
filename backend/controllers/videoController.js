const express = require('express');
const router = express.Router();
const videoModel = require('../models/video');

// GET all videos
router.get('/all', async (req, res, next) => {
	try {
		const videos = await videoModel.getAllLinksFromDatabase();
		res.status(200).json(videos);
	} catch (error) {
		next(error);
	}
});

// GET the last video
router.get('/', async (req, res, next) => {
	try {
		const video = await videoModel.getLastVideoLink();
		res.status(200).json(video);
	} catch (error) {
		next(error);
	}
});

router.get('/:id', async (req, res, next) => {
	const id = req.params.id;
	try {
		const video = await videoModel.getByIDFromDatabase(id);
		if (!video) {
			return res.status(404).json({
				message: 'Video not found'
			});
		}
		res.json(video);
	} catch (error) {
		next(error);
	}
});


// POST a new video
router.post('/', async (req, res, next) => {
	const {
		link
	} = req.body;
	if (!link) {
		return res.status(400).json({
			error: 'Link is missing'
		});
	}
	try {
		const video = await videoModel.addLinkToDatabase(link);
		res.status(201).json(video);
	} catch (error) {
		next(error);
	}
});

// PUT (update) an existing video
router.put('/:id', async (req, res, next) => {
	const {
		id
	} = req.params;
	const {
		link
	} = req.body;
	if (!link) {
		return res.status(400).json({
			error: 'Link is missing'
		});
	}
	try {
		const video = await videoModel.updateLinkInDatabase(id, link);
		res.status(200).json(video);
	} catch (error) {
		next(error);
	}
});

// DELETE an existing video
router.delete('/:id', async (req, res, next) => {
	const {
		id
	} = req.params;
	try {
		const video = await videoModel.deleteLinkFromDatabase(id);
		res.status(200).json(video);
	} catch (error) {
		next(error);
	}
});

module.exports = router;