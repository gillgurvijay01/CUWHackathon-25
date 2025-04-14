const express = require('express');
const router = express.Router();
const { validateUserRegistration } = require('../middleware/validator');
const {
  registerUser,
  loginUser,
  getUserPreferences,
  updatePreferences
} = require('../controllers/userController');

// Public routes
router.post('/register', validateUserRegistration, registerUser);
router.post('/login', loginUser);

// Protected routes - require authentication
router.get('/:userId/preferences', getUserPreferences);
router.put('/:userId/preferences', updatePreferences);

module.exports = router; 