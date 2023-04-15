const dotenv = require('dotenv');
const logger = require('./logger/logger');
const app = require('./server');
const port = process.env.PORT || 3000;
const http = require('http');


const cron = require('./services/cronService');
const {
	timeStamp
} = require('console');
const server = http.createServer(app);

const result = dotenv.config();

if (result.error) {
	logger.error(result.error);
	process.exit(1);
}

if (!process.env.API_KEY || !process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD) {
	logger.error('Database credentials not found in environment variables.');
	process.exit(1);
}


app.get('/cron', (req, res) => {
	const options = {
		timeZone: 'Europe/Budapest',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	};
	// Az időzített feladatok konfigurálása
	cron.cronJob()
		.then(() => {
			const formattedDate = new Date().toLocaleString('hu-HU', options);
			res.status(204).send(`The cronjob has been successfully applied at ${formattedDate}`);
			res.end();
		})
		.catch((err) => {
			console.error(err);
			const formattedDate = new Date().toLocaleString('hu-HU', options);
			res.status(500).send(`Something went wrong at ${formattedDate}`);
			res.end();
		});
});




server.listen(port, () => {
	console.log(`App listening at http://localhost:${port}`);
});