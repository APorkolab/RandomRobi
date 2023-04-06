const bcrypt = require('bcrypt');
const Sequelize = require("sequelize");
const db = require("../config/database");
var userSchema = db.define("users", {
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
	// freeze name table not using *s on name
	freezeTableName: true,
	// dont use createdAt/update
	timestamps: false,
	hooks: {
		beforeCreate: async (user) => {
			if (user.password) {
				const salt = await bcrypt.genSaltSync(10, 'a');
				user.password = bcrypt.hashSync(user.password, salt);
			}
		},
		beforeUpdate: async (user) => {
			if (user.password) {
				const salt = await bcrypt.genSaltSync(10, 'a');
				user.password = bcrypt.hashSync(user.password, salt);
			}
		}
	},
	instanceMethods: {
		validPassword: (password) => {
			return bcrypt.compareSync(password, this.password);
		}
	}
});
userSchema.prototype.validPassword = async (password, hash) => {
	return await bcrypt.compareSync(password, hash);
}
module.exports = userSchema;
return userSchema;