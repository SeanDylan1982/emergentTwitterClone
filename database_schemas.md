# Twitter/X Clone - Database Schema Design

## Overview
This document outlines the complete MongoDB database schema for the Twitter/X clone application, including all collections, relationships, and indexing strategies.

## Collections Overview

1. **users** - User profiles and authentication
2. **tweets** - Tweet/post content and metadata
3. **likes** - Like relationships between users and tweets
4. **retweets** - Retweet relationships and data
5. **replies** - Reply relationships and threading
6. **follows** - User following relationships
7. **messages** - Direct messages between users
8. **conversations** - Message conversation threads
9. **notifications** - User notifications
10. **trending_topics** - Trending hashtags and topics
11. **media** - Image/video uploads and metadata
12. **hashtags** - Hashtag tracking and analytics

---

## 1. Users Collection

```javascript
// Collection: users
{
  _id: ObjectId("..."),
  username: String, // unique, required, indexed
  email: String, // unique, required, indexed
  password: String, // hashed, required
  displayName: String, // required
  bio: String, // optional, max 160 chars
  location: String, // optional
  website: String, // optional
  avatar: {
    url: String, // profile image URL
    mediaId: ObjectId, // reference to media collection
    default: Boolean // true if using default avatar
  },
  banner: {
    url: String, // banner image URL
    mediaId: ObjectId, // reference to media collection
  },
  verified: Boolean, // default false
  isPrivate: Boolean, // default false
  stats: {
    tweetsCount: Number, // default 0
    followersCount: Number, // default 0
    followingCount: Number, // default 0
    likesCount: Number, // total likes received
  },
  settings: {
    theme: String, // "dark" | "light", default "dark"
    language: String, // default "en"
    notifications: {
      email: Boolean, // default true
      push: Boolean, // default true
      likes: Boolean, // default true
      retweets: Boolean, // default true
      replies: Boolean, // default true
      follows: Boolean, // default true
      messages: Boolean, // default true
    }
  },
  joinDate: Date, // default Date.now
  lastActive: Date, // updated on activity
  isActive: Boolean, // default true
  isSuspended: Boolean, // default false
  createdAt: Date, // default Date.now
  updatedAt: Date, // auto-updated
}

// Indexes
db.users.createIndex({ username: 1 }, { unique: true })
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ displayName: "text" })
db.users.createIndex({ "stats.followersCount": -1 })
db.users.createIndex({ createdAt: -1 })
```

---

## 2. Tweets Collection

```javascript
// Collection: tweets
{
  _id: ObjectId("..."),
  userId: ObjectId, // reference to users collection, indexed
  content: String, // required, max 280 chars
  type: String, // "tweet" | "retweet" | "quote", default "tweet"
  
  // Media attachments
  media: [
    {
      type: String, // "image" | "video" | "gif"
      url: String,
      mediaId: ObjectId, // reference to media collection
      alt: String, // alt text for accessibility
      dimensions: {
        width: Number,
        height: Number
      }
    }
  ],
  
  // Hashtags and mentions
  hashtags: [String], // extracted hashtags, indexed
  mentions: [
    {
      userId: ObjectId, // reference to users collection
      username: String,
      displayName: String
    }
  ],
  
  // URLs in the tweet
  urls: [
    {
      url: String, // original URL
      expandedUrl: String, // expanded URL
      displayUrl: String, // display URL
      title: String, // page title
      description: String, // page description
    }
  ],
  
  // Engagement stats
  stats: {
    likesCount: Number, // default 0
    retweetsCount: Number, // default 0
    repliesCount: Number, // default 0
    quotesCount: Number, // default 0
    viewsCount: Number, // default 0
    bookmarksCount: Number, // default 0
  },
  
  // Reply information
  replyTo: {
    tweetId: ObjectId, // if this is a reply
    userId: ObjectId, // original tweet author
    username: String
  },
  
  // Retweet information
  originalTweet: {
    tweetId: ObjectId, // if this is a retweet
    userId: ObjectId, // original author
    username: String,
    content: String, // cached content
    createdAt: Date
  },
  
  // Quote tweet information
  quotedTweet: {
    tweetId: ObjectId, // if this is a quote tweet
    userId: ObjectId, // quoted tweet author
    username: String,
    content: String, // cached content
    createdAt: Date
  },
  
  // Visibility and interaction settings
  visibility: String, // "public" | "followers" | "mentioned", default "public"
  allowReplies: String, // "everyone" | "followers" | "mentioned", default "everyone"
  
  // Metadata
  isEdited: Boolean, // default false
  editHistory: [
    {
      content: String,
      editedAt: Date
    }
  ],
  
  // Geolocation (optional)
  location: {
    coordinates: [Number], // [longitude, latitude]
    name: String, // place name
    countryCode: String
  },
  
  // Moderation
  isDeleted: Boolean, // default false
  isSensitive: Boolean, // default false
  flaggedContent: Boolean, // default false
  
  createdAt: Date, // default Date.now, indexed
  updatedAt: Date, // auto-updated
}

// Indexes
db.tweets.createIndex({ userId: 1, createdAt: -1 })
db.tweets.createIndex({ createdAt: -1 })
db.tweets.createIndex({ hashtags: 1 })
db.tweets.createIndex({ "mentions.userId": 1 })
db.tweets.createIndex({ "replyTo.tweetId": 1 })
db.tweets.createIndex({ "stats.likesCount": -1 })
db.tweets.createIndex({ "stats.retweetsCount": -1 })
db.tweets.createIndex({ content: "text" })
```

