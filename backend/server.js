const express = require('express');
require('dotenv').config();
const app = express();
const User = require('./models/user');


const logger = require('./logger/logger');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const Sequelize = require("sequelize");
const sequelize = require('./config/database');

// const {
// 	addLinkToDatabase
// } = require('./models/video');


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