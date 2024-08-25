const app = require('./index');
const bcrypt = require('bcrypt');
const User = require('./models/user');
const logger = require('./logger/logger');

// Create admin user on server start
(async () => {
	const username = process.env.ADMIN_USERNAME || 'admin';
	const email = process.env.ADMIN_EMAIL || 'admin@example.com';
	const password = process.env.ADMIN_PASSWORD || 'adminPassword';
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
			logger.info(`Admin user created with username: ${username}, email: ${email}`);
		}
	} catch (err) {
		logger.error(`Failed to create admin user: ${err.message}`);
	}
})();