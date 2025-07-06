const { Notification } = require('../models');
const { apiResponse } = require('../utils/helpers');
const { validatePagination, isValidObjectId } = require('../utils/validators');
const { getNotificationsPipeline } = require('../utils/aggregations');

// Get user notifications
const getNotifications = async (req, res) => {
  try {
    const { page, limit, skip } = validatePagination(req.query.page, req.query.limit);
    const { unreadOnly } = req.query;

    const notifications = await Notification.aggregate(
      getNotificationsPipeline(req.user._id, limit, skip)
    );

    // Filter unread only if requested
    const filteredNotifications = unreadOnly === 'true' 
      ? notifications.filter(n => !n.isRead)
      : notifications;

    res.json(
      apiResponse(true, { 
        notifications: filteredNotifications,
        pagination: { page, limit, hasMore: notifications.length === limit }
      }, 'Notifications retrieved successfully')
    );
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during notifications retrieval')
    );
  }
};

// Get unread notifications count
const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false
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

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    // Validate notification ID
    if (!isValidObjectId(notificationId)) {
      return res.status(400).json(
        apiResponse(false, null, 'Invalid notification ID')
      );
    }

    // Find notification
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json(
        apiResponse(false, null, 'Notification not found')
      );
    }

    // Check ownership
    if (!notification.userId.equals(req.user._id)) {
      return res.status(403).json(
        apiResponse(false, null, 'You can only mark your own notifications as read')
      );
    }

    // Mark as read
    await notification.markAsRead();

    res.json(
      apiResponse(true, { notification }, 'Notification marked as read')
    );
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during notification marking')
    );
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.markAllAsRead(req.user._id);

    res.json(
      apiResponse(true, { 
        modifiedCount: result.modifiedCount 
      }, 'All notifications marked as read')
    );
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during bulk notification marking')
    );
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    // Validate notification ID
    if (!isValidObjectId(notificationId)) {
      return res.status(400).json(
        apiResponse(false, null, 'Invalid notification ID')
      );
    }

    // Find and delete notification
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json(
        apiResponse(false, null, 'Notification not found')
      );
    }

    // Check ownership
    if (!notification.userId.equals(req.user._id)) {
      return res.status(403).json(
        apiResponse(false, null, 'You can only delete your own notifications')
      );
    }

    await Notification.deleteOne({ _id: notificationId });

    res.json(
      apiResponse(true, null, 'Notification deleted successfully')
    );
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during notification deletion')
    );
  }
};

// Delete all notifications
const deleteAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      userId: req.user._id
    });

    res.json(
      apiResponse(true, { 
        deletedCount: result.deletedCount 
      }, 'All notifications deleted successfully')
    );
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during bulk notification deletion')
    );
  }
};

// Get notifications by type
const getNotificationsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { page, limit, skip } = validatePagination(req.query.page, req.query.limit);

    const validTypes = ['like', 'retweet', 'reply', 'follow', 'mention', 'message', 'quote'];
    if (!validTypes.includes(type)) {
      return res.status(400).json(
        apiResponse(false, null, 'Invalid notification type')
      );
    }

    const notifications = await Notification.find({
      userId: req.user._id,
      type
    })
    .populate('fromUserId', 'username displayName avatar verified')
    .populate('relatedTweetId', 'content stats')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

    res.json(
      apiResponse(true, { 
        notifications,
        pagination: { page, limit, hasMore: notifications.length === limit }
      }, `${type} notifications retrieved successfully`)
    );
  } catch (error) {
    console.error('Get notifications by type error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during notifications retrieval')
    );
  }
};

// Update notification settings
const updateNotificationSettings = async (req, res) => {
  try {
    const { 
      email, 
      push, 
      likes, 
      retweets, 
      replies, 
      follows, 
      messages 
    } = req.body;

    const updates = {};
    
    if (typeof email === 'boolean') updates['settings.notifications.email'] = email;
    if (typeof push === 'boolean') updates['settings.notifications.push'] = push;
    if (typeof likes === 'boolean') updates['settings.notifications.likes'] = likes;
    if (typeof retweets === 'boolean') updates['settings.notifications.retweets'] = retweets;
    if (typeof replies === 'boolean') updates['settings.notifications.replies'] = replies;
    if (typeof follows === 'boolean') updates['settings.notifications.follows'] = follows;
    if (typeof messages === 'boolean') updates['settings.notifications.messages'] = messages;

    const { User } = require('../models');
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true }
    ).select('settings.notifications');

    res.json(
      apiResponse(true, { 
        notificationSettings: user.settings.notifications 
      }, 'Notification settings updated successfully')
    );
  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during settings update')
    );
  }
};

// Get notification settings
const getNotificationSettings = async (req, res) => {
  try {
    const { User } = require('../models');
    const user = await User.findById(req.user._id).select('settings.notifications');

    res.json(
      apiResponse(true, { 
        notificationSettings: user.settings.notifications 
      }, 'Notification settings retrieved successfully')
    );
  } catch (error) {
    console.error('Get notification settings error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during settings retrieval')
    );
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getNotificationsByType,
  updateNotificationSettings,
  getNotificationSettings
};