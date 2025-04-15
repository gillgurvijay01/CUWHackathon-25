const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getNews,
  getPersonalizedNews,
  getNewsCategories,
  getNewsById
} = require('../controllers/newsController');

// Public routes
router.get('/', getNews);
router.get('/categories', getNewsCategories);
router.get('/details/:id', getNewsById);

// Protected routes - require authentication
router.get('/personalized', authenticate, getPersonalizedNews);

module.exports = router; 