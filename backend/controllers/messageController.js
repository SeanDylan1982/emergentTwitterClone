const { Message, Conversation, User } = require('../models');
const { apiResponse } = require('../utils/helpers');
const { validatePagination, isValidObjectId } = require('../utils/validators');

// Send message
const sendMessage = async (req, res) => {
  try {
    const { recipientId, content, type = 'text', media } = req.body;

    // Validate recipient ID
    if (!isValidObjectId(recipientId)) {
      return res.status(400).json(
        apiResponse(false, null, 'Invalid recipient ID')
      );
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json(
        apiResponse(false, null, 'Recipient not found')
      );
    }

    // Prevent sending message to self
    if (recipientId === req.user._id.toString()) {
      return res.status(400).json(
        apiResponse(false, null, 'You cannot send a message to yourself')
      );
    }

    // Find or create conversation
    const conversation = await Conversation.findOrCreateConversation([
      req.user._id,
      recipientId
    ]);

    // Create message
    const messageData = {
      conversationId: conversation._id,
      senderId: req.user._id,
      recipientId,
      content,
      type
    };

    if (media && type === 'media') {
      messageData.media = media;
    }

    const message = await Message.createMessage(messageData);

    res.status(201).json(
      apiResponse(true, { message }, 'Message sent successfully')
    );
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during message sending')
    );
  }
};

// Get user conversations
const getConversations = async (req, res) => {
  try {
    const { page, limit, skip } = validatePagination(req.query.page, req.query.limit);

    const conversations = await Conversation.getUserConversations(
      req.user._id,
      limit,
      skip
    );

    res.json(
      apiResponse(true, { 
        conversations,
        pagination: { page, limit, hasMore: conversations.length === limit }
      }, 'Conversations retrieved successfully')
    );
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during conversations retrieval')
    );
  }
};

// Get conversation messages
const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page, limit, skip } = validatePagination(req.query.page, req.query.limit);

    // Validate conversation ID
    if (!isValidObjectId(conversationId)) {
      return res.status(400).json(
        apiResponse(false, null, 'Invalid conversation ID')
      );
    }

    // Check if user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json(
        apiResponse(false, null, 'Conversation not found')
      );
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json(
        apiResponse(false, null, 'You are not part of this conversation')
      );
    }

    // Get messages
    const messages = await Message.getConversationMessages(
      conversationId,
      limit,
      skip
    );

    res.json(
      apiResponse(true, { 
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: { page, limit, hasMore: messages.length === limit }
      }, 'Messages retrieved successfully')
    );
  } catch (error) {
    console.error('Get conversation messages error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during messages retrieval')
    );
  }
};

// Mark messages as read
const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Validate conversation ID
    if (!isValidObjectId(conversationId)) {
      return res.status(400).json(
        apiResponse(false, null, 'Invalid conversation ID')
      );
    }

    // Check if user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json(
        apiResponse(false, null, 'Conversation not found')
      );
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json(
        apiResponse(false, null, 'You are not part of this conversation')
      );
    }

    // Mark all unread messages as read
    await Message.updateMany(
      {
        conversationId,
        recipientId: req.user._id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    // Update conversation unread count
    await conversation.markAsRead(req.user._id);

    res.json(
      apiResponse(true, null, 'Messages marked as read')
    );
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during message read marking')
    );
  }
};

// Delete message
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    // Validate message ID
    if (!isValidObjectId(messageId)) {
      return res.status(400).json(
        apiResponse(false, null, 'Invalid message ID')
      );
    }

    // Find message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json(
        apiResponse(false, null, 'Message not found')
      );
    }

    // Check if user can delete this message
    if (!message.senderId.equals(req.user._id) && !message.recipientId.equals(req.user._id)) {
      return res.status(403).json(
        apiResponse(false, null, 'You can only delete your own messages')
      );
    }

    // Add user to deletedBy array
    if (!message.deletedBy.includes(req.user._id)) {
      message.deletedBy.push(req.user._id);
    }

    // If both users have deleted, mark as deleted
    if (message.deletedBy.length >= 2) {
      message.isDeleted = true;
    }

    await message.save();

    res.json(
      apiResponse(true, null, 'Message deleted successfully')
    );
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during message deletion')
    );
  }
};

// Search messages
const searchMessages = async (req, res) => {
  try {
    const { q, conversationId } = req.query;
    const { page, limit, skip } = validatePagination(req.query.page, req.query.limit);

    if (!q || q.trim().length === 0) {
      return res.status(400).json(
        apiResponse(false, null, 'Search query is required')
      );
    }

    // Build search query
    const searchQuery = {
      $or: [
        { senderId: req.user._id },
        { recipientId: req.user._id }
      ],
      content: { $regex: q, $options: 'i' },
      isDeleted: false,
      deletedBy: { $ne: req.user._id }
    };

    if (conversationId) {
      if (!isValidObjectId(conversationId)) {
        return res.status(400).json(
          apiResponse(false, null, 'Invalid conversation ID')
        );
      }
      searchQuery.conversationId = conversationId;
    }

    const messages = await Message.find(searchQuery)
      .populate('senderId', 'username displayName avatar')
      .populate('recipientId', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    res.json(
      apiResponse(true, { 
        messages,
        pagination: { page, limit, hasMore: messages.length === limit }
      }, 'Messages search completed successfully')
    );
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during message search')
    );
  }
};

// Get unread messages count
const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      recipientId: req.user._id,
      isRead: false,
      isDeleted: false,
      deletedBy: { $ne: req.user._id }
    });

    res.json(
      apiResponse(true, { unreadCount }, 'Unread count retrieved successfully')
    );
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during unread count retrieval')
    );
  }
};

// Archive conversation
const archiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Validate conversation ID
    if (!isValidObjectId(conversationId)) {
      return res.status(400).json(
        apiResponse(false, null, 'Invalid conversation ID')
      );
    }

    // Check if user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json(
        apiResponse(false, null, 'Conversation not found')
      );
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json(
        apiResponse(false, null, 'You are not part of this conversation')
      );
    }

    // Archive conversation
    conversation.isArchived = true;
    await conversation.save();

    res.json(
      apiResponse(true, null, 'Conversation archived successfully')
    );
  } catch (error) {
    console.error('Archive conversation error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during conversation archiving')
    );
  }
};

// Unarchive conversation
const unarchiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Validate conversation ID
    if (!isValidObjectId(conversationId)) {
      return res.status(400).json(
        apiResponse(false, null, 'Invalid conversation ID')
      );
    }

    // Check if user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json(
        apiResponse(false, null, 'Conversation not found')
      );
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json(
        apiResponse(false, null, 'You are not part of this conversation')
      );
    }

    // Unarchive conversation
    conversation.isArchived = false;
    await conversation.save();

    res.json(
      apiResponse(true, null, 'Conversation unarchived successfully')
    );
  } catch (error) {
    console.error('Unarchive conversation error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during conversation unarchiving')
    );
  }
};

module.exports = {
  sendMessage,
  getConversations,
  getConversationMessages,
  markMessagesAsRead,
  deleteMessage,
  searchMessages,
  getUnreadCount,
  archiveConversation,
  unarchiveConversation
};