---

## 3. Likes Collection

```javascript
// Collection: likes
{
  _id: ObjectId("..."),
  userId: ObjectId, // user who liked, indexed
  tweetId: ObjectId, // tweet that was liked, indexed
  tweetAuthorId: ObjectId, // author of the liked tweet
  createdAt: Date, // default Date.now
}

// Indexes
db.likes.createIndex({ userId: 1, tweetId: 1 }, { unique: true })
db.likes.createIndex({ tweetId: 1, createdAt: -1 })
db.likes.createIndex({ userId: 1, createdAt: -1 })
db.likes.createIndex({ tweetAuthorId: 1, createdAt: -1 })
```

---

## 4. Retweets Collection

```javascript
// Collection: retweets
{
  _id: ObjectId("..."),
  userId: ObjectId, // user who retweeted, indexed
  tweetId: ObjectId, // original tweet, indexed
  originalUserId: ObjectId, // original tweet author
  type: String, // "retweet" | "quote", default "retweet"
  comment: String, // for quote tweets, max 280 chars
  
  // Quote tweet specific fields
  quoteTweetId: ObjectId, // reference to the new tweet created for quote
  
  createdAt: Date, // default Date.now
}

// Indexes
db.retweets.createIndex({ userId: 1, tweetId: 1 }, { unique: true })
db.retweets.createIndex({ tweetId: 1, createdAt: -1 })
db.retweets.createIndex({ userId: 1, createdAt: -1 })
db.retweets.createIndex({ originalUserId: 1, createdAt: -1 })
```

---

## 5. Replies Collection

```javascript
// Collection: replies
{
  _id: ObjectId("..."),
  userId: ObjectId, // user who replied, indexed
  tweetId: ObjectId, // reply tweet ID, indexed
  parentTweetId: ObjectId, // original tweet being replied to, indexed
  parentUserId: ObjectId, // original tweet author
  
  // Threading information
  threadId: ObjectId, // root tweet of the thread
  level: Number, // depth of reply (0 = direct reply, 1 = reply to reply, etc.)
  
  createdAt: Date, // default Date.now
}

// Indexes
db.replies.createIndex({ parentTweetId: 1, createdAt: -1 })
db.replies.createIndex({ userId: 1, createdAt: -1 })
db.replies.createIndex({ threadId: 1, level: 1, createdAt: -1 })
db.replies.createIndex({ tweetId: 1 }, { unique: true })
```

---

## 6. Follows Collection

```javascript
// Collection: follows
{
  _id: ObjectId("..."),
  followerId: ObjectId, // user who is following, indexed
  followeeId: ObjectId, // user being followed, indexed
  status: String, // "pending" | "accepted", default "accepted"
  createdAt: Date, // default Date.now
}

// Indexes
db.follows.createIndex({ followerId: 1, followeeId: 1 }, { unique: true })
db.follows.createIndex({ followeeId: 1, createdAt: -1 })
db.follows.createIndex({ followerId: 1, createdAt: -1 })
db.follows.createIndex({ status: 1 })
```

---

## 7. Messages Collection

