const mongoose = require('mongoose');

/**
 * Aggregation pipelines for complex queries
 */

// Get user timeline with full tweet data
const getTimelinePipeline = (userId, limit = 20, skip = 0) => [
  // Match tweets from followed users or own tweets
  {
    $lookup: {
      from: 'follows',
      let: { tweetUserId: '$userId' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$followeeId', '$$tweetUserId'] },
                { $eq: ['$followerId', mongoose.Types.ObjectId(userId)] },
                { $eq: ['$status', 'accepted'] }
              ]
            }
          }
        }
      ],
      as: 'followInfo'
    }
  },
  {
    $match: {
      $or: [
        { userId: mongoose.Types.ObjectId(userId) }, // Own tweets
        { followInfo: { $ne: [] } }, // Followed users' tweets
      ],
      isDeleted: false
    }
  },
  // Add user details
  {
    $lookup: {
      from: 'users',
      localField: 'userId',
      foreignField: '_id',
      as: 'user'
    }
  },
  {
    $unwind: '$user'
  },
  // Add current user's engagement status
  {
    $lookup: {
      from: 'likes',
      let: { tweetId: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$tweetId', '$$tweetId'] },
                { $eq: ['$userId', mongoose.Types.ObjectId(userId)] }
              ]
            }
          }
        }
      ],
      as: 'userLike'
    }
  },
  {
    $lookup: {
      from: 'retweets',
      let: { tweetId: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$tweetId', '$$tweetId'] },
                { $eq: ['$userId', mongoose.Types.ObjectId(userId)] }
              ]
            }
          }
        }
      ],
      as: 'userRetweet'
    }
  },
  // Add fields for user engagement
  {
    $addFields: {
      isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] },
      isRetweetedByUser: { $gt: [{ $size: '$userRetweet' }, 0] }
    }
  },
  // Remove sensitive user data
  {
    $project: {
      'user.password': 0,
      'user.email': 0,
      'user.settings': 0,
      userLike: 0,
      userRetweet: 0,
      followInfo: 0
    }
  },
  {
    $sort: { createdAt: -1 }
  },
  {
    $skip: skip
  },
  {
    $limit: limit
  }
];

// Get tweet with full engagement data
const getTweetDetailsPipeline = (tweetId, userId = null) => [
  {
    $match: { _id: mongoose.Types.ObjectId(tweetId) }
  },
  // Add user details
  {
    $lookup: {
      from: 'users',
      localField: 'userId',
      foreignField: '_id',
      as: 'user'
    }
  },
  {
    $unwind: '$user'
  },
  // Add recent likes
  {
    $lookup: {
      from: 'likes',
      let: { tweetId: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ['$tweetId', '$$tweetId'] }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $sort: { createdAt: -1 }
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
      ],
      as: 'recentLikes'
    }
  },
  // Add replies
  {
    $lookup: {
      from: 'replies',
      let: { tweetId: '$_id' },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ['$parentTweetId', '$$tweetId'] }
          }
        },
        {
          $lookup: {
            from: 'tweets',
            localField: 'tweetId',
            foreignField: '_id',
            as: 'replyTweet'
          }
        },
        {
          $unwind: '$replyTweet'
        },
        {
          $lookup: {
            from: 'users',
            localField: 'replyTweet.userId',
            foreignField: '_id',
            as: 'replyTweet.user'
          }
        },
        {
          $unwind: '$replyTweet.user'
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $limit: 5
        },
        {
          $project: {
            'replyTweet.user.password': 0,
            'replyTweet.user.email': 0,
            'replyTweet.user.settings': 0
          }
        }
      ],
      as: 'recentReplies'
    }
  },
  // Add user engagement if userId provided
  ...(userId ? [
    {
      $lookup: {
        from: 'likes',
        let: { tweetId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$tweetId', '$$tweetId'] },
                  { $eq: ['$userId', mongoose.Types.ObjectId(userId)] }
                ]
              }
            }
          }
        ],
        as: 'userLike'
      }
    },
    {
      $addFields: {
        isLikedByUser: { $gt: [{ $size: '$userLike' }, 0] }
      }
    }
  ] : []),
  {
    $project: {
      'user.password': 0,
      'user.email': 0,
      'user.settings': 0,
      ...(userId ? { userLike: 0 } : {})
    }
  }
];

