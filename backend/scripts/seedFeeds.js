const mongoose = require('mongoose');
const dotenv = require('dotenv');
const RssFeed = require('../models/RssFeed');

dotenv.config();
const initialFeeds = [
  {
    name: 'Concordia University Wisconsin',
    url: 'https://rss.app/feeds/v1.1/P5BUAfjaWqot8MAg.json',
    category: 'education',
    description: 'LinkedIn posts from Concordia University Wisconsin'
  },
  {
    name: 'Tesla',
    url: 'https://rss.app/feeds/v1.1/x9yX21R6rExtxk0W.json',
    category: 'automotive',
    description: 'LinkedIn posts from Tesla'
  },
  {
    name: 'Meta',
    url: 'https://rss.app/feeds/v1.1/kb49CJ4EZkmUxAQo.json', 
    category: 'technology',
    description: 'News and updates from Meta'
  },
  {
    name: 'Google',
    url: 'https://rss.app/feeds/v1.1/gZxdwnx1N0cBMfQt.json',
    category: 'technology',
    description: 'Latest updates from Google'
  },
  {
    name: 'Microsoft',
    url: 'https://rss.app/feeds/v1.1/hyApoiRn3WYZEzgw.json',
    category: 'technology',
    description: 'News and updates from Microsoft'
  },
  {
    name: 'Aurora WDC',
    url: 'https://rss.app/feeds/v1.1/oOBBMr6brDTbdsGh.json',
    category: 'business',
    description: 'News and updates from Aurora WDC'
  }
];

// Connecting with MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/NewsFeed')
  .then(async () => {
    console.log('MongoDB connected');
    
    try {
      await RssFeed.deleteMany({});
      console.log('Cleared existing feeds');
      const result = await RssFeed.insertMany(initialFeeds);
      console.log(`Successfully seeded ${result.length} company feeds:`);
      result.forEach(feed => {
        console.log(`- ${feed.name} (${feed.category})`);
      });
      
      process.exit(0);
    } catch (error) {
      console.error('Error seeding feeds:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }); 