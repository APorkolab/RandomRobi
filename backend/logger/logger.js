const path = require('path');
const winston = require('winston');

const options = {
	file: {
		level: process.env.LOG_LEVEL_FILE || 'info',
		filename: path.join(__dirname, '../logs/app.log'),
		format: winston.format.combine(
			winston.format.timestamp(),
			winston.format.json()
		),
	},
	console: {
		level: process.env.LOG_LEVEL_CONSOLE || 'debug',
		format: winston.format.combine(
			winston.format.colorize(),
			winston.format.simple()
		),
	},
};

const logger = winston.createLogger({
	transports: [
		new winston.transports.File(options.file),
		new winston.transports.Console(options.console)
	],
	exitOnError: false,
});

logger.stream = {
	write: function (message) {
		logger.info(message.trim());
	}
};

module.exports = logger;