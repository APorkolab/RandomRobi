const bcrypt = require('bcrypt');
const Sequelize = require("sequelize");
const db = require("../config/database");
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);

const userSchema = db.define("users", {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	username: {
		type: Sequelize.STRING,
		allowNull: false
	},
	password: {
		type: Sequelize.STRING,
		allowNull: false
	},
	email: {
		type: Sequelize.STRING,
		allowNull: true
	}
}, {
	freezeTableName: true,
	timestamps: false,
	hooks: {
		beforeCreate: async (user) => {
			if (user.password) {
				user.password = await bcrypt.hash(user.password, salt);
			}
		},
		beforeUpdate: async (user) => {
			if (user.password) {
				user.password = await bcrypt.hash(user.password, salt);
			}
		}
	}
});

userSchema.prototype.validPassword = async function (password) {
	return await bcrypt.compare(password, this.password);
};

module.exports = userSchema;