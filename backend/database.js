const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:/Users/adamp/Desktop/randomrobi/RandomRobi/backend/database/videos.db');
const randomVideo = require('./randomVideo');

db.serialize(() => {
	db.run("CREATE TABLE IF NOT EXISTS videos (id INTEGER PRIMARY KEY AUTOINCREMENT, link TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
});

const addLinkToDatabase = async (myLink) => {
	const result = await db.get("SELECT * FROM videos WHERE link = ?", [myLink]);
	if (!result) {
		db.run("INSERT INTO videos (link) VALUES (?)", myLink);
		const record = await db.get("SELECT id, link, created_at FROM videos WHERE id = last_insert_rowid()");
		return {
			id: record.id,
			link: myLink,
			created_at: record.created_at
		};
	} else {
		return {
			id: result.id,
			link: result.link,
			created_at: result.created_at
		};
	}
};

const getAllLinksFromDatabase = () => {
	return new Promise((resolve, reject) => {
		db.all("SELECT id, link, created_at FROM videos", [], function (err, rows) {
			if (err) {
				reject(err);
			} else {
				const links = rows.map((row) => {
					return {
						id: row.id,
						link: row.link,
						created_at: row.created_at
					};
				});
				resolve(links);
			}
		});
	});
};


const getLastVideoLink = async () => {
	try {
		const row = await new Promise((resolve, reject) => {
			db.get('SELECT id, link, created_at FROM videos ORDER BY id DESC LIMIT 1', (err, row) => {
				if (err) {
					reject(err);
				} else {
					resolve(row);
				}
			});
		});

		if (row && row.link) {
			return {
				id: row.id,
				link: row.link,
				created_at: row.created_at
			};
		} else {
			const video = await randomVideo.getRandomVideo();
			await new Promise((resolve, reject) => {
				db.run('INSERT INTO videos (link, created_at) VALUES (?, datetime())', [video], (err) => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			});
			const record = await new Promise((resolve, reject) => {
				db.get('SELECT id, link, created_at FROM videos WHERE id = last_insert_rowid()', (err, row) => {
					if (err) {
						reject(err);
					} else {
						resolve(row);
					}
				});
			});
			return {
				id: record.id,
				link: record.link,
				created_at: record.created_at
			};
		}
	} catch (err) {
		throw new Error(err.message);
	}
};



module.exports = {
	addLinkToDatabase,
	getAllLinksFromDatabase,
	getLastVideoLink
};