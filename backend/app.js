"use strict";
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();
const cors = require('cors');
const cron = require('node-cron');
const database = require('./database');
var errorHandler = require('errorhandler')

const app = express();
const port = process.env.PORT || 3000;

const db = new sqlite3.Database(process.env.dbPath || './db/videos.db');

// Middleware
const corsOptions = {
	origin: 'same-origin'
};

app.use(cors(corsOptions));
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
	console.log(process.env.API);
	database.getLastVideoLink()
		.then((row) => {
			res.send(row);
		})
		.catch((error) => {
			console.error(error);
			res.status(500).send('Error retrieving video link');
		});
});

app.listen(port, () => {
	console.log(`Server is listening on port ${port}`);
});
app.use(errorHandler({
	dumpExceptions: true,
	showStack: true
}));

module.exports = app;