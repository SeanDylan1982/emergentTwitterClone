const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  type: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  lastMessage: {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    type: String,
    createdAt: Date
  },
  title: String, // For group conversations
  description: String, // For group conversations
  avatar: String, // For group conversations
  isArchived: {
    type: Boolean,
    default: false
  },
  isMuted: {
    type: Boolean,
    default: false
  },
  mutedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  unreadCounts: {
    type: Map,
    of: Number,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
conversationSchema.index({ participants: 1 });
conversationSchema.index({ 'participants': 1, 'updatedAt': -1 });
conversationSchema.index({ 'lastMessage.createdAt': -1 });

// Validation for direct conversations (must have exactly 2 participants)
conversationSchema.pre('save', function(next) {
  if (this.type === 'direct' && this.participants.length !== 2) {
    const error = new Error('Direct conversations must have exactly 2 participants');
    return next(error);
  }
  
  // Initialize unread counts for new participants
  this.participants.forEach(participantId => {
    if (!this.unreadCounts.has(participantId.toString())) {
      this.unreadCounts.set(participantId.toString(), 0);
    }
  });
  
  next();
});

// Static method to find or create conversation
conversationSchema.statics.findOrCreateConversation = async function(participants, type = 'direct') {
  // Sort participants for consistent lookup
  const sortedParticipants = participants.sort();
  
  let conversation = await this.findOne({
    participants: { $all: sortedParticipants, $size: sortedParticipants.length },
    type
  });
  
  if (!conversation) {
    conversation = new this({
      participants: sortedParticipants,
      type,
      unreadCounts: new Map()
    });
    
    // Initialize unread counts
    sortedParticipants.forEach(participantId => {
      conversation.unreadCounts.set(participantId.toString(), 0);
    });
    
    await conversation.save();
  }
  
  return conversation;
};

// Static method to get user conversations
conversationSchema.statics.getUserConversations = async function(userId, limit = 20, skip = 0) {
  return this.aggregate([
    {
      $match: {
        participants: mongoose.Types.ObjectId(userId),
        isArchived: false
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'participants',
        foreignField: '_id',
        as: 'participantUsers'
      }
    },
    {
      $addFields: {
        otherParticipants: {
          $filter: {
            input: '$participantUsers',
            cond: { $ne: ['$$this._id', mongoose.Types.ObjectId(userId)] }
          }
        },
        unreadCount: { $ifNull: [`$unreadCounts.${userId}`, 0] }
      }
    },
    {
      $sort: { 'lastMessage.createdAt': -1, updatedAt: -1 }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    },
    {
      $project: {
        'participantUsers.password': 0,
        'participantUsers.email': 0,
        'participantUsers.settings': 0
      }
    }
  ]);
};

// Method to add participant (for group conversations)
conversationSchema.methods.addParticipant = async function(userId) {
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
    this.unreadCounts.set(userId.toString(), 0);
    await this.save();
  }
  return this;
};

// Method to remove participant
conversationSchema.methods.removeParticipant = async function(userId) {
  this.participants = this.participants.filter(p => !p.equals(userId));
  this.unreadCounts.delete(userId.toString());
  await this.save();
  return this;
};

// Method to mark conversation as read for user
conversationSchema.methods.markAsRead = async function(userId) {
  this.unreadCounts.set(userId.toString(), 0);
  await this.save();
  return this;
};

module.exports = mongoose.model('Conversation', conversationSchema);