const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'media', 'tweet_share'],
    default: 'text'
  },
  media: {
    type: {
      type: String,
      enum: ['image', 'video', 'gif']
    },
    url: String,
    mediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media'
    },
    alt: String
  },
  sharedTweet: {
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
  isRead: {
    type: Boolean,
    default: false
  },
  isDelivered: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  readAt: Date
}, {
  timestamps: true
});

// Indexes
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

// Method to mark as read
messageSchema.methods.markAsRead = async function(userId) {
  if (this.recipientId.equals(userId) && !this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
    
    // Update conversation unread count
    const Conversation = require('./Conversation');
    await Conversation.updateOne(
      { _id: this.conversationId },
      { $inc: { [`unreadCounts.${userId}`]: -1 } }
    );
  }
  return this;
};

// Static method to get conversation messages
messageSchema.statics.getConversationMessages = async function(conversationId, limit = 50, skip = 0) {
  return this.find({ 
    conversationId,
    isDeleted: false 
  })
  .populate('senderId', 'username displayName avatar verified')
  .populate('recipientId', 'username displayName avatar verified')
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip);
};

// Static method to create message and update conversation
messageSchema.statics.createMessage = async function(messageData) {
  const Conversation = require('./Conversation');
  
  const message = new this(messageData);
  await message.save();
  
  // Update conversation with last message and unread count
  await Conversation.updateOne(
    { _id: messageData.conversationId },
    {
      $set: {
        'lastMessage': {
          messageId: message._id,
          senderId: messageData.senderId,
          content: messageData.content.substring(0, 100), // Truncated
          type: messageData.type,
          createdAt: message.createdAt
        },
        updatedAt: new Date()
      },
      $inc: { [`unreadCounts.${messageData.recipientId}`]: 1 }
    }
  );
  
  return message.populate('senderId', 'username displayName avatar verified');
};

module.exports = mongoose.model('Message', messageSchema);