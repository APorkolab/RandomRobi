const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Video model with enhanced features and validation
 */
class Video extends Model {
  /**
   * Extract video ID from YouTube URL
   */
  getVideoId() {
    if (!this.link) return null;
    
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = this.link.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Get embed URL
   */
  getEmbedUrl() {
    const videoId = this.getVideoId();
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  /**
   * Get thumbnail URL
   */
  getThumbnailUrl(quality = 'maxresdefault') {
    const videoId = this.getVideoId();
    return videoId ? `https://img.youtube.com/vi/${videoId}/${quality}.jpg` : null;
  }

  /**
   * Check if video is recent (within last 24 hours)
   */
  isRecent() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.createdAt > oneDayAgo;
  }

  /**
   * Get formatted duration (if available)
   */
  getFormattedDuration() {
    if (!this.duration) return null;
    
    const hours = Math.floor(this.duration / 3600);
    const minutes = Math.floor((this.duration % 3600) / 60);
    const seconds = this.duration % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Mark as viewed
   */
  async incrementViews() {
    this.views = (this.views || 0) + 1;
    this.lastViewedAt = new Date();
    await this.save({ fields: ['views', 'lastViewedAt'] });
  }
}

Video.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  
  link: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Video link cannot be empty',
      },
      isUrl: {
        msg: 'Must be a valid URL',
      },
      isYouTubeUrl(value) {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        if (!youtubeRegex.test(value)) {
          throw new Error('Must be a valid YouTube URL');
        }
      },
    },
    set(value) {
      // Normalize YouTube URLs to embed format
      if (value && value.includes('youtube.com/watch?v=')) {
        const videoId = value.split('v=')[1]?.split('&')[0];
        if (videoId) {
          this.setDataValue('link', `https://www.youtube.com/embed/${videoId}`);
          return;
        }
      } else if (value && value.includes('youtu.be/')) {
        const videoId = value.split('youtu.be/')[1]?.split('?')[0];
        if (videoId) {
          this.setDataValue('link', `https://www.youtube.com/embed/${videoId}`);
          return;
        }
      }
      this.setDataValue('link', value);
    },
  },
  
  title: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      len: {
        args: [0, 500],
        msg: 'Title must be less than 500 characters',
      },
    },
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  
  keyword: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'The search keyword used to find this video',
    validate: {
      len: {
        args: [0, 100],
        msg: 'Keyword must be less than 100 characters',
      },
    },
  },
  
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Video duration in seconds',
    validate: {
      min: {
        args: 0,
        msg: 'Duration must be a positive number',
      },
    },
  },
  
  views: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of times this video was viewed in the app',
    validate: {
      min: {
        args: 0,
        msg: 'Views must be a positive number',
      },
    },
  },
  
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    comment: 'User rating (1.00 to 5.00)',
    validate: {
      min: {
        args: 1.00,
        msg: 'Rating must be between 1.00 and 5.00',
      },
      max: {
        args: 5.00,
        msg: 'Rating must be between 1.00 and 5.00',
      },
    },
  },
  
  category: {
    type: DataTypes.ENUM(
      'music',
      'gaming', 
      'news',
      'entertainment',
      'education',
      'science',
      'sports',
      'technology',
      'lifestyle',
      'other'
    ),
    allowNull: true,
    defaultValue: 'other',
  },
  
  language: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Video language code (e.g., en, hu, de)',
    validate: {
      len: {
        args: [2, 10],
        msg: 'Language code must be 2-10 characters',
      },
    },
  },
  
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether the video is active and can be shown',
  },
  
  isFavorite: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether the video is marked as favorite',
  },
  
  lastViewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the video was last viewed',
  },
  
  source: {
    type: DataTypes.ENUM('random', 'manual', 'import', 'api'),
    allowNull: false,
    defaultValue: 'random',
    comment: 'How the video was added to the system',
  },
  
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional metadata about the video',
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
  modelName: 'Video',
  tableName: 'videos',
  timestamps: true,
  
  // Indexes for performance
  indexes: [
    {
      fields: ['createdAt'],
      name: 'idx_videos_created_at',
    },
    {
      fields: ['isActive'],
      name: 'idx_videos_is_active',
    },
    {
      fields: ['isFavorite'],
      name: 'idx_videos_is_favorite',
    },
    {
      fields: ['category'],
      name: 'idx_videos_category',
    },
    {
      fields: ['source'],
      name: 'idx_videos_source',
    },
    {
      fields: ['keyword'],
      name: 'idx_videos_keyword',
    },
    {
      fields: ['views'],
      name: 'idx_videos_views',
    },
    {
      fields: ['rating'],
      name: 'idx_videos_rating',
    },
    {
      fields: ['lastViewedAt'],
      name: 'idx_videos_last_viewed_at',
    },
    // Compound indexes
    {
      fields: ['isActive', 'createdAt'],
      name: 'idx_videos_active_created',
    },
    {
      fields: ['category', 'isActive'],
      name: 'idx_videos_category_active',
    },
  ],
  
  // Default scope
  defaultScope: {
    where: {
      isActive: true,
    },
    order: [['createdAt', 'DESC']],
  },
  
  // Named scopes
  scopes: {
    all: {
      where: {},
    },
    
    active: {
      where: {
        isActive: true,
      },
    },
    
    inactive: {
      where: {
        isActive: false,
      },
    },
    
    favorites: {
      where: {
        isFavorite: true,
      },
    },
    
    recent: {
      where: {
        createdAt: {
          [DataTypes.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    },
    
    byCategory: (category) => ({
      where: {
        category,
      },
    }),
    
    popular: {
      order: [['views', 'DESC']],
      limit: 20,
    },
    
    topRated: {
      where: {
        rating: {
          [DataTypes.Op.gte]: 4.0,
        },
      },
      order: [['rating', 'DESC']],
    },
  },
  
  // Hooks
  hooks: {
    beforeCreate: (video) => {
      // Set default metadata if not provided
      if (!video.metadata) {
        video.metadata = {
          addedAt: new Date().toISOString(),
          source: 'system',
        };
      }
    },
    
    beforeUpdate: (video) => {
      // Update metadata on changes
      if (video.changed()) {
        video.metadata = {
          ...video.metadata,
          lastModified: new Date().toISOString(),
          modifiedFields: video.changed(),
        };
      }
    },
  },
});

/**
 * Associations
 */
Video.associate = (models) => {
  // Video belongs to user (if tracking who added it)
  // Video.belongsTo(models.User, {
  //   foreignKey: 'createdBy',
  //   as: 'creator',
  // });
};

/**
 * Class methods
 */
Video.findByKeyword = async function(keyword) {
  return this.findAll({
    where: {
      keyword,
      isActive: true,
    },
    order: [['createdAt', 'DESC']],
  });
};

Video.findPopular = async function(limit = 10) {
  return this.scope('popular').findAll({
    limit,
    where: {
      views: {
        [DataTypes.Op.gt]: 0,
      },
    },
  });
};

Video.getStats = async function() {
  const [total, active, favorites, recent] = await Promise.all([
    this.count({ where: {} }),
    this.count({ where: { isActive: true } }),
    this.count({ where: { isFavorite: true } }),
    this.scope('recent').count(),
  ]);
  
  return {
    total,
    active,
    inactive: total - active,
    favorites,
    recent,
  };
};

Video.findRandom = async function(options = {}) {
  const { category, excludeIds = [] } = options;
  
  const where = {
    isActive: true,
  };
  
  if (category) {
    where.category = category;
  }
  
  if (excludeIds.length > 0) {
    where.id = {
      [DataTypes.Op.notIn]: excludeIds,
    };
  }
  
  const videos = await this.findAll({ where });
  
  if (videos.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * videos.length);
  return videos[randomIndex];
};

module.exports = Video;
