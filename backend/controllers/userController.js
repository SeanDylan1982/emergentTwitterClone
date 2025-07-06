const { User, Tweet, Follow } = require('../models');
const { apiResponse, sanitizeUser } = require('../utils/helpers');
const { validatePagination } = require('../utils/validators');
const { getUserSuggestionsPipeline } = require('../utils/aggregations');

// Get user profile by username
const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ 
      username: username.toLowerCase() 
    }).select('-password -email');

    if (!user) {
      return res.status(404).json(
        apiResponse(false, null, 'User not found')
      );
    }

    // Check if current user follows this user
    let isFollowing = false;
    let followStatus = null;

    if (req.user) {
      const followRelation = await Follow.findOne({
        followerId: req.user._id,
        followeeId: user._id
      });

      if (followRelation) {
        isFollowing = followRelation.status === 'accepted';
        followStatus = followRelation.status;
      }
    }

    res.json(
      apiResponse(true, { 
        user,
        isFollowing,
        followStatus
      }, 'User profile retrieved successfully')
    );
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during profile retrieval')
    );
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const allowedUpdates = ['displayName', 'bio', 'location', 'website'];
    const updates = {};

    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -email');

    res.json(
      apiResponse(true, { user }, 'Profile updated successfully')
    );
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during profile update')
    );
  }
};

// Update user settings
const updateUserSettings = async (req, res) => {
  try {
    const { theme, language, notifications } = req.body;
    const updates = {};

    if (theme) updates['settings.theme'] = theme;
    if (language) updates['settings.language'] = language;
    if (notifications) {
      Object.keys(notifications).forEach(key => {
        if (typeof notifications[key] === 'boolean') {
          updates[`settings.notifications.${key}`] = notifications[key];
        }
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -email');

    res.json(
      apiResponse(true, { user }, 'Settings updated successfully')
    );
  } catch (error) {
    console.error('Update user settings error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during settings update')
    );
  }
};

// Get user followers
const getUserFollowers = async (req, res) => {
  try {
    const { username } = req.params;
    const { page, limit, skip } = validatePagination(req.query.page, req.query.limit);

    // Find user by username
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(404).json(
        apiResponse(false, null, 'User not found')
      );
    }

    const followers = await Follow.getFollowers(user._id, limit, skip);

    res.json(
      apiResponse(true, { 
        followers: followers.map(f => f.follower),
        pagination: { page, limit, hasMore: followers.length === limit }
      }, 'Followers retrieved successfully')
    );
  } catch (error) {
    console.error('Get user followers error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during followers retrieval')
    );
  }
};

// Get user following
const getUserFollowing = async (req, res) => {
  try {
    const { username } = req.params;
    const { page, limit, skip } = validatePagination(req.query.page, req.query.limit);

    // Find user by username
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(404).json(
        apiResponse(false, null, 'User not found')
      );
    }

    const following = await Follow.getFollowing(user._id, limit, skip);

    res.json(
      apiResponse(true, { 
        following: following.map(f => f.following),
        pagination: { page, limit, hasMore: following.length === limit }
      }, 'Following retrieved successfully')
    );
  } catch (error) {
    console.error('Get user following error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during following retrieval')
    );
  }
};

// Get user suggestions (who to follow)
const getUserSuggestions = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const suggestions = await User.aggregate(
      getUserSuggestionsPipeline(req.user._id, parseInt(limit))
    );

    res.json(
      apiResponse(true, { 
        suggestions: suggestions.map(s => s.user)
      }, 'User suggestions retrieved successfully')
    );
  } catch (error) {
    console.error('Get user suggestions error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during suggestions retrieval')
    );
  }
};

// Search users
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const { page, limit, skip } = validatePagination(req.query.page, req.query.limit);

    if (!q || q.trim().length === 0) {
      return res.status(400).json(
        apiResponse(false, null, 'Search query is required')
      );
    }

    const searchQuery = {
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { displayName: { $regex: q, $options: 'i' } }
      ],
      isActive: true,
      isSuspended: false
    };

    const users = await User.find(searchQuery)
      .select('-password -email -settings')
      .sort({ 'stats.followersCount': -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    res.json(
      apiResponse(true, { 
        users,
        pagination: { page, limit, hasMore: users.length === limit }
      }, 'Users retrieved successfully')
    );
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during user search')
    );
  }
};

// Get user stats
const getUserStats = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ 
      username: username.toLowerCase() 
    }).select('stats');

    if (!user) {
      return res.status(404).json(
        apiResponse(false, null, 'User not found')
      );
    }

    // Get additional stats
    const [tweetsThisMonth, likesThisMonth] = await Promise.all([
      Tweet.countDocuments({
        userId: user._id,
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      }),
      Tweet.aggregate([
        {
          $match: {
            userId: user._id,
            createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
          }
        },
        {
          $group: {
            _id: null,
            totalLikes: { $sum: '$stats.likesCount' }
          }
        }
      ])
    ]);

    const stats = {
      ...user.stats.toObject(),
      tweetsThisMonth,
      likesThisMonth: likesThisMonth[0]?.totalLikes || 0
    };

    res.json(
      apiResponse(true, { stats }, 'User stats retrieved successfully')
    );
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during stats retrieval')
    );
  }
};

// Deactivate account
const deactivateAccount = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      isActive: false,
      lastActive: new Date()
    });

    res.json(
      apiResponse(true, null, 'Account deactivated successfully')
    );
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during account deactivation')
    );
  }
};

// Reactivate account
const reactivateAccount = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json(
        apiResponse(false, null, 'Invalid credentials')
      );
    }

    user.isActive = true;
    user.lastActive = new Date();
    await user.save();

    res.json(
      apiResponse(true, null, 'Account reactivated successfully')
    );
  } catch (error) {
    console.error('Reactivate account error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during account reactivation')
    );
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  updateUserSettings,
  getUserFollowers,
  getUserFollowing,
  getUserSuggestions,
  searchUsers,
  getUserStats,
  deactivateAccount,
  reactivateAccount
};