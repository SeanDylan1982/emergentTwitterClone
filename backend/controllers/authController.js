const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { apiResponse, generateToken, sanitizeUser } = require('../utils/helpers');
const { isValidEmail, isValidPassword } = require('../utils/validators');

// Register new user
const register = async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username: username.toLowerCase() }]
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return res.status(400).json(
        apiResponse(false, null, `User with this ${field} already exists`)
      );
    }

    // Create user
    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      displayName
    });

    await user.save();

    // Generate token
    const token = generateToken({ userId: user._id });

    // Remove password from response
    const userResponse = sanitizeUser(user);

    res.status(201).json(
      apiResponse(true, {
        user: userResponse,
        token
      }, 'User registered successfully')
    );
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during registration')
    );
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json(
        apiResponse(false, null, 'Invalid credentials')
      );
    }

    // Check if account is active
    if (!user.isActive || user.isSuspended) {
      return res.status(401).json(
        apiResponse(false, null, 'Account is inactive or suspended')
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json(
        apiResponse(false, null, 'Invalid credentials')
      );
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Generate token
    const token = generateToken({ userId: user._id });

    // Remove password from response
    const userResponse = sanitizeUser(user);

    res.json(
      apiResponse(true, {
        user: userResponse,
        token
      }, 'Login successful')
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during login')
    );
  }
};

// Get current user profile
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json(
        apiResponse(false, null, 'User not found')
      );
    }

    res.json(
      apiResponse(true, { user }, 'User profile retrieved successfully')
    );
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error')
    );
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { displayName, bio, location, website } = req.body;
    
    const updates = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    if (website !== undefined) updates.website = website;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(
      apiResponse(true, { user }, 'Profile updated successfully')
    );
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during profile update')
    );
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id);
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json(
        apiResponse(false, null, 'Current password is incorrect')
      );
    }

    // Validate new password
    if (!isValidPassword(newPassword)) {
      return res.status(400).json(
        apiResponse(false, null, 'New password must be at least 6 characters and contain letters and numbers')
      );
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json(
      apiResponse(true, null, 'Password changed successfully')
    );
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during password change')
    );
  }
};

// Logout (client-side token removal)
const logout = async (req, res) => {
  try {
    // In a more sophisticated implementation, you might maintain a blacklist of tokens
    // For now, we'll just send a success response
    res.json(
      apiResponse(true, null, 'Logout successful')
    );
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during logout')
    );
  }
};

// Verify email (placeholder for email verification feature)
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    // This would normally verify an email verification token
    // For now, we'll just return a placeholder response
    
    res.json(
      apiResponse(true, null, 'Email verification feature coming soon')
    );
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during email verification')
    );
  }
};

// Forgot password (placeholder)
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // This would normally send a password reset email
    // For now, we'll just return a placeholder response
    
    res.json(
      apiResponse(true, null, 'Password reset feature coming soon')
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json(
      apiResponse(false, null, 'Server error during password reset')
    );
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  verifyEmail,
  forgotPassword
};