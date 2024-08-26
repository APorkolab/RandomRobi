const {
	app,
	startServer
} = require('./index');
const bcrypt = require('bcrypt');
const User = require('./models/user');
const logger = require('./logger/logger');

// Create admin user on server start
const createAdminUser = async () => {
	const username = process.env.ADMIN_USERNAME || 'admin';
	const email = process.env.ADMIN_EMAIL || 'admin@example.com';
	const password = process.env.ADMIN_PASSWORD || 'adminPassword';

	try {
		const hashedPassword = await bcrypt.hash(password, 10);

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
			logger.info(`Admin user created with username: ${username}, email: ${email}`);
		} else {
			logger.info(`Admin user already exists with username: ${username}`);
		}
	} catch (err) {
		logger.error(`Failed to create admin user: ${err.message}`);
		process.exit(1); // Stop the process if user creation fails
	}
};

// Start the server and create admin user
const initializeApp = async () => {
	await createAdminUser();
	await startServer();
};

initializeApp();