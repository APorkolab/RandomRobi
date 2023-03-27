const {
	Sequelize,
	DataTypes
} = require('sequelize');

const bcrypt = require('bcrypt');

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	storage: process.env.dbPath || './db/videos.db',
});

const User = sequelize.define('User', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	username: {
		type: DataTypes.STRING,
		allowNull: false
	},
	password: {
		type: DataTypes.STRING,
		allowNull: false
	},
	email: {
		type: DataTypes.STRING,
		allowNull: true
	}
}, {
	timestamps: false
});

User.beforeCreate(async (user) => {
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(user.password, salt);
	user.password = hashedPassword;
});

sequelize.sync();

module.exports = User;