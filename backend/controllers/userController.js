const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');
const registerUser = async (req, res) => {
  try {
    const { username, email, password, preferences } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    if (preferences && preferences.length > 3) {
      return res.status(400).json({ message: 'Maximum 3 preferences allowed' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword,
      preferences: preferences || []
    });
    await user.save();
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        preferences: user.preferences
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ message: 'Username and password are required' });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        preferences: user.preferences
      }
    }).status(200);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUserPreferences = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      preferences: user.preferences
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updatePreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({ message: 'Preferences are required' });
    }

    if (preferences.length > 3) {
      return res.status(400).json({ message: 'Maximum 3 preferences allowed' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { preferences },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const saveArticle = async (req, res) => {
  try {
    const { articleId } = req.body;

    if (!articleId) {
      return res.status(400).json({ message: 'Article ID is required' });
    }
    res.json({
      message: 'Article saved successfully',
      articleId
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const markArticleAsRead = async (req, res) => {
  try {
    const { articleId } = req.body;

    if (!articleId) {
      return res.status(400).json({ message: 'Article ID is required' });
    }

    res.json({
      message: 'Article marked as read',
      articleId
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserPreferences,
  updatePreferences,
  saveArticle,
  markArticleAsRead
}; 