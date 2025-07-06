const { TrendingTopic, Hashtag, Tweet } = require('../models');
const { apiResponse } = require('../utils/helpers');
const { getTrendingHashtagsPipeline } = require('../utils/aggregations');

// Get trending topics
const getTrendingTopics = async (req, res) => {
  try {
    const { location = 'global', category, limit = 10 } = req.query;

    const trends = await TrendingTopic.getTrending(
      location,
      category,
      parseInt(limit)
    );

    res.json(
      apiResponse(true, { 
        trends,
        location,
        category,
        updatedAt: new Date().toISOString()
      }, 'Trending topics retrieved successfully')
    );
  } catch (error) {
    console.error('Get trending topics error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during trending topics retrieval')
    );
  }
};

// Get trending hashtags (real-time calculation)
const getTrendingHashtags = async (req, res) => {
  try {
    const { timeframe = 24, limit = 10 } = req.query;

    const trendingHashtags = await Tweet.aggregate(
      getTrendingHashtagsPipeline(parseInt(timeframe), parseInt(limit))
    );

    res.json(
      apiResponse(true, { 
        hashtags: trendingHashtags,
        timeframe: `${timeframe} hours`,
        generatedAt: new Date().toISOString()
      }, 'Trending hashtags calculated successfully')
    );
  } catch (error) {
    console.error('Get trending hashtags error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during trending hashtags calculation')
    );
  }
};

// Get hashtag details
const getHashtagDetails = async (req, res) => {
  try {
    const { hashtag } = req.params;
    const { location = 'global' } = req.query;

    // Get hashtag details from trending topics
    const trendingTopic = await TrendingTopic.getHashtagDetails(hashtag, location);
    
    // Also get from hashtags collection for comprehensive data
    const hashtagData = await Hashtag.findOne({ 
      hashtag: hashtag.toLowerCase() 
    });

    if (!trendingTopic && !hashtagData) {
      return res.status(404).json(
        apiResponse(false, null, 'Hashtag not found')
      );
    }

    // Get recent tweets with this hashtag
    const recentTweets = await Tweet.find({
      hashtags: hashtag.toLowerCase(),
      isDeleted: false,
      visibility: 'public'
    })
    .populate('userId', 'username displayName avatar verified')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

    const result = {
      hashtag: hashtag.toLowerCase(),
      trending: trendingTopic,
      stats: hashtagData?.stats,
      recentActivity: hashtagData?.recentActivity,
      recentTweets,
      relatedHashtags: hashtagData?.getRelated ? hashtagData.getRelated() : []
    };

    res.json(
      apiResponse(true, result, 'Hashtag details retrieved successfully')
    );
  } catch (error) {
    console.error('Get hashtag details error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during hashtag details retrieval')
    );
  }
};

// Get trending by category
const getTrendingByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { location = 'global', limit = 10 } = req.query;

    const validCategories = ['technology', 'sports', 'entertainment', 'politics', 'general', 'news', 'business'];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json(
        apiResponse(false, null, 'Invalid category')
      );
    }

    const trends = await TrendingTopic.getTrending(
      location,
      category,
      parseInt(limit)
    );

    res.json(
      apiResponse(true, { 
        trends,
        category,
        location
      }, `Trending ${category} topics retrieved successfully`)
    );
  } catch (error) {
    console.error('Get trending by category error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during category trending retrieval')
    );
  }
};

// Update trending topics (admin/cron job endpoint)
const updateTrendingTopics = async (req, res) => {
  try {
    // This would typically be called by a cron job or admin
    await TrendingTopic.updateTrendingTopics();

    res.json(
      apiResponse(true, null, 'Trending topics updated successfully')
    );
  } catch (error) {
    console.error('Update trending topics error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during trending topics update')
    );
  }
};

// Get trending users (users gaining followers rapidly)
const getTrendingUsers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // This is a simplified approach - in production you'd track follower growth
    const trendingUsers = await Tweet.aggregate([
      // Get recent tweets (last 24 hours)
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          isDeleted: false,
          visibility: 'public'
        }
      },
      // Group by user and calculate engagement
      {
        $group: {
          _id: '$userId',
          totalEngagement: {
            $sum: {
              $add: ['$stats.likesCount', '$stats.retweetsCount', '$stats.repliesCount']
            }
          },
          tweetCount: { $sum: 1 }
        }
      },
      // Calculate engagement rate
      {
        $addFields: {
          engagementRate: { $divide: ['$totalEngagement', '$tweetCount'] }
        }
      },
      // Get user details
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      // Filter active users
      {
        $match: {
          'user.isActive': true,
          'user.isSuspended': false
        }
      },
      // Sort by engagement rate
      {
        $sort: { engagementRate: -1 }
      },
      {
        $limit: parseInt(limit)
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
        users: trendingUsers.map(item => ({
          ...item.user,
          engagementMetrics: {
            totalEngagement: item.totalEngagement,
            engagementRate: item.engagementRate,
            recentTweets: item.tweetCount
          }
        }))
      }, 'Trending users retrieved successfully')
    );
  } catch (error) {
    console.error('Get trending users error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during trending users retrieval')
    );
  }
};

// Get trending locations
const getTrendingLocations = async (req, res) => {
  try {
    // Get all available trending locations
    const locations = await TrendingTopic.distinct('location');
    
    // Filter out empty locations and sort
    const validLocations = locations
      .filter(loc => loc && loc.trim().length > 0)
      .sort();

    res.json(
      apiResponse(true, { 
        locations: validLocations 
      }, 'Trending locations retrieved successfully')
    );
  } catch (error) {
    console.error('Get trending locations error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during trending locations retrieval')
    );
  }
};

// Get personalized trends (based on user's interests/follows)
const getPersonalizedTrends = async (req, res) => {
  try {
    // This is a simplified version - in production you'd analyze user behavior
    const { Follow } = require('../models');
    
    // Get hashtags from tweets by users the current user follows
    const followedUsersHashtags = await Follow.aggregate([
      {
        $match: {
          followerId: req.user._id,
          status: 'accepted'
        }
      },
      {
        $lookup: {
          from: 'tweets',
          let: { followeeId: '$followeeId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', '$$followeeId'] },
                    { $gte: ['$createdAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] }
                  ]
                }
              }
            },
            {
              $unwind: '$hashtags'
            }
          ],
          as: 'tweets'
        }
      },
      {
        $unwind: '$tweets'
      },
      {
        $group: {
          _id: '$tweets.hashtags',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get trending data for these hashtags
    const personalizedTrends = await TrendingTopic.find({
      hashtag: { $in: followedUsersHashtags.map(h => h._id) }
    })
    .sort({ trendingScore: -1 })
    .limit(10)
    .lean();

    res.json(
      apiResponse(true, { 
        trends: personalizedTrends,
        basedOn: 'Following activity'
      }, 'Personalized trends retrieved successfully')
    );
  } catch (error) {
    console.error('Get personalized trends error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during personalized trends retrieval')
    );
  }
};

module.exports = {
  getTrendingTopics,
  getTrendingHashtags,
  getHashtagDetails,
  getTrendingByCategory,
  updateTrendingTopics,
  getTrendingUsers,
  getTrendingLocations,
  getPersonalizedTrends
};