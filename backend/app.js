'use strict';
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const dotenv = require('dotenv').config();
const cors = require('cors');
const {
	CronJob
} = require('cron');
const {
	addLinkToDatabase,
	getLastVideoLink,
	getAllLinksFromDatabase,
	updateLinkInDatabase,
	deleteLinkFromDatabase,
	getByIDFromDatabase
} = require('./models/video');
const randomVideo = require('./services/randomVideoService');

const app = express();
const port = process.env.PORT || 3000;

const db = new sqlite3.Database(process.env.dbPath || './db/videos.db');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
	extended: true
}));

// Set up database
db.serialize(() => {
	db.run('CREATE TABLE IF NOT EXISTS videos (id INTEGER PRIMARY KEY, link TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
});

// Schedule cron job to update video every 24 hours
const task = new CronJob('0 1 0 * * *', async () => {
	try {
		const video = await randomVideo.getRandomVideo();
		const result = await addLinkToDatabase(video);
		console.log(`New video link has been added to the database: ${result.link}`);
	} catch (error) {
		console.error(error);
	}
}, null, true, 'Europe/Budapest');
task.start();

// Routes
app.get('/', async (req, res) => {
	try {
		const row = await getLastVideoLink();
		res.send(row);
	} catch (error) {
		console.error(error);
		res.status(500).send('Error retrieving video link');
	}
});

app.get('/all', async (req, res) => {
	try {
		const rows = await getAllLinksFromDatabase();
		res.send(rows);
	} catch (error) {
		console.error(error);
		res.status(500).send('Error retrieving video links');
	}
});

app.post('/', async (req, res) => {
	try {
		const myLink = req.body.link;
		const record = await addLinkToDatabase(myLink);
		res.status(201).json({
			message: 'Video link added successfully',
			record
		});
	} catch (error) {
		console.error(error);
		res.status(500).send('Error adding video link');
	}
});


app.put('/:id', async (req, res, next) => {
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
		const video = await updateLinkInDatabase(id, link);
		res.status(200).json(video);
	} catch (error) {
		next(error);
	}
});

app.get('/:id', async (req, res, next) => {
	const id = req.params.id;
	try {
		const video = await getByIDFromDatabase(id);
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

app.delete('/:id', async (req, res) => {
	try {
		const id = req.params.id;
		const result = await deleteLinkFromDatabase(id);
		if (result === 0) {
			res.status(200).send('The video link has been deleted.');
		} else {
			res.status(404).send('Video link not found');
		}
	} catch (error) {
		console.error(error);
		res.status(500).send('Error deleting video link');
	}
});


app.listen(port, () => {
	console.log(`Server is listening on port http: //localhost:${port}`);
});

module.exports = app;