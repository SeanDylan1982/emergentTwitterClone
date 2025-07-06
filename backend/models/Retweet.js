const mongoose = require('mongoose');

const retweetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tweetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet',
    required: true
  },
  originalUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['retweet', 'quote'],
    default: 'retweet'
  },
  comment: {
    type: String,
    maxlength: 280,
    trim: true
  },
  quoteTweetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet'
  }
}, {
  timestamps: true
});

// Compound unique index to prevent duplicate retweets
retweetSchema.index({ userId: 1, tweetId: 1 }, { unique: true });
retweetSchema.index({ tweetId: 1, createdAt: -1 });
retweetSchema.index({ userId: 1, createdAt: -1 });
retweetSchema.index({ originalUserId: 1, createdAt: -1 });

// Static method to toggle retweet
retweetSchema.statics.toggleRetweet = async function(userId, tweetId, originalUserId, type = 'retweet', comment = '') {
  const Tweet = require('./Tweet');
  const User = require('./User');
  
  const existingRetweet = await this.findOne({ userId, tweetId, type });
  
  if (existingRetweet) {
    // Un-retweet
    await this.deleteOne({ _id: existingRetweet._id });
    
    const updateField = type === 'quote' ? 'stats.quotesCount' : 'stats.retweetsCount';
    await Tweet.updateOne(
      { _id: tweetId },
      { $inc: { [updateField]: -1 } }
    );
    
    // If it's a quote tweet, also delete the quote tweet
    if (type === 'quote' && existingRetweet.quoteTweetId) {
      await Tweet.updateOne(
        { _id: existingRetweet.quoteTweetId },
        { isDeleted: true }
      );
      await User.updateOne(
        { _id: userId },
        { $inc: { 'stats.tweetsCount': -1 } }
      );
    }
    
    return { retweeted: false, action: 'unretweeted' };
  } else {
    // Retweet
    const newRetweet = new this({ 
      userId, 
      tweetId, 
      originalUserId, 
      type,
      comment: type === 'quote' ? comment : ''
    });
    
    // If it's a quote tweet, create a new tweet
    if (type === 'quote') {
      const originalTweet = await Tweet.findById(tweetId).populate('userId', 'username displayName');
      const quoteTweet = new Tweet({
        userId,
        content: comment,
        type: 'quote',
        quotedTweet: {
          tweetId,
          userId: originalUserId,
          username: originalTweet.userId.username,
          content: originalTweet.content,
          createdAt: originalTweet.createdAt
        }
      });
      
      await quoteTweet.save();
      newRetweet.quoteTweetId = quoteTweet._id;
      
      await User.updateOne(
        { _id: userId },
        { $inc: { 'stats.tweetsCount': 1 } }
      );
    }
    
    await newRetweet.save();
    
    const updateField = type === 'quote' ? 'stats.quotesCount' : 'stats.retweetsCount';
    await Tweet.updateOne(
      { _id: tweetId },
      { $inc: { [updateField]: 1 } }
    );
    
    return { 
      retweeted: true, 
      action: type === 'quote' ? 'quoted' : 'retweeted', 
      retweetId: newRetweet._id,
      quoteTweetId: newRetweet.quoteTweetId
    };
  }
};

module.exports = mongoose.model('Retweet', retweetSchema);