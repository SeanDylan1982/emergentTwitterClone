const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Helper functions for various operations
 */

// Generate unique filename for uploads
const generateFilename = (originalName, userId) => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const extension = originalName.split('.').pop();
  
  return `${userId}_${timestamp}_${random}.${extension}`;
};

// Generate JWT token
const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn
  });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Format numbers (e.g., 1234 -> 1.2K)
const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Calculate time ago
const timeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d`;
  }
  
  // For older dates, return formatted date
  return date.toLocaleDateString();
};

// Generate random string
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Hash string using SHA256
const hashString = (str) => {
  return crypto.createHash('sha256').update(str).digest('hex');
};

// Create slug from text
const createSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
};

// Capitalize first letter
const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Truncate text
const truncateText = (text, length = 100, suffix = '...') => {
  if (text.length <= length) return text;
  return text.substring(0, length) + suffix;
};

// Deep clone object
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Remove sensitive fields from user object
const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;
  delete userObj.email;
  delete userObj.settings;
  return userObj;
};

// Calculate engagement rate
const calculateEngagementRate = (likes, retweets, replies, views) => {
  const totalEngagements = likes + retweets + replies;
  if (views === 0) return 0;
  return ((totalEngagements / views) * 100).toFixed(2);
};

// Generate verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Validate environment variables
const validateEnvVars = (requiredVars) => {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Generate cache key
const generateCacheKey = (...parts) => {
  return parts.join(':');
};

// Debounce function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Retry async operation
const retryAsync = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Check if string is JSON
const isValidJSON = (str) => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

// Generate API response format
const apiResponse = (success, data = null, message = '', errors = null) => {
  return {
    success,
    data,
    message,
    errors,
    timestamp: new Date().toISOString()
  };
};

// Parse sort parameters
const parseSortParams = (sortStr, allowedFields) => {
  if (!sortStr) return {};
  
  const sortObj = {};
  const sortPairs = sortStr.split(',');
  
  sortPairs.forEach(pair => {
    const [field, order] = pair.split(':');
    if (allowedFields.includes(field)) {
      sortObj[field] = order === 'desc' ? -1 : 1;
    }
  });
  
  return sortObj;
};

// Escape regex special characters
const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

module.exports = {
  generateFilename,
  generateToken,
  verifyToken,
  formatNumber,
  timeAgo,
  generateRandomString,
  hashString,
  createSlug,
  capitalize,
  truncateText,
  deepClone,
  sanitizeUser,
  calculateEngagementRate,
  generateVerificationCode,
  validateEnvVars,
  formatFileSize,
  generateCacheKey,
  debounce,
  retryAsync,
  isValidJSON,
  apiResponse,
  parseSortParams,
  escapeRegex
};