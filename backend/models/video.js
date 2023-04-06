const {
	DataTypes
} = require('sequelize');
const sequelize = require('../config/database');
const randomVideo = require('../services/randomVideoService');

const Video = sequelize.define('videos', {
	id: {
		type: DataTypes.INTEGER,
		allowNull: false,
		primaryKey: true,
		autoIncrement: true
	},
	link: {
		type: DataTypes.STRING,
		allowNull: false
	},
	createdAt: {
		type: DataTypes.DATE,
		allowNull: false,
		defaultValue: DataTypes.NOW
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
		const video = await Video.create({
			link: link,
			createdAt: createdAt || new Date().toISOString()
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

const getAllLinksFromDatabase = async () => {
	try {
		const videos = await Video.findAll({
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
		const video = await Video.findOne({
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
		const video = await Video.findOne({
			order: [
				['id', 'DESC']
			],
			attributes: ['id', 'link', 'createdAt']
		});
		if (video && video.link) {
			return {
				id: video.id,
				link: video.link,
				createdAt: video.createdAt
			};
		} else {
			const link = await randomVideo.getRandomVideo();
			const newVideo = await Video.create({
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
	const formattedDate = new Date(createdAt).toISOString().replace('T', ' ').slice(0, -5);
	try {
		const result = await Video.update({
			link: link,
			createdAt: formattedDate
		}, {
			where: {
				id: id
			}
		});
		if (result[0] === 0) {
			throw new Error("Video not found");
		}
		const video = await Video.findOne({
			where: {
				id: id
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
		const result = await Video.destroy({
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
	Video,
	addLinkToDatabase,
	getAllLinksFromDatabase,
	getByIdFromDatabase,
	getLastVideoLink,
	updateLinkInDatabase,
	deleteLinkFromDatabase,
};