const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  bio: {
    type: String,
    maxlength: 160,
    default: ''
  },
  location: {
    type: String,
    maxlength: 50,
    default: ''
  },
  website: {
    type: String,
    maxlength: 100,
    default: ''
  },
  avatar: {
    url: {
      type: String,
      default: ''
    },
    mediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media'
    },
    default: {
      type: Boolean,
      default: true
    }
  },
  banner: {
    url: {
      type: String,
      default: ''
    },
    mediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media'
    }
  },
  verified: {
    type: Boolean,
    default: false
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  stats: {
    tweetsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    followersCount: {
      type: Number,
      default: 0,
      min: 0
    },
    followingCount: {
      type: Number,
      default: 0,
      min: 0
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  settings: {
    theme: {
      type: String,
      enum: ['dark', 'light'],
      default: 'dark'
    },
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      likes: {
        type: Boolean,
        default: true
      },
      retweets: {
        type: Boolean,
        default: true
      },
      replies: {
        type: Boolean,
        default: true
      },
      follows: {
        type: Boolean,
        default: true
      },
      messages: {
        type: Boolean,
        default: true
      }
    }
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isSuspended: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ displayName: 'text' });
userSchema.index({ 'stats.followersCount': -1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.email;
  delete userObject.settings;
  return userObject;
};

// Method to update stats
userSchema.methods.updateStats = async function(field, increment = 1) {
  this.stats[field] += increment;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);