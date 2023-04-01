const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(process.env.dbPath || './db/videos.db');
const randomVideo = require('../services/randomVideoService');



db.serialize(() => {
	db.run("CREATE TABLE IF NOT EXISTS videos (id INTEGER PRIMARY KEY AUTOINCREMENT, link TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)");
});

const addLinkToDatabase = async (
	link,
	created_at) => {
	try {
		if (!link) {
			throw new Error('Link is missing');
		}
		await new Promise((resolve, reject) => {
			db.run(
				'INSERT INTO videos (link, created_at) VALUES (?, ?)',
				[link, created_at || new Date().toISOString()],
				(err) => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				}
			);
		});
		const record = await new Promise((resolve, reject) => {
			db.get(
				'SELECT id, link, created_at FROM videos WHERE id = last_insert_rowid()',
				(err, row) => {
					if (err) {
						reject(err);
					} else {
						resolve(row);
					}
				}
			);
		});
		return {
			id: record.id,
			link: record.link,
			created_at: record.created_at,
		};
	} catch (err) {
		throw err; // Visszaadja az eredeti kivételt
	}
};

module.exports = addLinkToDatabase;




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

const getByIDFromDatabase = (id) => {
	return new Promise((resolve, reject) => {
		db.get("SELECT * FROM videos WHERE id = ?", [id], (err, row) => {
			if (err) {
				reject(err);
			} else if (row === undefined) {
				resolve(null);
			} else {
				resolve({
					id: row.id,
					link: row.link,
					created_at: row.created_at
				});
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

const updateLinkInDatabase = async (id, {
	link,
	created_at
}) => {
	const formattedDate = new Date(created_at).toISOString().replace('T', ' ').slice(0, -5);
	try {
		const result = await db.run(
			"UPDATE videos SET link = ?, created_at = ? WHERE id = ?",
			[link, formattedDate, id]
		);
		if (result.changes === 0) {
			throw new Error("Video not found");
		}
		const record = await db.get("SELECT id, link, created_at FROM videos WHERE id = ?", [id]);
		return record;
	} catch (err) {
		throw err;
	}
};



const deleteLinkFromDatabase = async (id) => {
	try {
		await db.run("DELETE FROM videos WHERE id = ?", [id]);
		const result = await db.get("SELECT id FROM videos WHERE id = ?", [id]);
		if (result) {
			return 0; // sikertelen törlés
		} else {
			return 1; // sikeres törlés
		}
	} catch (err) {
		throw new Error(err.message);
	}
};



module.exports = {
	addLinkToDatabase,
	getAllLinksFromDatabase,
	getLastVideoLink,
	updateLinkInDatabase,
	deleteLinkFromDatabase,
	getByIDFromDatabase
};