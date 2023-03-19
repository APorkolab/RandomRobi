const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const randomVideo = require('./randomVideo');
require('dotenv').config();
const cors = require('cors');
const cron = require('node-cron');
const database = require('./database');

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
const task = require('./cron');
task();


// Routes
app.get('/', (req, res) => {
	database.getLastVideoLink()
		.then((link) => {
			res.send(link);
		})
		.catch((error) => {
			console.error(error);
			res.status(500).send('Error retrieving video link');
		});
});

app.listen(port, () => {
	console.log(`Server is listening on port ${port}`);
});


module.exports = app;