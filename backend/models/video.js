const randomVideo = require('../services/randomVideoService');
const db = require("../config/database");

const Sequelize = require("sequelize");
const moment = require('moment');
const {
	time
} = require('cron');
const videoSchema = db.define("videos", {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
		allowNull: false,
	},
	link: {
		type: Sequelize.STRING,
		allowNull: false
	},
	createdAt: {
		type: Sequelize.DATE,
		defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
		allowNull: false
	}
}, {
	freezeTableName: true,
	timestamps: false,
});

const generateRandomLink = async () => {
	try {
		const videoLink = JSON.stringify(await randomVideo.getRandomVideo());
		let newVideo = null;

		// Database storing. Feature if the users requests will be analyzed
		// newVideo = await addLinkToDatabase(videoLink, Date.now());

		if (newVideo) {
			videoLink = newVideo;
		}

		return {
			link: videoLink
		};
	} catch (err) {
		throw new Error(`Hiba a videó link generálása közben: ${err.message}`);
	}
};



const addLinkToDatabase = async (link, createdAt) => {
	try {
		if (!link) {
			throw new Error('Link is missing');
		}
		const video = await videoSchema.create({
			link: link,
			createdAt: createdAt || new Date().toISOString()
		});
		return {
			link: video.link,
			createdAt: video.createdAt
		};
	} catch (err) {
		throw err;
	}
};

const getAllLinksFromDatabase = async () => {
	try {
		const videos = await videoSchema.findAll({
			attributes: ['id', 'link', 'createdAt']
		});
		return videos.map(video => ({
			id: video.id,
			link: video.link,
			createdAt: video.createdAt
		}));
	} catch (err) {
		throw err;
	}
};

const getByIdFromDatabase = async (id) => {
	try {
		const video = await videoSchema.findOne({
			where: {
				id: id
			},
			attributes: ['id', 'link', 'createdAt']
		});
		return video ? {
			id: video.id,
			link: video.link,
			createdAt: video.createdAt
		} : null;
	} catch (err) {
		throw err;
	}
};

const getLastVideoLink = async () => {
	try {
		const video = await videoSchema.findOne({
			order: [
				['id', 'DESC']
			],
			attributes: ['id', 'link', 'createdAt']
		}) || {};
		if (video && video.link) {
			return {
				id: video.id,
				link: video.link,
				createdAt: video.createdAt
			};
		} else {
			const link = await randomVideo.getRandomVideo();
			const newVideo = await videoSchema.create({
				link: link,
				createdAt: new Date().toISOString()
			});
			return {
				id: newVideo.id,
				link: newVideo.link,
				createdAt: newVideo.createdAt
			};
		}
	} catch (err) {
		throw new Error(err.message);
	}
};

const updateLinkInDatabase = async (updatedVideo) => {
	try {
		let formattedDate;
		if (updatedVideo.createdAt) {
			const parsedDate = moment(updatedVideo.createdAt);
			if (parsedDate.isValid()) {
				formattedDate = parsedDate.format('YYYY-MM-DD HH:mm:ss');
			} else {
				throw new Error('Invalid date');
			}
		}

		const video = await videoSchema.findByPk(updatedVideo.id);
		if (!video) {
			throw new Error('Video not found');
		}

		const [updatedRowsCount] = await videoSchema.update({
			link: updatedVideo.link,
			createdAt: formattedDate
		}, {
			where: {
				id: updatedVideo.id
			}
		});

		if (updatedRowsCount < 1) {
			throw new Error('Video not found or data not changed');
		}

		const updatedVideoFromDB = await videoSchema.findByPk(updatedVideo.id);

		// Convert the createdAt date to the desired format
		const updatedVideoJSON = updatedVideoFromDB.toJSON();
		if (updatedVideoJSON.createdAt) {
			const createdAtDateObj = new Date(updatedVideoJSON.createdAt);
			updatedVideoJSON.createdAt = createdAtDateObj.toLocaleDateString();
		}

		return updatedVideoJSON;
	} catch (err) {
		throw err;
	}
};


const deleteLinkFromDatabase = async (id) => {
	try {
		const result = await videoSchema.destroy({
			where: {
				id: id
			}
		});
		return result ? 1 : 0;
	} catch (error) {
		throw new Error(error.message);
	}
};

module.exports = {
	videoSchema,
	addLinkToDatabase,
	getAllLinksFromDatabase,
	getByIdFromDatabase,
	getLastVideoLink,
	updateLinkInDatabase,
	deleteLinkFromDatabase,
	generateRandomLink
};

return videoSchema;