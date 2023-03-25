const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:/Users/adamp/Desktop/randomrobi/RandomRobi/backend/database/videos.db');
const randomVideo = require('./randomVideo');

db.serialize(() => {
	db.run("CREATE TABLE IF NOT EXISTS videos (id INTEGER PRIMARY KEY AUTOINCREMENT, link TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
});

const addLinkToDatabase = async (myLink) => {
	const result = await db.get("SELECT * FROM videos WHERE link = ?", [myLink]);
	if (!result) {
		await db.run("INSERT INTO videos (link) VALUES (?)", [myLink]);
		const record = await db.get("SELECT id, link, created_at FROM videos WHERE id = last_insert_rowid()");
		return {
			id: record.id,
			link: record.link,
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
				reject(err.message);
			}
			const links = rows.map((row) => {
				return {
					id: row.id,
					link: row.link,
					created_at: row.created_at
				};
			});
			resolve(links);
		});
	});
};

const getLastVideoLink = () => {
	return new Promise(async (resolve, reject) => {
		try {
			let row = await db.get('SELECT id, link, created_at FROM videos ORDER BY id DESC LIMIT 1');
			if (row && row.link) {
				resolve({
					id: row.id,
					link: row.link,
					created_at: row.created_at
				});
			} else {
				const video = await randomVideo.getRandomVideo();
				await db.run(`INSERT INTO videos (link) VALUES (?)`, [video]);
				const record = await db.get("SELECT id, link, created_at FROM videos WHERE id = last_insert_rowid()");
				resolve({
					id: record.id,
					link: record.link,
					created_at: record.created_at
				});
			}
		} catch (err) {
			reject(err.message);
		}
	});
};


module.exports = {
	addLinkToDatabase,
	getAllLinksFromDatabase,
	getLastVideoLink
};