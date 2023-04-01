'use strict';
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const dotenv = require('dotenv').config();
const User = require('./models/user');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {
	Sequelize,
	DataTypes
} = require('sequelize');
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
app.options('*', cors())
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

db.serialize(() => {
	db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, password TEXT NOT NULL, email TEXT)');

	db.get('SELECT id FROM users WHERE username = ?', 'admin', async (err, row) => {
		if (!row) {
			const username = 'admin';
			const password = 'tarara';
			const email = 'tarara@tarara.hu';
			const hashedPassword = await bcrypt.hash(password, 10);
			db.run('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, hashedPassword, email], (err) => {
				if (err) {
					return console.log(err.message);
				}
				console.log(`Admin user has been added with username: ${username}, email: ${email}`);
			});
		}
	});
});

const sequelize = new Sequelize('database', null, null, {
	dialect: 'sqlite',
	storage: process.env.dbPath || './db/videos.db'
});


//Test for 10sec run
// const task = new CronJob('*/10 * * * * *', async () => {

// Schedule cron job to update video every 24 hours
const task = new CronJob('0 1 0 * * *', async () => {
	let tries = 0;
	let video = null;
	while (!video && tries < 3) {
		try {
			video = await randomVideo.getRandomVideo();
		} catch (error) {
			console.error(error);
			tries++;
		}
	}

	if (video) {
		try {
			const result = await addLinkToDatabase(video);
			console.log(`New video link has been added to the database: ${result.link}`);
		} catch (error) {
			console.error(error);
		}
	}
}, null, true, 'Europe/Budapest');
task.start();

const authencticateJwt = require('./models/auth/authenticate');

// Routes
app.post('/login', async (req, res) => {
	const {
		username,
		password
	} = req.body;

	const user = await User.findOne({
		where: {
			username
		}
	});

	if (!user) {
		res.sendStatus(404);
		return res.json({
			error: 'This user does not exist'
		});
	}

	const valid = await bcrypt.compareSync(password, user.password);
	if (valid) {
		const accessToken = jwt.sign({
				username: user.username
			},
			'bociBociTarkaSeFuleSeFarka', {
				expiresIn: '1h',
			}
		);

		res.json({
			accessToken,
			user: {
				...user.toJSON(),
				password: ''
			}
		});
	} else {
		return res.sendStatus(401);
	}
});

app.get('/', async (req, res) => {
	try {
		const row = await getLastVideoLink();
		res.send(row);
	} catch (error) {
		console.error(error);
		res.status(500).send('Error retrieving video link');
	}
});

app.get('/all', authencticateJwt, async (req, res) => {
	try {
		const rows = await getAllLinksFromDatabase();
		res.send(rows);
	} catch (error) {
		console.error(error);
		res.status(500).send('Error retrieving video links');
	}
});

app.post('/create', authencticateJwt, async (req, res) => {
	try {
		const {
			id,
			link,
			created_at
		} = req.body;
		const record = await addLinkToDatabase(link, created_at);
		res.status(201).json({
			message: 'Video link added successfully',
			record
		});
	} catch (error) {
		console.error(error);
		res.status(500).send('Error adding video link');
	}
});


app.put('/:id', authencticateJwt, async (req, res, next) => {
	const {
		id
	} = req.params;
	const {
		link,
		created_at
	} = req.body;

	if (!link || !created_at || !id) {
		return res.status(400).json({
			error: 'Missing fields'
		});
	}

	const isValidDate = (dateString) => {
		return !isNaN(Date.parse(dateString));
	};

	if (!isValidDate(created_at)) {
		return res.status(400).json({
			error: 'Invalid date format'
		});
	}

	try {
		const video = await updateLinkInDatabase(id, {
			link,
			created_at
		});
		res.status(200).json({
			message: 'Video successfully updated'
		});
	} catch (error) {
		next(error);
	}
});




app.get('/:id', authencticateJwt, async (req, res, next) => {
	const id = req.params.id;
	try {
		const video = await getByIDFromDatabase(id);
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


app.delete('/:id', authencticateJwt, async (req, res) => {
	try {
		const id = req.params.id;
		const result = await deleteLinkFromDatabase(id);
		if (result === 0) {
			res.status(200).json({
				message: 'The video link has been deleted.'
			});
		} else {
			res.status(404).json({
				message: 'Video link not found.'
			});
		}
	} catch (error) {
		console.error(error);
		res.status(500).send('Error deleting video link');
	}
});

//User

// CREATE
app.post('/user', authencticateJwt, async (req, res) => {
	try {
		const user = await User.create(req.body);
		res.status(201).json(user);
	} catch (error) {
		console.error(error);
		res.status(500).send('Error creating user');
	}
});

// READ ALL
app.get('/user/all', authencticateJwt, async (req, res) => {
	try {
		const users = await User.findAll();
		res.json(users);
	} catch (error) {
		console.error(error);
		res.status(500).send('Error fetching users');
	}
});

// READ ONE
app.get('/user/:id', authencticateJwt, async (req, res) => {
	try {
		const user = await User.findByPk(req.params.id);
		if (!user) {
			res.status(404).send('User not found');
		} else {
			res.json(user);
		}
	} catch (error) {
		console.error(error);
		res.status(500).send('Error fetching user');
	}
});

// UPDATE
app.put('/user/:id', authencticateJwt, async (req, res) => {
	try {
		let updatedUser = req.body;
		if (updatedUser.password) {
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(updatedUser.password, salt);
			updatedUser.password = hashedPassword;
		}
		const result = await User.update(updatedUser, {
			where: {
				id: req.params.id
			}
		});
		if (result[0] === 0) {
			res.status(404).send('User not found');
		} else {
			res.status(200).send('User updated successfully');
		}
	} catch (error) {
		console.error(error);
		res.status(500).send('Error updating user');
	}
});

// DELETE
app.delete('/user/:id', authencticateJwt, async (req, res) => {
	try {
		const result = await User.destroy({
			where: {
				id: req.params.id
			}
		});
		if (result === 0) {
			res.status(404).send('User not found');
		} else {
			res.status(200).send('User deleted successfully');
		}
	} catch (error) {
		console.error(error);
		res.status(500).send('Error deleting user');
	}
});

app.listen(port, () => {
	console.log(`Server is listening on port http://localhost:${port}`);
});

module.exports = app;