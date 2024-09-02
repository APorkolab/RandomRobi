require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('./logger/logger');
const morgan = require('morgan');
const sequelize = require('./config/database');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const loginRouter = require('./controllers/login/router');
const rateLimiter = require('./middlewares/rateLimiting');
const authenticate = require('./middlewares/authenticate');
const app = express();
const port = process.env.PORT;

// Engedélyezzük a proxy megbízhatóságát
app.set('trust proxy', 1);

// Rate Limiting middleware alkalmazása az összes API végpontra;
app.use(rateLimiter);

// CORS beállítások
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:4200']; // Alapértelmezett fejlesztői origin

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

logger.info(`CORS origins set to: ${allowedOrigins.join(', ')}`);

// Swagger configuration
const swaggerOptions = {
	swaggerDefinition: {
		openapi: "3.0.0",
		info: {
			title: "Random Robi API",
			version: "1.0.0",
			description: "API documentation for the RandomRobi YouTube-scraper project",
			contact: {
				name: "Adam Dr. Porkolab",
			}
		},
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local server"
      },
      {
        url: "https://www.api.randomrobi.porkolab.hu",
        description: "Production server"
      }
    ]
	},
	apis: ["./routes/*.js", "./controllers/**/*.js"]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Egyedi Morgan formátum a kérések és válaszok naplózásához
morgan.token('body', (req) => JSON.stringify(req.body));
morgan.token('response-time', (req, res, digits) => {
	if (!req._startAt || !res._startAt) {
		return;
	}
	const ms = (res._startAt[0] - req._startAt[0]) * 1e3 +
		(res._startAt[1] - req._startAt[1]) * 1e-6;
	return ms.toFixed(digits === undefined ? 3 : digits);
});

const loggerFormat = ':method :url :status :response-time ms - :res[content-length] :body';

// Logging middleware
app.use(morgan(loggerFormat, { 
	stream: logger.stream,
	skip: (req, res) => res.statusCode < 400 // Opcionális: csak a hibákat naplózza
}));

// Middleware a válasz naplózásához
app.use((req, res, next) => {
	const oldJson = res.json;
	res.json = function (body) {
		logger.info(`Response body: ${JSON.stringify(body)}`);
		return oldJson.call(this, body);
	};
	next();
});

// Middleware setup
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(bodyParser.json());
app.use(express.static('public'));

// Route imports
const videoRouter = require('./controllers/video/router');
const cronRouter = require('./controllers/cron/router');
const userRouter = require('./controllers/user/router');

// Routes setup
app.use('/video', videoRouter);
app.use('/cron', cronRouter);
app.use('/user', authenticate, userRouter);
app.use('/login', loginRouter);
app.use('/logout', loginRouter);

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

		await sequelize.sync({ alter: true }); // Use alter: true for development
		logger.info('All models synced.');

		app.listen(port, () => {
			logger.info(`App listening at http://localhost:${port}`);
			logger.info(`Swagger docs available at http://localhost:${port}/api-docs`);
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