// Get trending hashtags
const getTrendingHashtagsPipeline = (timeframe = 24, limit = 10) => {
  const hoursAgo = new Date(Date.now() - timeframe * 60 * 60 * 1000);
  
  return [
    {
      $match: {
        createdAt: { $gte: hoursAgo },
        hashtags: { $exists: true, $ne: [] }
      }
    },
    {
      $unwind: '$hashtags'
    },
    {
      $group: {
        _id: '$hashtags',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        sampleTweets: {
          $push: {
            tweetId: '$_id',
            userId: '$userId',
            content: '$content',
            stats: '$stats',
            createdAt: '$createdAt'
          }
        }
      }
    },
    {
      $addFields: {
        uniqueUsersCount: { $size: '$uniqueUsers' },
        trendingScore: {
          $multiply: [
            '$count',
            { $size: '$uniqueUsers' },
            { $divide: [timeframe, 24] } // Time weight
          ]
        }
      }
    },
    {
      $match: {
        count: { $gte: 3 } // Minimum threshold
      }
    },
    {
      $sort: { trendingScore: -1 }
    },
    {
      $limit: limit
    },
    {
      $project: {
        hashtag: '$_id',
        count: 1,
        uniqueUsersCount: 1,
        trendingScore: 1,
        sampleTweets: {
          $slice: [
            {
              $sortArray: {
                input: '$sampleTweets',
                sortBy: { 'stats.likesCount': -1, 'stats.retweetsCount': -1 }
              }
            },
            3
          ]
        }
      }
    }
  ];
};

// Get user suggestions (who to follow)
const getUserSuggestionsPipeline = (userId, limit = 5) => [
  // Get users followed by people you follow
  {
    $lookup: {
      from: 'follows',
      let: { userId: mongoose.Types.ObjectId(userId) },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$followerId', '$$userId'] },
                { $eq: ['$status', 'accepted'] }
              ]
            }
          }
        }
      ],
      as: 'userFollows'
    }
  },
  {
    $unwind: '$userFollows'
  },
  {
    $lookup: {
      from: 'follows',
      let: { followeeId: '$userFollows.followeeId' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$followerId', '$$followeeId'] },
                { $eq: ['$status', 'accepted'] },
                { $ne: ['$followeeId', mongoose.Types.ObjectId(userId)] }
              ]
            }
          }
        }
      ],
      as: 'suggestedFollows'
    }
  },
  {
    $unwind: '$suggestedFollows'
  },
  // Check if already following
  {
    $lookup: {
      from: 'follows',
      let: { suggestedUserId: '$suggestedFollows.followeeId' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$followerId', mongoose.Types.ObjectId(userId)] },
                { $eq: ['$followeeId', '$$suggestedUserId'] }
              ]
            }
          }
        }
      ],
      as: 'alreadyFollowing'
    }
  },
  {
    $match: {
      alreadyFollowing: { $size: 0 }
    }
  },
  // Group by suggested user
  {
    $group: {
      _id: '$suggestedFollows.followeeId',
      mutualFollows: { $sum: 1 }
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
  {
    $match: {
      'user.isActive': true,
      'user.isSuspended': false
    }
  },
  {
    $sort: {
      mutualFollows: -1,
      'user.stats.followersCount': -1
    }
  },
  {
    $limit: limit
  },
  {
    $project: {
      'user.password': 0,
      'user.email': 0,
      'user.settings': 0
    }
  }
];

// Get notification aggregation
const getNotificationsPipeline = (userId, limit = 20, skip = 0) => [
  {
    $match: {
      userId: mongoose.Types.ObjectId(userId)
    }
  },
  {
    $lookup: {
      from: 'users',
      localField: 'fromUserId',
      foreignField: '_id',
      as: 'fromUser'
    }
  },
  {
    $unwind: '$fromUser'
  },
  // Add related tweet details if applicable
  {
    $lookup: {
      from: 'tweets',
      localField: 'relatedTweetId',
      foreignField: '_id',
      as: 'relatedTweet'
    }
  },
  {
    $sort: { createdAt: -1 }
  },
  {
    $skip: skip
  },
  {
    $limit: limit
  },
  {
    $project: {
      'fromUser.password': 0,
      'fromUser.email': 0,
      'fromUser.settings': 0
    }
  }
];

module.exports = {
  getTimelinePipeline,
  getTweetDetailsPipeline,
  getTrendingHashtagsPipeline,
  getUserSuggestionsPipeline,
  getNotificationsPipeline
};