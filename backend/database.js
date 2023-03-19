const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(process.env.dbPath || './db/videos.db');
const getRandomVideo = require('./randomVideo');

db.serialize(() => {
	db.run("CREATE TABLE IF NOT EXISTS videos (id INTEGER PRIMARY KEY AUTOINCREMENT, link TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
});

const addLinkToDatabase = (myLink) => {
	return new Promise((resolve, reject) => {
		db.run("INSERT INTO videos (link) VALUES (?)", [myLink], function (err) {
			if (err) {
				reject(err);
			} else {
				resolve(`New link has been added with id ${this.lastID}`);
			}
		});
	});
};

const getAllLinksFromDatabase = () => {
	return new Promise((resolve, reject) => {
		db.all("SELECT * FROM videos", [], function (err, rows) {
			if (err) {
				reject(err.message);
			}
			const links = rows.map((row) => `${row.id} - ${row.link} - ${row.created_at}`);
			resolve(links);
		});
	});
};

const getLastVideoLink = () => {
	return new Promise((resolve, reject) => {
		db.get('SELECT link FROM videos ORDER BY id DESC LIMIT 1', (err, row) => {
			if (err) {
				reject(err.message);
			} else if (row && row.link) {
				resolve(row.link);
			} else {
				console.log('Database is empty. Requesting new video link.');
				randomVideo.getRandomVideo()
					.then((videoLink) => {
						return addLinkToDatabase(videoLink);
					})
					.then((result) => {
						console.log(result);
						resolve(result);
					})
					.catch((error) => {
						console.error(error);
						reject(error);
					});
			}
		});
	});
};


process.on('exit', () => {
	db.close((err) => {
		if (err) {
			console.error(err.message);
		}
		console.log('Database connection closed.');
	});
});

module.exports = {
	addLinkToDatabase,
	getAllLinksFromDatabase,
	getLastVideoLink
};