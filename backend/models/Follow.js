const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  followerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  followeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted'],
    default: 'accepted' // Default to accepted, pending for private accounts
  }
}, {
  timestamps: true
});

// Compound unique index to prevent duplicate follows
followSchema.index({ followerId: 1, followeeId: 1 }, { unique: true });
followSchema.index({ followeeId: 1, createdAt: -1 });
followSchema.index({ followerId: 1, createdAt: -1 });
followSchema.index({ status: 1 });

// Prevent self-following
followSchema.pre('save', function(next) {
  if (this.followerId.equals(this.followeeId)) {
    const error = new Error('Users cannot follow themselves');
    return next(error);
  }
  next();
});

// Static method to toggle follow
followSchema.statics.toggleFollow = async function(followerId, followeeId) {
  const User = require('./User');
  
  const existingFollow = await this.findOne({ followerId, followeeId });
  
  if (existingFollow) {
    // Unfollow
    await this.deleteOne({ _id: existingFollow._id });
    
    // Update stats
    await User.updateOne(
      { _id: followerId },
      { $inc: { 'stats.followingCount': -1 } }
    );
    await User.updateOne(
      { _id: followeeId },
      { $inc: { 'stats.followersCount': -1 } }
    );
    
    return { following: false, action: 'unfollowed' };
  } else {
    // Check if target user is private
    const targetUser = await User.findById(followeeId);
    const status = targetUser.isPrivate ? 'pending' : 'accepted';
    
    // Follow
    const newFollow = new this({ followerId, followeeId, status });
    await newFollow.save();
    
    // Update stats only if accepted
    if (status === 'accepted') {
      await User.updateOne(
        { _id: followerId },
        { $inc: { 'stats.followingCount': 1 } }
      );
      await User.updateOne(
        { _id: followeeId },
        { $inc: { 'stats.followersCount': 1 } }
      );
    }
    
    return { 
      following: true, 
      action: 'followed', 
      status,
      followId: newFollow._id 
    };
  }
};

// Static method to accept follow request
followSchema.statics.acceptFollowRequest = async function(followId) {
  const User = require('./User');
  
  const follow = await this.findByIdAndUpdate(
    followId,
    { status: 'accepted' },
    { new: true }
  );
  
  if (follow) {
    // Update stats
    await User.updateOne(
      { _id: follow.followerId },
      { $inc: { 'stats.followingCount': 1 } }
    );
    await User.updateOne(
      { _id: follow.followeeId },
      { $inc: { 'stats.followersCount': 1 } }
    );
  }
  
  return follow;
};

// Static method to get followers
followSchema.statics.getFollowers = async function(userId, limit = 20, skip = 0) {
  return this.aggregate([
    {
      $match: { 
        followeeId: mongoose.Types.ObjectId(userId),
        status: 'accepted'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'followerId',
        foreignField: '_id',
        as: 'follower'
      }
    },
    {
      $unwind: '$follower'
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    },
    {
      $project: {
        'follower.password': 0,
        'follower.email': 0,
        'follower.settings': 0
      }
    }
  ]);
};

// Static method to get following
followSchema.statics.getFollowing = async function(userId, limit = 20, skip = 0) {
  return this.aggregate([
    {
      $match: { 
        followerId: mongoose.Types.ObjectId(userId),
        status: 'accepted'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'followeeId',
        foreignField: '_id',
        as: 'following'
      }
    },
    {
      $unwind: '$following'
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    },
    {
      $project: {
        'following.password': 0,
        'following.email': 0,
        'following.settings': 0
      }
    }
  ]);
};

module.exports = mongoose.model('Follow', followSchema);