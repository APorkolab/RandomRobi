const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');
const config = require('../config/environment');

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

  emailVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },

  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,

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
    {
      fields: ['createdAt'],
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

    verified: {
      where: {
        emailVerified: true,
      },
    },
  },

  // Hooks
  hooks: {
    // Hash password before creating user
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(config.security.bcryptRounds);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },

    // Hash password before updating user
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(config.security.bcryptRounds);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },

    // Validate password strength before save
    beforeValidate: (user) => {
      if (user.password && user.changed('password')) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(user.password)) {
          throw new Error('Password must contain at least one lowercase letter, one uppercase letter, and one digit');
        }
      }
    },
  },
});

/**
 * Associations
 */
// eslint-disable-next-line no-unused-vars
User.associate = (models) => {
  // User has many videos (if tracking who created videos)
  // User.hasMany(models.Video, {
  //   foreignKey: 'createdBy',
  //   as: 'createdVideos',
  // });
};

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
    emailVerified: true,
  });
};

module.exports = User;
