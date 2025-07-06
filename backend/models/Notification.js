const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['like', 'retweet', 'reply', 'follow', 'mention', 'message', 'quote'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 200
  },
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fromUsername: String,
  fromDisplayName: String,
  fromAvatar: String,
  relatedTweetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet'
  },
  relatedMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  relatedConversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isDelivered: {
    type: Boolean,
    default: false
  },
  sentViaEmail: {
    type: Boolean,
    default: false
  },
  sentViaPush: {
    type: Boolean,
    default: false
  },
  readAt: Date
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ fromUserId: 1, createdAt: -1 });

// TTL index to automatically delete old notifications (30 days)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Static method to create notification
notificationSchema.statics.createNotification = async function(notificationData) {
  const User = require('./User');
  
  // Get user notification settings
  const user = await User.findById(notificationData.userId);
  if (!user.settings.notifications[notificationData.type]) {
    return null; // User has disabled this type of notification
  }
  
  // Get sender info
  const fromUser = await User.findById(notificationData.fromUserId);
  
  const notification = new this({
    ...notificationData,
    fromUsername: fromUser.username,
    fromDisplayName: fromUser.displayName,
    fromAvatar: fromUser.avatar.url
  });
  
  await notification.save();
  return notification;
};

// Static method to create like notification
notificationSchema.statics.createLikeNotification = async function(userId, fromUserId, tweetId) {
  const Tweet = require('./Tweet');
  const tweet = await Tweet.findById(tweetId);
  
  return this.createNotification({
    userId,
    type: 'like',
    title: 'New like',
    message: `liked your tweet`,
    fromUserId,
    relatedTweetId: tweetId
  });
};

// Static method to create retweet notification
notificationSchema.statics.createRetweetNotification = async function(userId, fromUserId, tweetId) {
  return this.createNotification({
    userId,
    type: 'retweet',
    title: 'New retweet',
    message: `retweeted your tweet`,
    fromUserId,
    relatedTweetId: tweetId
  });
};

// Static method to create reply notification
notificationSchema.statics.createReplyNotification = async function(userId, fromUserId, tweetId) {
  return this.createNotification({
    userId,
    type: 'reply',
    title: 'New reply',
    message: `replied to your tweet`,
    fromUserId,
    relatedTweetId: tweetId
  });
};

// Static method to create follow notification
notificationSchema.statics.createFollowNotification = async function(userId, fromUserId) {
  return this.createNotification({
    userId,
    type: 'follow',
    title: 'New follower',
    message: `started following you`,
    fromUserId
  });
};

// Static method to create mention notification
notificationSchema.statics.createMentionNotification = async function(userId, fromUserId, tweetId) {
  return this.createNotification({
    userId,
    type: 'mention',
    title: 'You were mentioned',
    message: `mentioned you in a tweet`,
    fromUserId,
    relatedTweetId: tweetId
  });
};

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { userId, isRead: false },
    { 
      isRead: true, 
      readAt: new Date() 
    }
  );
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = async function(userId, limit = 20, skip = 0, unreadOnly = false) {
  const filter = { userId };
  if (unreadOnly) {
    filter.isRead = false;
  }
  
  return this.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('fromUserId', 'username displayName avatar verified')
    .populate('relatedTweetId', 'content stats')
    .lean();
};

module.exports = mongoose.model('Notification', notificationSchema);