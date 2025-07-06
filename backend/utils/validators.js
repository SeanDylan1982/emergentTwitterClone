const mongoose = require('mongoose');

/**
 * Custom validation functions
 */

// Validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Validate username
const isValidUsername = (username) => {
  if (!username || typeof username !== 'string') return false;
  
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Validate email
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
const isValidPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  
  // At least 6 characters, contains letter and number
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
  return passwordRegex.test(password);
};

// Validate tweet content
const isValidTweetContent = (content) => {
  if (!content || typeof content !== 'string') return false;
  
  const trimmedContent = content.trim();
  return trimmedContent.length > 0 && trimmedContent.length <= 280;
};

// Validate hashtag
const isValidHashtag = (hashtag) => {
  if (!hashtag || typeof hashtag !== 'string') return false;
  
  const hashtagRegex = /^[a-zA-Z0-9_]{1,50}$/;
  return hashtagRegex.test(hashtag);
};

// Validate URL
const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Validate file type for media uploads
const isValidMediaType = (mimetype) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ];
  
  return allowedTypes.includes(mimetype);
};

// Validate file size (in bytes)
const isValidFileSize = (size, maxSize = 50 * 1024 * 1024) => { // 50MB default
  return typeof size === 'number' && size > 0 && size <= maxSize;
};

// Sanitize user input
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: urls
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

// Extract hashtags from text
const extractHashtags = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const hashtags = [];
  let match;
  
  while ((match = hashtagRegex.exec(text)) !== null) {
    hashtags.push(match[1].toLowerCase());
  }
  
  return [...new Set(hashtags)]; // Remove duplicates
};

// Extract mentions from text
const extractMentions = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1].toLowerCase());
  }
  
  return [...new Set(mentions)]; // Remove duplicates
};

// Extract URLs from text
const extractUrls = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = [];
  let match;
  
  while ((match = urlRegex.exec(text)) !== null) {
    urls.push(match[1]);
  }
  
  return urls;
};

// Validate pagination parameters
const validatePagination = (page, limit) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 20;
  
  const validPage = Math.max(1, pageNum);
  const validLimit = Math.min(Math.max(1, limitNum), 100); // Max 100 items per page
  const skip = (validPage - 1) * validLimit;
  
  return {
    page: validPage,
    limit: validLimit,
    skip
  };
};

// Validate location coordinates
const isValidCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return false;
  
  const [longitude, latitude] = coordinates;
  
  return (
    typeof longitude === 'number' &&
    typeof latitude === 'number' &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
};

// Validate date range
const isValidDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return (
    start instanceof Date &&
    end instanceof Date &&
    !isNaN(start.getTime()) &&
    !isNaN(end.getTime()) &&
    start <= end
  );
};

// Rate limiting validation
const createRateLimitKey = (userId, action) => {
  return `rate_limit:${userId}:${action}`;
};

// Validate tweet visibility
const isValidVisibility = (visibility) => {
  const validVisibilities = ['public', 'followers', 'mentioned'];
  return validVisibilities.includes(visibility);
};

// Validate reply settings
const isValidReplySettings = (setting) => {
  const validSettings = ['everyone', 'followers', 'mentioned'];
  return validSettings.includes(setting);
};

module.exports = {
  isValidObjectId,
  isValidUsername,
  isValidEmail,
  isValidPassword,
  isValidTweetContent,
  isValidHashtag,
  isValidUrl,
  isValidMediaType,
  isValidFileSize,
  sanitizeInput,
  extractHashtags,
  extractMentions,
  extractUrls,
  validatePagination,
  isValidCoordinates,
  isValidDateRange,
  createRateLimitKey,
  isValidVisibility,
  isValidReplySettings
};