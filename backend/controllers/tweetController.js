const { Tweet, Like, Retweet, Reply, User, Hashtag, Notification } = require('../models');
const { apiResponse, sanitizeUser } = require('../utils/helpers');
const { validatePagination } = require('../utils/validators');
const { getTimelinePipeline, getTweetDetailsPipeline } = require('../utils/aggregations');
const { extractHashtags, extractMentions } = require('../utils/validators');

// Create new tweet
const createTweet = async (req, res) => {
  try {
    const { content, visibility = 'public', allowReplies = 'everyone', media = [] } = req.body;

    // Extract hashtags and mentions
    const hashtags = extractHashtags(content);
    const mentionUsernames = extractMentions(content);

    // Get mentioned users
    const mentionedUsers = await User.find({
      username: { $in: mentionUsernames }
    }).select('_id username displayName');

    const mentions = mentionedUsers.map(user => ({
      userId: user._id,
      username: user.username,
      displayName: user.displayName
    }));

    // Create tweet
    const tweet = new Tweet({
      userId: req.user._id,
      content,
      visibility,
      allowReplies,
      media,
      hashtags,
      mentions
    });

    await tweet.save();

    // Update user tweet count
    await User.updateOne(
      { _id: req.user._id },
      { $inc: { 'stats.tweetsCount': 1 } }
    );

    // Update hashtag usage
    for (const hashtag of hashtags) {
      await Hashtag.incrementUsage(hashtag, req.user._id);
    }

    // Create mention notifications
    for (const mention of mentions) {
      await Notification.createMentionNotification(
        mention.userId,
        req.user._id,
        tweet._id
      );
    }

    // Populate user data
    await tweet.populate('userId', 'username displayName avatar verified');

    res.status(201).json(
      apiResponse(true, { tweet }, 'Tweet created successfully')
    );
  } catch (error) {
    console.error('Create tweet error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during tweet creation')
    );
  }
};

// Get user timeline
const getTimeline = async (req, res) => {
  try {
    const { page, limit, skip } = validatePagination(req.query.page, req.query.limit);

    const tweets = await Tweet.aggregate(
      getTimelinePipeline(req.user._id, limit, skip)
    );

    res.json(
      apiResponse(true, { 
        tweets, 
        pagination: { page, limit, hasMore: tweets.length === limit }
      }, 'Timeline retrieved successfully')
    );
  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during timeline retrieval')
    );
  }
};

// Get tweet by ID
const getTweetById = async (req, res) => {
  try {
    const { id } = req.params;

    const tweets = await Tweet.aggregate(
      getTweetDetailsPipeline(id, req.user?._id)
    );

    if (tweets.length === 0) {
      return res.status(404).json(
        apiResponse(false, null, 'Tweet not found')
      );
    }

    const tweet = tweets[0];

    // Increment view count
    await Tweet.updateOne(
      { _id: id },
      { $inc: { 'stats.viewsCount': 1 } }
    );

    res.json(
      apiResponse(true, { tweet }, 'Tweet retrieved successfully')
    );
  } catch (error) {
    console.error('Get tweet error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during tweet retrieval')
    );
  }
};

// Get user tweets
const getUserTweets = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page, limit, skip } = validatePagination(req.query.page, req.query.limit);

    const tweets = await Tweet.find({
      userId,
      isDeleted: false
    })
    .populate('userId', 'username displayName avatar verified')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

    res.json(
      apiResponse(true, { 
        tweets,
        pagination: { page, limit, hasMore: tweets.length === limit }
      }, 'User tweets retrieved successfully')
    );
  } catch (error) {
    console.error('Get user tweets error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during user tweets retrieval')
    );
  }
};

// Like/unlike tweet
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if tweet exists
    const tweet = await Tweet.findById(id);
    if (!tweet) {
      return res.status(404).json(
        apiResponse(false, null, 'Tweet not found')
      );
    }

    // Toggle like
    const result = await Like.toggleLike(req.user._id, id, tweet.userId);

    // Create notification if liked
    if (result.liked && !tweet.userId.equals(req.user._id)) {
      await Notification.createLikeNotification(
        tweet.userId,
        req.user._id,
        id
      );
    }

    res.json(
      apiResponse(true, result, `Tweet ${result.action} successfully`)
    );
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during like toggle')
    );
  }
};

