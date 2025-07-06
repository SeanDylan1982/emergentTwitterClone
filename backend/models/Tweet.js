const mongoose = require('mongoose');

const tweetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 280,
    trim: true
  },
  type: {
    type: String,
    enum: ['tweet', 'retweet', 'quote'],
    default: 'tweet'
  },
  media: [{
    type: {
      type: String,
      enum: ['image', 'video', 'gif']
    },
    url: String,
    mediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media'
    },
    alt: {
      type: String,
      maxlength: 200
    },
    dimensions: {
      width: Number,
      height: Number
    }
  }],
  hashtags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  mentions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    displayName: String
  }],
  urls: [{
    url: String,
    expandedUrl: String,
    displayUrl: String,
    title: String,
    description: String
  }],
  stats: {
    likesCount: {
      type: Number,
      default: 0,
      min: 0
    },
    retweetsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    repliesCount: {
      type: Number,
      default: 0,
      min: 0
    },
    quotesCount: {
      type: Number,
      default: 0,
      min: 0
    },
    viewsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    bookmarksCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  replyTo: {
    tweetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tweet'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String
  },
  originalTweet: {
    tweetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tweet'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    content: String,
    createdAt: Date
  },
  quotedTweet: {
    tweetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tweet'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    content: String,
    createdAt: Date
  },
  visibility: {
    type: String,
    enum: ['public', 'followers', 'mentioned'],
    default: 'public'
  },
  allowReplies: {
    type: String,
    enum: ['everyone', 'followers', 'mentioned'],
    default: 'everyone'
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],
  location: {
    coordinates: [Number], // [longitude, latitude]
    name: String,
    countryCode: String
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  isSensitive: {
    type: Boolean,
    default: false
  },
  flaggedContent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
tweetSchema.index({ userId: 1, createdAt: -1 });
tweetSchema.index({ createdAt: -1 });
tweetSchema.index({ hashtags: 1 });
tweetSchema.index({ 'mentions.userId': 1 });
tweetSchema.index({ 'replyTo.tweetId': 1 });
tweetSchema.index({ 'stats.likesCount': -1 });
tweetSchema.index({ 'stats.retweetsCount': -1 });
tweetSchema.index({ content: 'text' });

// Pre-save middleware to extract hashtags and mentions
tweetSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Extract hashtags
    const hashtagRegex = /#(\w+)/g;
    const hashtags = [];
    let match;
    while ((match = hashtagRegex.exec(this.content)) !== null) {
      hashtags.push(match[1].toLowerCase());
    }
    this.hashtags = [...new Set(hashtags)]; // Remove duplicates
    
    // Extract mentions (@username)
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    while ((match = mentionRegex.exec(this.content)) !== null) {
      mentions.push(match[1].toLowerCase());
    }
    // Note: You'll need to resolve usernames to user IDs in the application logic
  }
  next();
});

// Method to update stats
tweetSchema.methods.updateStats = async function(field, increment = 1) {
  this.stats[field] += increment;
  return this.save();
};

// Virtual for reply thread
tweetSchema.virtual('replies', {
  ref: 'Reply',
  localField: '_id',
  foreignField: 'parentTweetId'
});

// Virtual for likes
tweetSchema.virtual('likes', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'tweetId'
});

// Virtual for retweets
tweetSchema.virtual('retweets', {
  ref: 'Retweet',
  localField: '_id',
  foreignField: 'tweetId'
});

module.exports = mongoose.model('Tweet', tweetSchema);