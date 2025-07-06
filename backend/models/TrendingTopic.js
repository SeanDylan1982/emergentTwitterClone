const mongoose = require('mongoose');

const trendingTopicSchema = new mongoose.Schema({
  hashtag: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['technology', 'sports', 'entertainment', 'politics', 'general', 'news', 'business'],
    default: 'general'
  },
  location: {
    type: String,
    default: 'global' // 'global', country code, or city
  },
  stats: {
    tweetsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    usersCount: {
      type: Number,
      default: 0,
      min: 0
    },
    impressions: {
      type: Number,
      default: 0,
      min: 0
    },
    engagements: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  metrics: {
    last1Hour: {
      type: Number,
      default: 0,
      min: 0
    },
    last6Hours: {
      type: Number,
      default: 0,
      min: 0
    },
    last24Hours: {
      type: Number,
      default: 0,
      min: 0
    },
    last7Days: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  trendingScore: {
    type: Number,
    default: 0
  },
  rank: {
    type: Number,
    min: 1
  },
  peakTime: Date,
  peakTweetsPerHour: {
    type: Number,
    default: 0
  },
  isPromoted: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  sampleTweets: [{
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
    likesCount: Number,
    retweetsCount: Number
  }],
  firstSeen: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
trendingTopicSchema.index({ hashtag: 1, location: 1 });
trendingTopicSchema.index({ trendingScore: -1, location: 1 });
trendingTopicSchema.index({ rank: 1, location: 1 });
trendingTopicSchema.index({ category: 1, trendingScore: -1 });
trendingTopicSchema.index({ lastUpdated: -1 });

// TTL index to automatically remove old trending topics (7 days)
trendingTopicSchema.index({ lastUpdated: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

// Method to calculate trending score
trendingTopicSchema.methods.calculateTrendingScore = function() {
  const hourlyWeight = 10;
  const dailyWeight = 5;
  const weeklyWeight = 1;
  const userWeight = 2;
  
  this.trendingScore = 
    (this.metrics.last1Hour * hourlyWeight) +
    (this.metrics.last24Hours * dailyWeight) +
    (this.metrics.last7Days * weeklyWeight) +
    (this.stats.usersCount * userWeight);
    
  return this.trendingScore;
};

// Static method to update trending topics
trendingTopicSchema.statics.updateTrendingTopics = async function() {
  const Tweet = require('./Tweet');
  
  // Get tweets from last 24 hours with hashtags
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  // Aggregate hashtag usage
  const hashtagStats = await Tweet.aggregate([
    {
      $match: {
        createdAt: { $gte: sevenDaysAgo },
        hashtags: { $exists: true, $ne: [] }
      }
    },
    {
      $unwind: '$hashtags'
    },
    {
      $group: {
        _id: '$hashtags',
        totalTweets: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        last1Hour: {
          $sum: {
            $cond: [{ $gte: ['$createdAt', oneHourAgo] }, 1, 0]
          }
        },
        last6Hours: {
          $sum: {
            $cond: [{ $gte: ['$createdAt', sixHoursAgo] }, 1, 0]
          }
        },
        last24Hours: {
          $sum: {
            $cond: [{ $gte: ['$createdAt', oneDayAgo] }, 1, 0]
          }
        },
        sampleTweets: {
          $push: {
            tweetId: '$_id',
            userId: '$userId',
            content: '$content',
            likesCount: '$stats.likesCount',
            retweetsCount: '$stats.retweetsCount',
            createdAt: '$createdAt'
          }
        }
      }
    },
    {
      $addFields: {
        uniqueUsersCount: { $size: '$uniqueUsers' },
        last7Days: '$totalTweets'
      }
    },
    {
      $match: {
        last24Hours: { $gte: 5 } // Minimum threshold for trending
      }
    }
  ]);
  
  // Update or create trending topics
  for (const stat of hashtagStats) {
    const trendingTopic = await this.findOneAndUpdate(
      { hashtag: stat._id, location: 'global' },
      {
        $set: {
          'stats.tweetsCount': stat.totalTweets,
          'stats.usersCount': stat.uniqueUsersCount,
          'metrics.last1Hour': stat.last1Hour,
          'metrics.last6Hours': stat.last6Hours,
          'metrics.last24Hours': stat.last24Hours,
          'metrics.last7Days': stat.last7Days,
          sampleTweets: stat.sampleTweets
            .sort((a, b) => (b.likesCount + b.retweetsCount) - (a.likesCount + a.retweetsCount))
            .slice(0, 3),
          lastUpdated: new Date()
        }
      },
      { 
        upsert: true, 
        new: true 
      }
    );
    
    // Calculate trending score
    trendingTopic.calculateTrendingScore();
    await trendingTopic.save();
  }
  
  // Update rankings
  await this.updateRankings();
};

// Static method to update rankings
trendingTopicSchema.statics.updateRankings = async function(location = 'global') {
  const topics = await this.find({ location, isBlocked: false })
    .sort({ trendingScore: -1 })
    .limit(50);
    
  for (let i = 0; i < topics.length; i++) {
    topics[i].rank = i + 1;
    await topics[i].save();
  }
};

// Static method to get trending topics
trendingTopicSchema.statics.getTrending = async function(location = 'global', category = null, limit = 10) {
  const filter = { 
    location, 
    isBlocked: false,
    rank: { $lte: 50 }
  };
  
  if (category) {
    filter.category = category;
  }
  
  return this.find(filter)
    .sort({ rank: 1 })
    .limit(limit)
    .select('-sampleTweets._id')
    .lean();
};

// Static method to get hashtag details
trendingTopicSchema.statics.getHashtagDetails = async function(hashtag, location = 'global') {
  return this.findOne({ hashtag: hashtag.toLowerCase(), location })
    .populate('sampleTweets.userId', 'username displayName avatar verified')
    .lean();
};

module.exports = mongoose.model('TrendingTopic', trendingTopicSchema);