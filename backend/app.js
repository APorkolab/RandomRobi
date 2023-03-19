const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const randomVideo = require('./helpers/randomVideo');
const cron = require('node-cron');

const app = express();
const port = process.env.PORT || 3000;

const db = new sqlite3.Database(process.env.DB_PATH || './db/videos.db');

// Middleware
app.use(express.json());
app.use(express.urlencoded({
	extended: true
}));

// Set up database
db.serialize(() => {
	db.run('CREATE TABLE IF NOT EXISTS videos (id INTEGER PRIMARY KEY, video_link TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
});

// Schedule cron job to update video every 24 hours
const cronJob = require('./cron');
cronJob();


// Routes
app.get('/', videoController.showVideo(db));

app.listen(port, () => {
	console.log(`Server is listening on port ${port}`);
});