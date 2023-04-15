const dotenv = require('dotenv');
const logger = require('./logger/logger');
const app = require('./server');
const port = process.env.PORT || 3000;
const http = require('http');


const cron = require('./services/cronService');
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
	// Az időzített feladatok konfigurálása
	cron.task();
	// Válasz küldése a kliensnek
	res.status(204).send();
});

server.listen(port, () => {
	console.log(`App listening at http://localhost:${port}`);
});