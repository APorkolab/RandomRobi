const express = require('express');
const bodyParser = require('body-parser');
const {
	app,
	startServer
} = require('./index');
const bcrypt = require('bcrypt');
const User = require('./models/user');
const logger = require('./logger/logger');
const { initCronJob } = require('./services/cronService');
const sequelize = require('./config/database');

// Create admin user on server start
const createAdminUser = async () => {
	const username = process.env.ADMIN_USERNAME || 'admin';
	const email = process.env.ADMIN_EMAIL || 'admin@example.com';
	const password = process.env.ADMIN_PASSWORD || 'adminPassword';

	logger.info(`Kísérlet admin felhasználó létrehozására: ${username}, ${email}`);

	try {
		const [user, created] = await User.findOrCreate({
			where: { username },
			defaults: {
				username,
				password,
				email
			}
		});

		if (created) {
			logger.info(`Admin felhasználó sikeresen létrehozva: ${username}`);
		} else {
			logger.info(`Admin felhasználó már létezik: ${username}`);
		}
	} catch (err) {
		logger.error(`Admin felhasználó létrehozása sikertelen: ${err.message}`);
		logger.error(err.stack); // Teljes hibaverem naplózása
	}
};

// Body-parser middleware beállítása
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import and use login router
const { router } = require('./controllers/login/router');
app.use('/', router);

// Start the server and create admin user
const initializeApp = async () => {
	try {
		await sequelize.sync({ force: true }); // Ez törli és újra létrehozza a táblákat
		await startServer(); // Start server first and sync tables
		await createAdminUser(); // Then create the admin user
		logger.info('Body-parser sikeresen beállítva');
	} catch (err) {
		logger.error(`Alkalmazás indítása sikertelen: ${err.message}`);
		process.exit(1);
	}
};

initializeApp();
initCronJob();