```javascript
// Collection: messages
{
  _id: ObjectId("..."),
  conversationId: ObjectId, // reference to conversations collection, indexed
  senderId: ObjectId, // user who sent the message, indexed
  recipientId: ObjectId, // user who received the message, indexed
  content: String, // message content, max 1000 chars
  type: String, // "text" | "media" | "tweet_share", default "text"
  
  // Media attachment (for images/videos)
  media: {
    type: String, // "image" | "video" | "gif"
    url: String,
    mediaId: ObjectId, // reference to media collection
    alt: String
  },
  
  // Shared tweet (for tweet shares)
  sharedTweet: {
    tweetId: ObjectId,
    userId: ObjectId,
    username: String,
    content: String, // cached content
    createdAt: Date
  },
  
  // Message status
  isRead: Boolean, // default false
  isDelivered: Boolean, // default false
  isDeleted: Boolean, // default false
  deletedBy: [ObjectId], // users who deleted this message
  
  createdAt: Date, // default Date.now, indexed
  readAt: Date, // when message was read
}

// Indexes
db.messages.createIndex({ conversationId: 1, createdAt: -1 })
db.messages.createIndex({ senderId: 1, createdAt: -1 })
db.messages.createIndex({ recipientId: 1, isRead: 1, createdAt: -1 })
```

---

## 8. Conversations Collection

```javascript
// Collection: conversations
{
  _id: ObjectId("..."),
  participants: [ObjectId], // array of user IDs, indexed
  type: String, // "direct" | "group", default "direct"
  
  // Last message info for quick display
  lastMessage: {
    messageId: ObjectId,
    senderId: ObjectId,
    content: String, // truncated content
    type: String,
    createdAt: Date
  },
  
  // Conversation metadata
  title: String, // for group conversations
  description: String, // for group conversations
  avatar: String, // for group conversations
  
  // Settings
  isArchived: Boolean, // default false
  isMuted: Boolean, // default false
  mutedBy: [ObjectId], // users who muted this conversation
  
  // Unread counts per participant
  unreadCounts: {
    type: Map,
    of: Number, // userId -> unread count
    default: {}
  },
  
  createdAt: Date, // default Date.now
  updatedAt: Date, // updated when new message is added
}

// Indexes
db.conversations.createIndex({ participants: 1 })
db.conversations.createIndex({ "participants": 1, "updatedAt": -1 })
db.conversations.createIndex({ "lastMessage.createdAt": -1 })
```

---

## 9. Notifications Collection

```javascript
// Collection: notifications
{
  _id: ObjectId("..."),
  userId: ObjectId, // recipient of notification, indexed
  type: String, // "like" | "retweet" | "reply" | "follow" | "mention" | "message"
  
  // Notification details
  title: String, // notification title
  message: String, // notification message
  
  // Related entities
  fromUserId: ObjectId, // user who triggered the notification
  fromUsername: String, // cached username
  fromDisplayName: String, // cached display name
  fromAvatar: String, // cached avatar URL
  
  relatedTweetId: ObjectId, // if related to a tweet
  relatedMessageId: ObjectId, // if related to a message
  relatedConversationId: ObjectId, // if related to a conversation
  
  // Notification status
  isRead: Boolean, // default false
  isDelivered: Boolean, // default false
  
  // Delivery channels
  sentViaEmail: Boolean, // default false
  sentViaPush: Boolean, // default false
  
  createdAt: Date, // default Date.now, indexed
  readAt: Date, // when notification was read
}

// Indexes
db.notifications.createIndex({ userId: 1, createdAt: -1 })
db.notifications.createIndex({ userId: 1, isRead: 1, createdAt: -1 })
db.notifications.createIndex({ type: 1, createdAt: -1 })
db.notifications.createIndex({ fromUserId: 1, createdAt: -1 })
```

---

## 10. Trending Topics Collection

```javascript
// Collection: trending_topics
{
  _id: ObjectId("..."),
  hashtag: String, // the hashtag without #, indexed
  category: String, // "technology" | "sports" | "entertainment" | "politics" | "general"
  location: String, // "global" | country code | city
  
  // Trending metrics
  stats: {
    tweetsCount: Number, // total tweets with this hashtag
    usersCount: Number, // unique users who used this hashtag
    impressions: Number, // total impressions
    engagements: Number, // total likes + retweets + replies
  },
  
  // Time-based metrics for trending calculation
  metrics: {
    last1Hour: Number, // tweets in last hour
    last6Hours: Number, // tweets in last 6 hours
    last24Hours: Number, // tweets in last 24 hours
    last7Days: Number, // tweets in last 7 days
  },
  
  // Trending score (calculated)
  trendingScore: Number, // algorithm-based score
  rank: Number, // current ranking position
  
  // Peak information
  peakTime: Date, // when this topic peaked
  peakTweetsPerHour: Number,
  
  // Status
  isPromoted: Boolean, // default false (for sponsored trends)
  isBlocked: Boolean, // default false (for moderated content)
  
  // Sample tweets for preview
  sampleTweets: [
    {
      tweetId: ObjectId,
      userId: ObjectId,
      username: String,
      content: String,
      likesCount: Number,
      retweetsCount: Number
    }
  ],
  
  firstSeen: Date, // when this hashtag first appeared
  lastUpdated: Date, // last time stats were updated
  createdAt: Date, // default Date.now
}

// Indexes
db.trending_topics.createIndex({ hashtag: 1, location: 1 })
db.trending_topics.createIndex({ trendingScore: -1, location: 1 })
db.trending_topics.createIndex({ rank: 1, location: 1 })
db.trending_topics.createIndex({ category: 1, trendingScore: -1 })
db.trending_topics.createIndex({ lastUpdated: -1 })
```

