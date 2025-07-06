const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { apiResponse } = require('../utils/helpers');

// Authenticate user via JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(
        apiResponse(false, null, 'Access denied. No token provided.')
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      
      // Get user from database
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(401).json(
          apiResponse(false, null, 'Invalid token. User not found.')
        );
      }

      if (!user.isActive || user.isSuspended) {
        return res.status(401).json(
          apiResponse(false, null, 'Account is inactive or suspended.')
        );
      }

      req.user = user;
      next();
    } catch (tokenError) {
      return res.status(401).json(
        apiResponse(false, null, 'Invalid token.')
      );
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during authentication.')
    );
  }
};

// Optional authentication (doesn't require token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user && user.isActive && !user.isSuspended) {
          req.user = user;
        }
      } catch (tokenError) {
        // Ignore token errors for optional auth
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

// Check if user owns resource
const checkOwnership = (resourceField = 'userId') => {
  return (req, res, next) => {
    const resourceId = req.params.id || req.body[resourceField];
    
    if (req.user._id.toString() !== resourceId.toString()) {
      return res.status(403).json(
        apiResponse(false, null, 'Access denied. You can only access your own resources.')
      );
    }
    
    next();
  };
};

// Check if user is verified
const requireVerified = (req, res, next) => {
  if (!req.user.verified) {
    return res.status(403).json(
      apiResponse(false, null, 'This action requires a verified account.')
    );
  }
  
  next();
};

// Rate limiting for specific actions
const actionRateLimit = (action, maxAttempts = 10, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const key = `${req.user._id}:${action}`;
    const now = Date.now();
    
    if (!attempts.has(key)) {
      attempts.set(key, []);
    }
    
    const userAttempts = attempts.get(key);
    
    // Remove old attempts outside the window
    const validAttempts = userAttempts.filter(timestamp => now - timestamp < windowMs);
    attempts.set(key, validAttempts);
    
    if (validAttempts.length >= maxAttempts) {
      return res.status(429).json(
        apiResponse(false, null, `Too many ${action} attempts. Please try again later.`)
      );
    }
    
    validAttempts.push(now);
    next();
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  checkOwnership,
  requireVerified,
  actionRateLimit
};