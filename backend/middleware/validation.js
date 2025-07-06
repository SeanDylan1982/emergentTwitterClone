const { body, param, query, validationResult } = require('express-validator');
const { apiResponse } = require('../utils/helpers');
const { isValidObjectId } = require('../utils/validators');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json(
      apiResponse(false, null, 'Validation failed', formattedErrors)
    );
  }
  
  next();
};

// Common validation rules
const validateObjectId = (field = 'id') => {
  return param(field)
    .custom(value => {
      if (!isValidObjectId(value)) {
        throw new Error('Invalid ID format');
      }
      return true;
    });
};

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// User validation rules
const validateUserRegistration = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number'),
  body('displayName')
    .isLength({ min: 1, max: 50 })
    .withMessage('Display name must be between 1 and 50 characters')
    .trim()
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validateUserUpdate = [
  body('displayName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Display name must be between 1 and 50 characters')
    .trim(),
  body('bio')
    .optional()
    .isLength({ max: 160 })
    .withMessage('Bio must be less than 160 characters')
    .trim(),
  body('location')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Location must be less than 50 characters')
    .trim(),
  body('website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL')
];

// Tweet validation rules
const validateTweetCreation = [
  body('content')
    .isLength({ min: 1, max: 280 })
    .withMessage('Tweet content must be between 1 and 280 characters')
    .trim(),
  body('visibility')
    .optional()
    .isIn(['public', 'followers', 'mentioned'])
    .withMessage('Invalid visibility setting'),
  body('allowReplies')
    .optional()
    .isIn(['everyone', 'followers', 'mentioned'])
    .withMessage('Invalid reply setting')
];

const validateReplyCreation = [
  body('content')
    .isLength({ min: 1, max: 280 })
    .withMessage('Reply content must be between 1 and 280 characters')
    .trim(),
  body('parentTweetId')
    .custom(value => {
      if (!isValidObjectId(value)) {
        throw new Error('Invalid parent tweet ID');
      }
      return true;
    })
];

// Message validation rules
const validateMessageCreation = [
  body('content')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message content must be between 1 and 1000 characters')
    .trim(),
  body('recipientId')
    .custom(value => {
      if (!isValidObjectId(value)) {
        throw new Error('Invalid recipient ID');
      }
      return true;
    })
];

// Search validation rules
const validateSearch = [
  query('q')
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .trim(),
  query('type')
    .optional()
    .isIn(['tweets', 'users', 'hashtags'])
    .withMessage('Invalid search type')
];

// Media validation rules
const validateMediaUpload = [
  body('alt')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Alt text must be less than 200 characters')
    .trim(),
  body('caption')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Caption must be less than 500 characters')
    .trim()
];

module.exports = {
  handleValidationErrors,
  validateObjectId,
  validatePagination,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateTweetCreation,
  validateReplyCreation,
  validateMessageCreation,
  validateSearch,
  validateMediaUpload
};