---

## 11. Media Collection

```javascript
// Collection: media
{
  _id: ObjectId("..."),
  userId: ObjectId, // user who uploaded, indexed
  type: String, // "image" | "video" | "gif"
  
  // File information
  originalName: String,
  filename: String, // stored filename
  mimetype: String, // file MIME type
  size: Number, // file size in bytes
  
  // Image/video properties
  dimensions: {
    width: Number,
    height: Number
  },
  duration: Number, // for videos, in seconds
  
  // URLs
  originalUrl: String, // original quality
  thumbnailUrl: String, // thumbnail/preview
  smallUrl: String, // small size
  mediumUrl: String, // medium size
  largeUrl: String, // large size
  
  // Processing status
  processingStatus: String, // "pending" | "processing" | "completed" | "failed"
  processingError: String, // error message if failed
  
  // Usage tracking
  usageCount: Number, // how many times this media is used
  
  // Metadata
  alt: String, // alt text for accessibility
  caption: String, // user-provided caption
  
  // Moderation
  isApproved: Boolean, // default true
  isSensitive: Boolean, // default false
  
  createdAt: Date, // default Date.now, indexed
  updatedAt: Date
}

// Indexes
db.media.createIndex({ userId: 1, createdAt: -1 })
db.media.createIndex({ type: 1, createdAt: -1 })
db.media.createIndex({ processingStatus: 1 })
db.media.createIndex({ filename: 1 }, { unique: true })
```

---

## 12. Hashtags Collection

```javascript
// Collection: hashtags
{
  _id: ObjectId("..."),
  hashtag: String, // the hashtag without #, unique indexed
  
  // Usage statistics
  stats: {
    totalUsage: Number, // total times used
    uniqueUsers: Number, // unique users who used it
    peakUsage: Number, // highest usage in a day
    peakDate: Date, // date of peak usage
  },
  
  // Recent activity
  recentActivity: {
    today: Number, // usage today
    thisWeek: Number, // usage this week
    thisMonth: Number, // usage this month
  },
  
  // Category and metadata
  category: String, // auto-categorized or manually set
  description: String, // optional description
  
  // Related hashtags
  relatedHashtags: [String], // frequently used together
  
  // Status
  isBlocked: Boolean, // default false
  isPromoted: Boolean, // default false
  
  firstUsed: Date, // first time this hashtag was used
  lastUsed: Date, // last time this hashtag was used
  createdAt: Date, // default Date.now
  updatedAt: Date
}

// Indexes
db.hashtags.createIndex({ hashtag: 1 }, { unique: true })
db.hashtags.createIndex({ "stats.totalUsage": -1 })
db.hashtags.createIndex({ "recentActivity.today": -1 })
db.hashtags.createIndex({ category: 1, "stats.totalUsage": -1 })
db.hashtags.createIndex({ lastUsed: -1 })
```

---

## Database Relationships

### One-to-Many Relationships:
- User → Tweets (1 user can have many tweets)
- User → Likes (1 user can like many tweets)
- User → Follows (1 user can follow many users)
- Tweet → Replies (1 tweet can have many replies)
- Conversation → Messages (1 conversation can have many messages)

### Many-to-Many Relationships:
- Users ↔ Users (Following/Followers)
- Users ↔ Tweets (Likes, Retweets)
- Users ↔ Conversations (Participants)

### Embedded Documents:
- Tweet stats (likes, retweets, replies counts)
- User stats (followers, following, tweets counts)
- Media information within tweets
- Hashtags and mentions within tweets

---

## Aggregation Pipelines for Common Queries

