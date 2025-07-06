const { Tweet, User, Hashtag } = require('../models');
const { apiResponse } = require('../utils/helpers');
const { validatePagination, escapeRegex } = require('../utils/validators');

// General search
const search = async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;
    const { page, limit, skip } = validatePagination(req.query.page, req.query.limit);

    if (!q || q.trim().length === 0) {
      return res.status(400).json(
        apiResponse(false, null, 'Search query is required')
      );
    }

    const searchQuery = escapeRegex(q.trim());
    const results = {};

    // Search tweets
    if (type === 'all' || type === 'tweets') {
      const tweets = await Tweet.find({
        $or: [
          { content: { $regex: searchQuery, $options: 'i' } },
          { hashtags: { $regex: searchQuery, $options: 'i' } }
        ],
        isDeleted: false,
        visibility: 'public'
      })
      .populate('userId', 'username displayName avatar verified')
      .sort({ 'stats.likesCount': -1, createdAt: -1 })
      .limit(type === 'tweets' ? limit : 5)
      .skip(type === 'tweets' ? skip : 0)
      .lean();

      results.tweets = tweets;
    }

    // Search users
    if (type === 'all' || type === 'users') {
      const users = await User.find({
        $or: [
          { username: { $regex: searchQuery, $options: 'i' } },
          { displayName: { $regex: searchQuery, $options: 'i' } }
        ],
        isActive: true,
        isSuspended: false
      })
      .select('-password -email -settings')
      .sort({ 'stats.followersCount': -1 })
      .limit(type === 'users' ? limit : 5)
      .skip(type === 'users' ? skip : 0)
      .lean();

      results.users = users;
    }

    // Search hashtags
    if (type === 'all' || type === 'hashtags') {
      const hashtags = await Hashtag.find({
        hashtag: { $regex: searchQuery, $options: 'i' },
        isBlocked: false
      })
      .sort({ 'stats.totalUsage': -1 })
      .limit(type === 'hashtags' ? limit : 5)
      .skip(type === 'hashtags' ? skip : 0)
      .lean();

      results.hashtags = hashtags;
    }

    const pagination = type !== 'all' ? { page, limit, hasMore: results[type]?.length === limit } : null;

    res.json(
      apiResponse(true, { 
        results,
        query: q,
        type,
        ...(pagination && { pagination })
      }, 'Search completed successfully')
    );
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during search')
    );
  }
};

// Search tweets
const searchTweets = async (req, res) => {
  try {
    const { q, filter = 'top' } = req.query;
    const { page, limit, skip } = validatePagination(req.query.page, req.query.limit);

    if (!q || q.trim().length === 0) {
      return res.status(400).json(
        apiResponse(false, null, 'Search query is required')
      );
    }

    const searchQuery = escapeRegex(q.trim());
    
    // Build search criteria
    const searchCriteria = {
      $or: [
        { content: { $regex: searchQuery, $options: 'i' } },
        { hashtags: { $regex: searchQuery, $options: 'i' } }
      ],
      isDeleted: false,
      visibility: 'public'
    };

    // Apply filters
    let sortCriteria = {};
    switch (filter) {
      case 'latest':
        sortCriteria = { createdAt: -1 };
        break;
      case 'top':
        sortCriteria = { 'stats.likesCount': -1, 'stats.retweetsCount': -1, createdAt: -1 };
        break;
      case 'media':
        searchCriteria.media = { $exists: true, $ne: [] };
        sortCriteria = { createdAt: -1 };
        break;
      default:
        sortCriteria = { createdAt: -1 };
    }

    const tweets = await Tweet.find(searchCriteria)
      .populate('userId', 'username displayName avatar verified')
      .sort(sortCriteria)
      .limit(limit)
      .skip(skip)
      .lean();

    res.json(
      apiResponse(true, { 
        tweets,
        query: q,
        filter,
        pagination: { page, limit, hasMore: tweets.length === limit }
      }, 'Tweet search completed successfully')
    );
  } catch (error) {
    console.error('Search tweets error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during tweet search')
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

    const searchQuery = escapeRegex(q.trim());

    const users = await User.find({
      $or: [
        { username: { $regex: searchQuery, $options: 'i' } },
        { displayName: { $regex: searchQuery, $options: 'i' } },
        { bio: { $regex: searchQuery, $options: 'i' } }
      ],
      isActive: true,
      isSuspended: false
    })
    .select('-password -email -settings')
    .sort({ 'stats.followersCount': -1, verified: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

    res.json(
      apiResponse(true, { 
        users,
        query: q,
        pagination: { page, limit, hasMore: users.length === limit }
      }, 'User search completed successfully')
    );
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during user search')
    );
  }
};

// Search hashtags
const searchHashtags = async (req, res) => {
  try {
    const { q } = req.query;
    const { page, limit, skip } = validatePagination(req.query.page, req.query.limit);

    if (!q || q.trim().length === 0) {
      return res.status(400).json(
        apiResponse(false, null, 'Search query is required')
      );
    }

    const searchQuery = escapeRegex(q.trim());

    const hashtags = await Hashtag.find({
      hashtag: { $regex: searchQuery, $options: 'i' },
      isBlocked: false
    })
    .sort({ 'stats.totalUsage': -1, 'recentActivity.today': -1 })
    .limit(limit)
    .skip(skip)
    .lean();

    res.json(
      apiResponse(true, { 
        hashtags,
        query: q,
        pagination: { page, limit, hasMore: hashtags.length === limit }
      }, 'Hashtag search completed successfully')
    );
  } catch (error) {
    console.error('Search hashtags error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during hashtag search')
    );
  }
};

