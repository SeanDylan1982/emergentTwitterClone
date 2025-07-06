const mongoose = require('mongoose');

const hashtagSchema = new mongoose.Schema({
  hashtag: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-zA-Z0-9_]+$/
  },
  stats: {
    totalUsage: {
      type: Number,
      default: 0,
      min: 0
    },
    uniqueUsers: {
      type: Number,
      default: 0,
      min: 0
    },
    peakUsage: {
      type: Number,
      default: 0,
      min: 0
    },
    peakDate: Date
  },
  recentActivity: {
    today: {
      type: Number,
      default: 0,
      min: 0
    },
    thisWeek: {
      type: Number,
      default: 0,
      min: 0
    },
    thisMonth: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  category: {
    type: String,
    enum: ['technology', 'sports', 'entertainment', 'politics', 'general', 'news', 'business'],
    default: 'general'
  },
  description: {
    type: String,
    maxlength: 200
  },
  relatedHashtags: [{
    hashtag: String,
    frequency: {
      type: Number,
      default: 1
    }
  }],
  isBlocked: {
    type: Boolean,
    default: false
  },
  isPromoted: {
    type: Boolean,
    default: false
  },
  firstUsed: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
hashtagSchema.index({ hashtag: 1 }, { unique: true });
hashtagSchema.index({ 'stats.totalUsage': -1 });
hashtagSchema.index({ 'recentActivity.today': -1 });
hashtagSchema.index({ category: 1, 'stats.totalUsage': -1 });
hashtagSchema.index({ lastUsed: -1 });
hashtagSchema.index({ hashtag: 'text' });

// Static method to increment usage
hashtagSchema.statics.incrementUsage = async function(hashtagText, userId) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const hashtag = await this.findOneAndUpdate(
    { hashtag: hashtagText.toLowerCase() },
    {
      $inc: { 
        'stats.totalUsage': 1,
        'recentActivity.today': 1,
        'recentActivity.thisWeek': 1,
        'recentActivity.thisMonth': 1
      },
      $set: { lastUsed: now },
      $addToSet: { uniqueUsers: userId }
    },
    { 
      upsert: true, 
      new: true 
    }
  );
  
  // Update unique users count
  hashtag.stats.uniqueUsers = hashtag.uniqueUsers ? hashtag.uniqueUsers.length : 1;
  
  // Check if this is a new peak
  if (hashtag.recentActivity.today > hashtag.stats.peakUsage) {
    hashtag.stats.peakUsage = hashtag.recentActivity.today;
    hashtag.stats.peakDate = today;
  }
  
  await hashtag.save();
  return hashtag;
};

// Static method to update related hashtags
hashtagSchema.statics.updateRelatedHashtags = async function(hashtagsList) {
  // Update co-occurrence of hashtags
  for (let i = 0; i < hashtagsList.length; i++) {
    const currentHashtag = hashtagsList[i];
    const relatedTags = hashtagsList.filter((tag, index) => index !== i);
    
    if (relatedTags.length > 0) {
      await this.updateOne(
        { hashtag: currentHashtag },
        {
          $inc: relatedTags.reduce((acc, tag) => {
            acc[`relatedHashtags.$[elem${tag}].frequency`] = 1;
            return acc;
          }, {}),
          $addToSet: {
            relatedHashtags: {
              $each: relatedTags.map(tag => ({ hashtag: tag, frequency: 1 }))
            }
          }
        },
        {
          arrayFilters: relatedTags.map(tag => ({ [`elem${tag}.hashtag`]: tag }))
        }
      );
    }
  }
};

// Static method to get popular hashtags
hashtagSchema.statics.getPopular = async function(limit = 20, timeframe = 'today') {
  const sortField = `recentActivity.${timeframe}`;
  
  return this.find({ isBlocked: false })
    .sort({ [sortField]: -1 })
    .limit(limit)
    .select('hashtag stats recentActivity category')
    .lean();
};

// Static method to search hashtags
hashtagSchema.statics.searchHashtags = async function(query, limit = 10) {
  return this.find({
    hashtag: { $regex: query, $options: 'i' },
    isBlocked: false
  })
  .sort({ 'stats.totalUsage': -1 })
  .limit(limit)
  .select('hashtag stats.totalUsage recentActivity.today')
  .lean();
};

// Static method to get hashtag suggestions
hashtagSchema.statics.getSuggestions = async function(partialTag, limit = 5) {
  return this.find({
    hashtag: { $regex: `^${partialTag}`, $options: 'i' },
    isBlocked: false
  })
  .sort({ 'stats.totalUsage': -1 })
  .limit(limit)
  .select('hashtag stats.totalUsage')
  .lean();
};

// Static method to reset daily counters (to be run by cron job)
hashtagSchema.statics.resetDailyCounters = async function() {
  return this.updateMany(
    {},
    { $set: { 'recentActivity.today': 0 } }
  );
};

// Static method to reset weekly counters (to be run by cron job)
hashtagSchema.statics.resetWeeklyCounters = async function() {
  return this.updateMany(
    {},
    { $set: { 'recentActivity.thisWeek': 0 } }
  );
};

// Static method to reset monthly counters (to be run by cron job)
hashtagSchema.statics.resetMonthlyCounters = async function() {
  return this.updateMany(
    {},
    { $set: { 'recentActivity.thisMonth': 0 } }
  );
};

// Method to get related hashtags
hashtagSchema.methods.getRelated = function(limit = 5) {
  return this.relatedHashtags
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, limit)
    .map(tag => tag.hashtag);
};

module.exports = mongoose.model('Hashtag', hashtagSchema);