### 1. Get User Timeline with Tweet Details
```javascript
db.tweets.aggregate([
  // Get tweets from followed users
  {
    $lookup: {
      from: "follows",
      localField: "userId",
      foreignField: "followeeId",
      as: "followInfo"
    }
  },
  {
    $match: {
      "followInfo.followerId": currentUserId
    }
  },
  // Add user details
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "user"
    }
  },
  // Add engagement status for current user
  {
    $lookup: {
      from: "likes",
      let: { tweetId: "$_id", userId: currentUserId },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$tweetId", "$$tweetId"] },
                { $eq: ["$userId", "$$userId"] }
              ]
            }
          }
        }
      ],
      as: "userLike"
    }
  },
  {
    $sort: { createdAt: -1 }
  },
  {
    $limit: 20
  }
])
```

### 2. Get Tweet with Full Engagement Data
```javascript
db.tweets.aggregate([
  {
    $match: { _id: tweetId }
  },
  // Add user details
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "user"
    }
  },
  // Add recent likes
  {
    $lookup: {
      from: "likes",
      let: { tweetId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ["$tweetId", "$$tweetId"] }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $limit: 10
        }
      ],
      as: "recentLikes"
    }
  },
  // Add replies count and recent replies
  {
    $lookup: {
      from: "replies",
      let: { tweetId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ["$parentTweetId", "$$tweetId"] }
          }
        },
        {
          $lookup: {
            from: "tweets",
            localField: "tweetId",
            foreignField: "_id",
            as: "replyTweet"
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $limit: 5
        }
      ],
      as: "recentReplies"
    }
  }
])
```

### 3. Calculate Trending Topics
```javascript
db.tweets.aggregate([
  // Match tweets from last 24 hours
  {
    $match: {
      createdAt: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    }
  },
  // Unwind hashtags
  {
    $unwind: "$hashtags"
  },
  // Group by hashtag and count
  {
    $group: {
      _id: "$hashtags",
      count: { $sum: 1 },
      uniqueUsers: { $addToSet: "$userId" },
      sampleTweets: {
        $push: {
          tweetId: "$_id",
          userId: "$userId",
          content: "$content",
          stats: "$stats"
        }
      }
    }
  },
  // Calculate trending score
  {
    $addFields: {
      uniqueUsersCount: { $size: "$uniqueUsers" },
      trendingScore: {
        $multiply: [
          "$count",
          { $size: "$uniqueUsers" },
          0.01 // weight factor
        ]
      }
    }
  },
  // Sort by trending score
  {
    $sort: { trendingScore: -1 }
  },
  {
    $limit: 50
  }
])
```

---

## Performance Optimization Strategies

### 1. Indexing Strategy
- **Compound indexes** for common query patterns
- **Text indexes** for search functionality
- **Sparse indexes** for optional fields
- **TTL indexes** for temporary data (notifications, trends)

### 2. Data Denormalization
- Cache frequently accessed user data in tweets
- Store computed stats (followers, tweets count) in user documents
- Cache recent activity data for quick access

### 3. Sharding Strategy
- Shard tweets by user ID or time-based sharding
- Shard messages by conversation ID
- Keep user data unsharded for consistency

### 4. Caching Strategy
- Cache user timelines in Redis
- Cache trending topics
- Cache user profiles and stats
- Cache media URLs and metadata

---

## Data Consistency and Integrity

### 1. Referential Integrity
- Use MongoDB validators for required fields
- Implement application-level foreign key checks
- Use transactions for multi-document operations

### 2. Data Validation
```javascript
// Example validator for tweets collection
db.createCollection("tweets", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "content", "createdAt"],
      properties: {
        content: {
          bsonType: "string",
          maxLength: 280,
          description: "Tweet content must be a string and less than 280 characters"
        },
        type: {
          enum: ["tweet", "retweet", "quote"],
          description: "Type must be one of the valid tweet types"
        }
      }
    }
  }
})
```

### 3. Counter Consistency
Implement atomic counter updates using MongoDB's `$inc` operator:
```javascript
// Example: Update like count when like is added
await Promise.all([
  db.likes.insertOne(likeDocument),
  db.tweets.updateOne(
    { _id: tweetId },
    { $inc: { "stats.likesCount": 1 } }
  ),
  db.users.updateOne(
    { _id: tweetAuthorId },
    { $inc: { "stats.likesCount": 1 } }
  )
])
```

This comprehensive schema design provides a scalable foundation for the Twitter/X clone with proper indexing, relationships, and performance optimizations.