// Get autocomplete suggestions
const getAutocompleteSuggestions = async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json(
        apiResponse(true, { suggestions: [] }, 'Query too short for suggestions')
      );
    }

    const searchQuery = escapeRegex(q.trim());
    const suggestions = {};

    // User suggestions
    if (type === 'all' || type === 'users') {
      const users = await User.find({
        $or: [
          { username: { $regex: `^${searchQuery}`, $options: 'i' } },
          { displayName: { $regex: searchQuery, $options: 'i' } }
        ],
        isActive: true,
        isSuspended: false
      })
      .select('username displayName avatar verified stats.followersCount')
      .sort({ 'stats.followersCount': -1 })
      .limit(5)
      .lean();

      suggestions.users = users;
    }

    // Hashtag suggestions
    if (type === 'all' || type === 'hashtags') {
      const hashtags = await Hashtag.find({
        hashtag: { $regex: `^${searchQuery}`, $options: 'i' },
        isBlocked: false
      })
      .select('hashtag stats.totalUsage')
      .sort({ 'stats.totalUsage': -1 })
      .limit(5)
      .lean();

      suggestions.hashtags = hashtags;
    }

    res.json(
      apiResponse(true, { 
        suggestions,
        query: q
      }, 'Autocomplete suggestions retrieved successfully')
    );
  } catch (error) {
    console.error('Get autocomplete suggestions error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during suggestions retrieval')
    );
  }
};

// Get search history (placeholder for future implementation)
const getSearchHistory = async (req, res) => {
  try {
    // This would typically be stored in a separate collection
    // For now, return empty array
    res.json(
      apiResponse(true, { history: [] }, 'Search history retrieved successfully')
    );
  } catch (error) {
    console.error('Get search history error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during search history retrieval')
    );
  }
};

// Save search query (placeholder for future implementation)
const saveSearchQuery = async (req, res) => {
  try {
    const { query } = req.body;

    // This would typically save to a search history collection
    // For now, just return success
    res.json(
      apiResponse(true, null, 'Search query saved successfully')
    );
  } catch (error) {
    console.error('Save search query error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during search query saving')
    );
  }
};

// Clear search history (placeholder for future implementation)
const clearSearchHistory = async (req, res) => {
  try {
    // This would typically clear user's search history
    // For now, just return success
    res.json(
      apiResponse(true, null, 'Search history cleared successfully')
    );
  } catch (error) {
    console.error('Clear search history error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during search history clearing')
    );
  }
};

module.exports = {
  search,
  searchTweets,
  searchUsers,
  searchHashtags,
  getAutocompleteSuggestions,
  getSearchHistory,
  saveSearchQuery,
  clearSearchHistory
};