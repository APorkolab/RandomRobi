const express = require('express');
require('dotenv').config();
const app = express();
const User = require('./models/user');
const videoSchema = require('./models/video');

const logger = require('./logger/logger');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const Sequelize = require("sequelize");
const sequelize = require('./config/database');
const {
	CronJob
} = require('cron');
// const {
// 	addLinkToDatabase
// } = require('./models/video');
const randomVideo = require('./services/randomVideoService');

sequelize.authenticate()
	.then(() => {
		console.log('Connected to database.');
		return sequelize.sync();
	})
	.then(() => {
		console.log('All models synced.');
	})
	.catch((error) => {
		console.log(`Unable to connect to the database: ${error}`);
	});






//Cross Origin Resource Sharing
app.use(cors());
// app.use(morgan('combined', {
// 	stream: logger.stream
// }));
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(express.static('public'));
app.use(bodyParser.json());

// create admin U
(async () => {
	const username = 'admin';
	const email = 'tarara@tarara.hu';
	const password = 'tarara';
	const hashedPassword = await bcrypt.hash(password, 10);

	try {
		const user = await User.findOne({
			where: {
				username
			}
		});

		if (!user) {
			await User.create({
				username,
				password: hashedPassword,
				email
			});
			console.log(`Admin user has been added with username: ${username}, email: ${email}`);
		}
	} catch (err) {
		console.error(err);
	}
})();

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
			const result = await videoSchema.addLinkToDatabase(video);
			console.log(`New video link has been added to the database: ${result.link}`);
		} catch (error) {
			console.error(error);
		}
	}

}, null, true, 'Europe/Budapest');
task.start();

// Authentication middleware
const authenticateJwt = require('./models/auth/authenticate');

app.use('/video', authenticateJwt, require('./controllers/video/router'));
app.use('/user', authenticateJwt, require('./controllers/user/router'));
app.use('/login', require('./controllers/login/router'));
app.use('/', require('./controllers/video/default_router'));

app.use((err, req, res, next) => {
	res.status(500);
	res.json({
		hasError: true,
		message: err.message,
	});
});

module.exports = app;