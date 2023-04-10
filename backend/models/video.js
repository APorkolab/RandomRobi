const randomVideo = require('../services/randomVideoService');
const db = require("../config/database");

const Sequelize = require("sequelize");

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

const updateLinkInDatabase = async (id, {
	link,
	createdAt
}) => {
	try {
		let formattedDate;
		if (createdAt) {
			// Parse the provided date string into a date object
			const dateObj = new Date(createdAt);
			// Check if the date is valid and convert to ISO format
			if (isNaN(dateObj.getTime())) {
				throw new Error('Invalid date');
			} else {
				formattedDate = dateObj.toISOString().replace('T', ' ').slice(0, -5);
			}
		}

		const result = await videoSchema.update({
			link,
			createdAt: formattedDate
		}, {
			where: {
				id
			}
		});
		if (result[0] === 0) {
			throw new Error('Video not found');
		}

		const video = await videoSchema.findOne({
			where: {
				id
			},
			attributes: ['id', 'link', 'createdAt']
		});
		return {
			id: video.id,
			link: video.link,
			createdAt: video.createdAt
		};
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
};

return videoSchema;