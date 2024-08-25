const bcrypt = require('bcrypt');
const {
	DataTypes
} = require("sequelize");
const sequelize = require("../config/database");
const saltRounds = 10;

const User = sequelize.define("User", {
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
	freezeTableName: true,
	timestamps: false,
	hooks: {
		beforeCreate: hashPassword,
		beforeUpdate: hashPassword
	}
});

async function hashPassword(user) {
	if (user.password) {
		const salt = await bcrypt.genSalt(saltRounds);
		user.password = await bcrypt.hash(user.password, salt);
	}
}

User.prototype.validPassword = async function (password) {
	return await bcrypt.compare(password, this.password);
};

module.exports = User;