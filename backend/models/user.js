const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('../config/database');

// Fallback configuration if config is not available
const BCRYPT_ROUNDS = process.env.BCRYPT_ROUNDS || 12;

/**
 * User model with enhanced security and validation
 */
class User extends Model {
  /**
   * Compare password with hash
   */
  async comparePassword(password) {
    return bcrypt.compare(password, this.password);
  }

  // Legacy method for backward compatibility
  async validPassword(password) {
    return this.comparePassword(password);
  }

  /**
   * Get user data without sensitive information
   */
  toSafeJSON() {
    // eslint-disable-next-line no-unused-vars
    const { password, ...safeData } = this.toJSON();
    return safeData;
  }

  /**
   * Check if user is admin
   */
  isAdmin() {
    return this.role === 'admin';
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin() {
    this.lastLoginAt = new Date();
    await this.save({ fields: ['lastLoginAt'] });
  }
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  username: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: {
      name: 'unique_username',
      msg: 'Username already exists',
    },
    validate: {
      len: {
        args: [3, 30],
        msg: 'Username must be between 3 and 30 characters',
      },
      isAlphanumeric: {
        msg: 'Username must contain only letters and numbers',
      },
      notEmpty: {
        msg: 'Username cannot be empty',
      },
    },
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      name: 'unique_email',
      msg: 'Email already exists',
    },
    validate: {
      isEmail: {
        msg: 'Must be a valid email address',
      },
      notEmpty: {
        msg: 'Email cannot be empty',
      },
    },
    set(value) {
      this.setDataValue('email', value.toLowerCase().trim());
    },
  },

  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [8, 255],
        msg: 'Password must be at least 8 characters long',
      },
      notEmpty: {
        msg: 'Password cannot be empty',
      },
    },
  },

  role: {
    type: DataTypes.ENUM('admin', 'user'),
    allowNull: false,
    defaultValue: 'user',
    validate: {
      isIn: {
        args: [['admin', 'user']],
        msg: 'Role must be either admin or user',
      },
    },
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },

  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'User', // Keep original table name for compatibility
  timestamps: false, // Keep as false for compatibility

  // Indexes for performance
  indexes: [
    {
      unique: true,
      fields: ['username'],
    },
    {
      unique: true,
      fields: ['email'],
    },
    {
      fields: ['role'],
    },
    {
      fields: ['isActive'],
    },
  ],

  // Default scope excludes password
  defaultScope: {
    attributes: {
      exclude: ['password'],
    },
  },

  // Named scopes
  scopes: {
    withPassword: {
      attributes: {
        include: ['password'],
      },
    },

    active: {
      where: {
        isActive: true,
      },
    },

    admins: {
      where: {
        role: 'admin',
      },
    },
  },

  // Hooks
  hooks: {
    // Hash password before creating user
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(parseInt(BCRYPT_ROUNDS, 10));
        user.password = await bcrypt.hash(user.password, salt);
      }
    },

    // Hash password before updating user
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(parseInt(BCRYPT_ROUNDS, 10));
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
  },
});

/**
 * Class methods
 */
User.findByCredentials = async function findByCredentials(username, password) {
  const user = await this.scope('withPassword').findOne({
    where: {
      username,
      isActive: true,
    },
  });

  if (!user || !(await user.comparePassword(password))) {
    return null;
  }

  // Update last login
  await user.updateLastLogin();

  return user;
};

User.createAdmin = async function createAdmin(userData) {
  return this.create({
    ...userData,
    role: 'admin',
    isActive: true,
  });
};

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         username:
 *           type: string
 *         password:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [admin, user]
 *         isActive:
 *           type: boolean
 *         lastLoginAt:
 *           type: string
 *           format: date-time
 */

module.exports = User;
