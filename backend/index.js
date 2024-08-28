require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('./logger/logger');
const sequelize = require('./config/database');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();
const port = process.env.PORT || 3000;

// Swagger configuration
const swaggerOptions = {
	swaggerDefinition: {
		openapi: "3.0.0",
		info: {
			title: "Random Robi API",
			version: "1.0.0",
			description: "API documentation for the Random Robi project",
			contact: {
				name: "Adam",
				email: "adam@example.com"
			}
		},
		servers: [{
			url: "http://localhost:3000",
			description: "Local server"
		}]
	},
	apis: ["./routes/*.js", "./controllers/**/*.js"]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middleware setup
app.use(cors());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(bodyParser.json());
app.use(express.static('public'));

// Route imports
const videoRouter = require('./controllers/video/router');
const cronRouter = require('./controllers/cron/router');
const userRouter = require('./controllers/user/router');
const loginRouter = require('./controllers/login/router');

// Routes setup
app.use('/video', videoRouter);
app.use('/cron', cronRouter);
app.use('/user', require('./models/auth/authenticate'), userRouter);
app.use('/login', loginRouter);

// Global error handler
app.use((err, req, res, next) => {
	logger.error(`Error: ${err.message}`);
	res.status(500).json({
		hasError: true,
		message: err.message
	});
});

// Function to start the server
const startServer = async () => {
	try {
		await sequelize.authenticate();
		logger.info('Connected to the database.');

		await sequelize.sync(); // Sync tables here
		logger.info('All models synced.');

		app.listen(port, () => {
			logger.info(`App listening at http://localhost:${port}`);
		});
	} catch (error) {
		logger.error(`Unable to start the server: ${error.message}`);
		process.exit(1);
	}
};

// Export the app and startServer function
module.exports = {
	app,
	startServer
};