"use strict";
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Video = sequelize.define("Video", {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
		allowNull: false
	},
	link: {
		type: DataTypes.STRING,
		allowNull: false,
		validate: {
			isUrl: true // Ensure the link is a valid URL
		}
	},
	createdAt: {
		type: DataTypes.DATE,
		allowNull: false,
		defaultValue: DataTypes.NOW
	}
}, {
	freezeTableName: true,
	timestamps: false
});

module.exports = Video;