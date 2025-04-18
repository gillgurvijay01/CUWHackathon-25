const mongoose = require('mongoose');
const dotenv = require('dotenv');
const RssFeed = require('../models/RssFeed');
const axios = require('axios');

dotenv.config();

const initialFeeds = [
  {
    name: 'CUW News',
    url: 'https://rss.app/feeds/v1.1/9h75XadJn6wlTDLt.json',
    category: 'education',
    description: 'LinkedIn posts from Concordia University Wisconsin'
  },
  {
    name: 'Tesla',
    url: 'https://rss.app/feeds/v1.1/Wexjvalv7UC2KHws.json',
    category: 'automotive',
    description: 'LinkedIn posts from Tesla'
  },
  {
    name: 'Meta News',
    url: 'https://rss.app/feeds/v1.1/ZZWm1f75DdOpdBZZ.json', 
    category: 'technology',
    description: 'News and updates from Meta'
  },
  {
    name: 'Google News',
    url: 'https://rss.app/feeds/v1.1/GCLI7fC8wQscGSL1.json',
    category: 'technology',
    description: 'Latest updates from Google'
  },
  {
    name: 'Microsoft News',
    url: 'https://rss.app/feeds/v1.1/VIzxYvMHK6iLXEGs.json',
    category: 'technology',
    description: 'News and updates from Microsoft'
  },
  {
    name: 'Aurora WDC',
    url: 'https://rss.app/feeds/v1.1/5I43EYlLskvsnPxQ.json',
    category: 'business',
    description: 'News and updates from Aurora WDC'
  }
];

// Function to test if a feed URL is valid
const testFeedUrl = async (feed) => {
  try {
    console.log(`Testing feed URL for ${feed.name}...`);
    const response = await axios.get(feed.url, { 
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.data) {
      console.warn(` Warning: No data returned from ${feed.name}`);
      return false;
    }
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      console.log(`${feed.name}: Validated (array format, ${response.data.length} items)`);
      return true;
    }
    
    if (response.data.items && Array.isArray(response.data.items)) {
      console.log(`${feed.name}: Validated (standard format, ${response.data.items.length} items)`);
      return true;
    }
    
    if (response.data.feed && response.data.feed.items && Array.isArray(response.data.feed.items)) {
      console.log(`${feed.name}: Validated (nested format, ${response.data.feed.items.length} items)`);
      return true;
    }
    
    if (response.data.articles && Array.isArray(response.data.articles)) {
      console.log(`${feed.name}: Validated (articles format, ${response.data.articles.length} items)`);
      return true;
    }
    
    console.warn(`Warning: ${feed.name} has unexpected structure:`, Object.keys(response.data).join(', '));
    return false;
  } catch (error) {
    console.error(` Error testing ${feed.name}:`, error.message);
    return false;
  }
};

// Connecting with MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/NewsFeed')
  .then(async () => {
    console.log('MongoDB connected');
    
    try {
      // First, validate all feeds
      console.log('Validating feed URLs...');
      const validationResults = await Promise.all(initialFeeds.map(testFeedUrl));
      
      const validFeeds = initialFeeds.filter((_, index) => validationResults[index]);
      
      if (validFeeds.length < initialFeeds.length) {
        console.warn(`Warning: ${initialFeeds.length - validFeeds.length} feeds failed validation`);
      }
      
      // Clear existing feeds
      await RssFeed.deleteMany({});
      console.log('Cleared existing feeds');
      
      // Insert valid feeds
      const result = await RssFeed.insertMany(validFeeds);
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