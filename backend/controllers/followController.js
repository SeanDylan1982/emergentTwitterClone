const { Follow, User, Notification } = require('../models');
const { apiResponse } = require('../utils/helpers');
const { isValidObjectId } = require('../utils/validators');

// Follow/unfollow user
const toggleFollow = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user ID
    if (!isValidObjectId(userId)) {
      return res.status(400).json(
        apiResponse(false, null, 'Invalid user ID')
      );
    }

    // Check if user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json(
        apiResponse(false, null, 'User not found')
      );
    }

    // Prevent self-following
    if (userId === req.user._id.toString()) {
      return res.status(400).json(
        apiResponse(false, null, 'You cannot follow yourself')
      );
    }

    // Check if target user is active
    if (!targetUser.isActive || targetUser.isSuspended) {
      return res.status(400).json(
        apiResponse(false, null, 'User account is not available')
      );
    }

    // Toggle follow
    const result = await Follow.toggleFollow(req.user._id, userId);

    // Create notification if followed
    if (result.following && result.status === 'accepted') {
      await Notification.createFollowNotification(userId, req.user._id);
    }

    res.json(
      apiResponse(true, result, `User ${result.action} successfully`)
    );
  } catch (error) {
    console.error('Toggle follow error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during follow toggle')
    );
  }
};

// Get follow requests (for private accounts)
const getFollowRequests = async (req, res) => {
  try {
    const followRequests = await Follow.find({
      followeeId: req.user._id,
      status: 'pending'
    })
    .populate('followerId', 'username displayName avatar verified stats')
    .sort({ createdAt: -1 })
    .lean();

    res.json(
      apiResponse(true, { 
        requests: followRequests.map(req => ({
          ...req.followerId,
          requestId: req._id,
          requestedAt: req.createdAt
        }))
      }, 'Follow requests retrieved successfully')
    );
  } catch (error) {
    console.error('Get follow requests error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during follow requests retrieval')
    );
  }
};

// Accept follow request
const acceptFollowRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Validate request ID
    if (!isValidObjectId(requestId)) {
      return res.status(400).json(
        apiResponse(false, null, 'Invalid request ID')
      );
    }

    // Find follow request
    const followRequest = await Follow.findById(requestId);
    
    if (!followRequest) {
      return res.status(404).json(
        apiResponse(false, null, 'Follow request not found')
      );
    }

    // Check if user owns this request
    if (!followRequest.followeeId.equals(req.user._id)) {
      return res.status(403).json(
        apiResponse(false, null, 'You can only accept your own follow requests')
      );
    }

    // Check if request is pending
    if (followRequest.status !== 'pending') {
      return res.status(400).json(
        apiResponse(false, null, 'Follow request is not pending')
      );
    }

    // Accept request
    const result = await Follow.acceptFollowRequest(requestId);

    // Create notification
    await Notification.createFollowNotification(
      followRequest.followeeId,
      followRequest.followerId
    );

    res.json(
      apiResponse(true, result, 'Follow request accepted successfully')
    );
  } catch (error) {
    console.error('Accept follow request error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during follow request acceptance')
    );
  }
};

// Reject follow request
const rejectFollowRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Validate request ID
    if (!isValidObjectId(requestId)) {
      return res.status(400).json(
        apiResponse(false, null, 'Invalid request ID')
      );
    }

    // Find and delete follow request
    const followRequest = await Follow.findById(requestId);
    
    if (!followRequest) {
      return res.status(404).json(
        apiResponse(false, null, 'Follow request not found')
      );
    }

    // Check if user owns this request
    if (!followRequest.followeeId.equals(req.user._id)) {
      return res.status(403).json(
        apiResponse(false, null, 'You can only reject your own follow requests')
      );
    }

    // Check if request is pending
    if (followRequest.status !== 'pending') {
      return res.status(400).json(
        apiResponse(false, null, 'Follow request is not pending')
      );
    }

    // Delete request
    await Follow.deleteOne({ _id: requestId });

    res.json(
      apiResponse(true, null, 'Follow request rejected successfully')
    );
  } catch (error) {
    console.error('Reject follow request error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during follow request rejection')
    );
  }
};

// Remove follower
const removeFollower = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user ID
    if (!isValidObjectId(userId)) {
      return res.status(400).json(
        apiResponse(false, null, 'Invalid user ID')
      );
    }

    // Find follow relationship
    const followRelation = await Follow.findOne({
      followerId: userId,
      followeeId: req.user._id
    });

    if (!followRelation) {
      return res.status(404).json(
        apiResponse(false, null, 'Follow relationship not found')
      );
    }

    // Remove follower
    await Follow.deleteOne({ _id: followRelation._id });

    // Update stats
    await Promise.all([
      User.updateOne(
        { _id: userId },
        { $inc: { 'stats.followingCount': -1 } }
      ),
      User.updateOne(
        { _id: req.user._id },
        { $inc: { 'stats.followersCount': -1 } }
      )
    ]);

    res.json(
      apiResponse(true, null, 'Follower removed successfully')
    );
  } catch (error) {
    console.error('Remove follower error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during follower removal')
    );
  }
};

// Get mutual follows
const getMutualFollows = async (req, res) => {
  try {
    const { username } = req.params;

    // Find target user
    const targetUser = await User.findOne({ username: username.toLowerCase() });
    if (!targetUser) {
      return res.status(404).json(
        apiResponse(false, null, 'User not found')
      );
    }

    // Find mutual follows
    const mutualFollows = await Follow.aggregate([
      // Get people current user follows
      {
        $match: {
          followerId: req.user._id,
          status: 'accepted'
        }
      },
      // Check if target user also follows them
      {
        $lookup: {
          from: 'follows',
          let: { followeeId: '$followeeId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$followerId', targetUser._id] },
                    { $eq: ['$followeeId', '$$followeeId'] },
                    { $eq: ['$status', 'accepted'] }
                  ]
                }
              }
            }
          ],
          as: 'targetUserFollows'
        }
      },
      // Filter only mutual follows
      {
        $match: {
          targetUserFollows: { $ne: [] }
        }
      },
      // Get user details
      {
        $lookup: {
          from: 'users',
          localField: 'followeeId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $limit: 10
      },
      {
        $project: {
          'user.password': 0,
          'user.email': 0,
          'user.settings': 0
        }
      }
    ]);

    res.json(
      apiResponse(true, { 
        mutualFollows: mutualFollows.map(mf => mf.user),
        count: mutualFollows.length
      }, 'Mutual follows retrieved successfully')
    );
  } catch (error) {
    console.error('Get mutual follows error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during mutual follows retrieval')
    );
  }
};

// Check follow status
const checkFollowStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user ID
    if (!isValidObjectId(userId)) {
      return res.status(400).json(
        apiResponse(false, null, 'Invalid user ID')
      );
    }

    const followRelation = await Follow.findOne({
      followerId: req.user._id,
      followeeId: userId
    });

    const isFollowing = followRelation?.status === 'accepted';
    const isPending = followRelation?.status === 'pending';

    res.json(
      apiResponse(true, { 
        isFollowing,
        isPending,
        status: followRelation?.status || 'not_following'
      }, 'Follow status retrieved successfully')
    );
  } catch (error) {
    console.error('Check follow status error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during follow status check')
    );
  }
};

module.exports = {
  toggleFollow,
  getFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
  removeFollower,
  getMutualFollows,
  checkFollowStatus
};