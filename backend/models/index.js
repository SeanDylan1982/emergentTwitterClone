// Central export file for all models
const User = require('./User');
const Tweet = require('./Tweet');
const Like = require('./Like');
const Retweet = require('./Retweet');
const Reply = require('./Reply');
const Follow = require('./Follow');
const Message = require('./Message');
const Conversation = require('./Conversation');
const Notification = require('./Notification');
const TrendingTopic = require('./TrendingTopic');
const Media = require('./Media');
const Hashtag = require('./Hashtag');

module.exports = {
  User,
  Tweet,
  Like,
  Retweet,
  Reply,
  Follow,
  Message,
  Conversation,
  Notification,
  TrendingTopic,
  Media,
  Hashtag
};