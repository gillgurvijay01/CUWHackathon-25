const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { 
  getNews, 
  getPersonalizedNews, 
  getNewsCategories, 
  getNewsById
} = require('../controllers/newsController');

router.get('/', getNews);
router.get('/categories', getNewsCategories);
router.get('/details/:id', getNewsById);
router.get('/personalized', authenticate, getPersonalizedNews);

module.exports = router; 