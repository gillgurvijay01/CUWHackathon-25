const express = require('express');
const router = express.Router();
const { 
  getAllFeeds, 
  addFeed, 
  updateFeed, 
  deleteFeed, 
  testFeedUrl 
} = require('../controllers/feedController');

router.get('/', getAllFeeds);

router.post('/', addFeed);

router.put('/:feedId', updateFeed);

router.delete('/:feedId', deleteFeed);

router.post('/test', testFeedUrl);

module.exports = router; 