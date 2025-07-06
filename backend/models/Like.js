const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
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
  tweetAuthorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound unique index to prevent duplicate likes
likeSchema.index({ userId: 1, tweetId: 1 }, { unique: true });
likeSchema.index({ tweetId: 1, createdAt: -1 });
likeSchema.index({ userId: 1, createdAt: -1 });
likeSchema.index({ tweetAuthorId: 1, createdAt: -1 });

// Static method to toggle like
likeSchema.statics.toggleLike = async function(userId, tweetId, tweetAuthorId) {
  const Tweet = require('./Tweet');
  const User = require('./User');
  
  const existingLike = await this.findOne({ userId, tweetId });
  
  if (existingLike) {
    // Unlike
    await this.deleteOne({ _id: existingLike._id });
    await Tweet.updateOne(
      { _id: tweetId },
      { $inc: { 'stats.likesCount': -1 } }
    );
    await User.updateOne(
      { _id: tweetAuthorId },
      { $inc: { 'stats.likesCount': -1 } }
    );
    return { liked: false, action: 'unliked' };
  } else {
    // Like
    const newLike = new this({ userId, tweetId, tweetAuthorId });
    await newLike.save();
    await Tweet.updateOne(
      { _id: tweetId },
      { $inc: { 'stats.likesCount': 1 } }
    );
    await User.updateOne(
      { _id: tweetAuthorId },
      { $inc: { 'stats.likesCount': 1 } }
    );
    return { liked: true, action: 'liked', likeId: newLike._id };
  }
};

module.exports = mongoose.model('Like', likeSchema);