// Retweet/unretweet
const toggleRetweet = async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'retweet', comment = '' } = req.body;

    // Check if tweet exists
    const tweet = await Tweet.findById(id);
    if (!tweet) {
      return res.status(404).json(
        apiResponse(false, null, 'Tweet not found')
      );
    }

    // Prevent retweeting own tweets
    if (tweet.userId.equals(req.user._id)) {
      return res.status(400).json(
        apiResponse(false, null, 'You cannot retweet your own tweets')
      );
    }

    // Toggle retweet
    const result = await Retweet.toggleRetweet(
      req.user._id,
      id,
      tweet.userId,
      type,
      comment
    );

    // Create notification if retweeted
    if (result.retweeted) {
      await Notification.createRetweetNotification(
        tweet.userId,
        req.user._id,
        id
      );
    }

    res.json(
      apiResponse(true, result, `Tweet ${result.action} successfully`)
    );
  } catch (error) {
    console.error('Toggle retweet error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during retweet toggle')
    );
  }
};

// Reply to tweet
const replyToTweet = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, media = [] } = req.body;

    // Check if parent tweet exists
    const parentTweet = await Tweet.findById(id);
    if (!parentTweet) {
      return res.status(404).json(
        apiResponse(false, null, 'Parent tweet not found')
      );
    }

    // Create reply
    const result = await Reply.createReply(req.user._id, content, id, media);

    // Create notification if replying to someone else's tweet
    if (!parentTweet.userId.equals(req.user._id)) {
      await Notification.createReplyNotification(
        parentTweet.userId,
        req.user._id,
        result.replyTweet._id
      );
    }

    res.status(201).json(
      apiResponse(true, result, 'Reply created successfully')
    );
  } catch (error) {
    console.error('Reply to tweet error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during reply creation')
    );
  }
};

// Get tweet replies
const getTweetReplies = async (req, res) => {
  try {
    const { id } = req.params;
    const { page, limit, skip } = validatePagination(req.query.page, req.query.limit);

    const replies = await Reply.getThread(id, limit, skip);

    res.json(
      apiResponse(true, { 
        replies,
        pagination: { page, limit, hasMore: replies.length === limit }
      }, 'Tweet replies retrieved successfully')
    );
  } catch (error) {
    console.error('Get tweet replies error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during replies retrieval')
    );
  }
};

// Delete tweet
const deleteTweet = async (req, res) => {
  try {
    const { id } = req.params;

    // Find tweet and check ownership
    const tweet = await Tweet.findById(id);
    if (!tweet) {
      return res.status(404).json(
        apiResponse(false, null, 'Tweet not found')
      );
    }

    if (!tweet.userId.equals(req.user._id)) {
      return res.status(403).json(
        apiResponse(false, null, 'You can only delete your own tweets')
      );
    }

    // Soft delete
    tweet.isDeleted = true;
    await tweet.save();

    // Update user tweet count
    await User.updateOne(
      { _id: req.user._id },
      { $inc: { 'stats.tweetsCount': -1 } }
    );

    res.json(
      apiResponse(true, null, 'Tweet deleted successfully')
    );
  } catch (error) {
    console.error('Delete tweet error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during tweet deletion')
    );
  }
};

// Get liked tweets
const getLikedTweets = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page, limit, skip } = validatePagination(req.query.page, req.query.limit);

    const likedTweets = await Like.find({ userId })
      .populate({
        path: 'tweetId',
        populate: {
          path: 'userId',
          select: 'username displayName avatar verified'
        }
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const tweets = likedTweets
      .filter(like => like.tweetId && !like.tweetId.isDeleted)
      .map(like => like.tweetId);

    res.json(
      apiResponse(true, { 
        tweets,
        pagination: { page, limit, hasMore: tweets.length === limit }
      }, 'Liked tweets retrieved successfully')
    );
  } catch (error) {
    console.error('Get liked tweets error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during liked tweets retrieval')
    );
  }
};

module.exports = {
  createTweet,
  getTimeline,
  getTweetById,
  getUserTweets,
  toggleLike,
  toggleRetweet,
  replyToTweet,
  getTweetReplies,
  deleteTweet,
  getLikedTweets
};