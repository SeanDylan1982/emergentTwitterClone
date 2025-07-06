const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tweetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet',
    required: true,
    unique: true // Each tweet can only be a reply once
  },
  parentTweetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet',
    required: true
  },
  parentUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet', // Root tweet of the thread
    required: true
  },
  level: {
    type: Number,
    default: 0, // 0 = direct reply, 1 = reply to reply, etc.
    min: 0
  }
}, {
  timestamps: true
});

// Indexes
replySchema.index({ parentTweetId: 1, createdAt: -1 });
replySchema.index({ userId: 1, createdAt: -1 });
replySchema.index({ threadId: 1, level: 1, createdAt: -1 });
replySchema.index({ tweetId: 1 }, { unique: true });

// Static method to create a reply
replySchema.statics.createReply = async function(userId, content, parentTweetId, media = []) {
  const Tweet = require('./Tweet');
  const User = require('./User');
  
  // Get parent tweet to determine thread info
  const parentTweet = await Tweet.findById(parentTweetId).populate('userId', 'username');
  if (!parentTweet) {
    throw new Error('Parent tweet not found');
  }
  
  // Find if parent tweet is already a reply to determine thread and level
  const parentReply = await this.findOne({ tweetId: parentTweetId });
  const threadId = parentReply ? parentReply.threadId : parentTweetId;
  const level = parentReply ? parentReply.level + 1 : 0;
  
  // Create the reply tweet
  const replyTweet = new Tweet({
    userId,
    content,
    type: 'tweet', // Replies are regular tweets with reply metadata
    media,
    replyTo: {
      tweetId: parentTweetId,
      userId: parentTweet.userId._id,
      username: parentTweet.userId.username
    }
  });
  
  await replyTweet.save();
  
  // Create the reply relationship
  const reply = new this({
    userId,
    tweetId: replyTweet._id,
    parentTweetId,
    parentUserId: parentTweet.userId._id,
    threadId,
    level
  });
  
  await reply.save();
  
  // Update stats
  await Tweet.updateOne(
    { _id: parentTweetId },
    { $inc: { 'stats.repliesCount': 1 } }
  );
  
  await User.updateOne(
    { _id: userId },
    { $inc: { 'stats.tweetsCount': 1 } }
  );
  
  return {
    reply,
    replyTweet: await Tweet.findById(replyTweet._id).populate('userId', 'username displayName avatar verified')
  };
};

// Static method to get thread
replySchema.statics.getThread = async function(threadId, limit = 50, skip = 0) {
  const Tweet = require('./Tweet');
  
  return this.aggregate([
    {
      $match: { threadId: mongoose.Types.ObjectId(threadId) }
    },
    {
      $lookup: {
        from: 'tweets',
        localField: 'tweetId',
        foreignField: '_id',
        as: 'tweet'
      }
    },
    {
      $unwind: '$tweet'
    },
    {
      $lookup: {
        from: 'users',
        localField: 'tweet.userId',
        foreignField: '_id',
        as: 'tweet.user'
      }
    },
    {
      $unwind: '$tweet.user'
    },
    {
      $sort: { level: 1, createdAt: 1 }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    },
    {
      $project: {
        'tweet.user.password': 0,
        'tweet.user.email': 0,
        'tweet.user.settings': 0
      }
    }
  ]);
};

module.exports = mongoose.model('Reply', replySchema);