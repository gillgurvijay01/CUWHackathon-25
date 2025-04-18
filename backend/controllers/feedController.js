const RssFeed = require('../models/RssFeed');
const axios = require('axios');

const getAllFeeds = async (req, res) => {
  try {
    const feeds = await RssFeed.find().sort({ category: 1, name: 1 });
    
    res.json({
      count: feeds.length,
      feeds
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const addFeed = async (req, res) => {
  try {
    const { name, url, description } = req.body;
    
    if (!name || !url) {
      return res.status(400).json({ message: 'Name, URL, and category are required' });
    }
    
    const existingFeed = await RssFeed.findOne({ $or: [{ name }, { url }] });
    if (existingFeed) {
      return res.status(400).json({ message: 'Feed with this name or URL already exists' });
    }
  
    try {
      const response = await axios.get(url);
      if (!response.data || !response.data.items) {
        return res.status(400).json({ 
          message: 'Invalid RSS feed URL. The URL does not return valid RSS data' 
        });
      }
    } catch (error) {
      return res.status(400).json({ 
        message: 'Invalid RSS feed URL. Could not fetch data from the provided URL',
        error: error.message
      });
    }
    
    // Create the new feed
    const newFeed = new RssFeed({
      name,
      url,
      category,
      description: description || ''
    });
    
    await newFeed.save();
    
    res.status(201).json({
      message: 'Feed added successfully',
      feed: newFeed
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const updateFeed = async (req, res) => {
  try {
    const { feedId } = req.params;
    const { name, url, category, description, active } = req.body;
    
    // Check if feed exists
    const feed = await RssFeed.findById(feedId);
    if (!feed) {
      return res.status(404).json({ message: 'Feed not found' });
    }
    
    // Update only the provided fields
    if (name) feed.name = name;
    if (url) feed.url = url;
    if (category) feed.category = category;
    if (description !== undefined) feed.description = description;
    if (active !== undefined) feed.active = active;
    
    // If URL is being updated, validate it
    if (url && url !== feed.url) {
      try {
        const response = await axios.get(url);
        if (!response.data || !response.data.items) {
          return res.status(400).json({ 
            message: 'Invalid RSS feed URL. The URL does not return valid RSS data' 
          });
        }
      } catch (error) {
        return res.status(400).json({ 
          message: 'Invalid RSS feed URL. Could not fetch data from the provided URL',
          error: error.message
        });
      }
    }
    
    await feed.save();
    
    res.json({
      message: 'Feed updated successfully',
      feed
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const deleteFeed = async (req, res) => {
  try {
    const { feedId } = req.params;
    
    const result = await RssFeed.findByIdAndDelete(feedId);
    
    if (!result) {
      return res.status(404).json({ message: 'Feed not found' });
    }
    
    res.json({
      message: 'Feed deleted successfully',
      feedId
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const testFeedUrl = async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }
    
    try {
      const response = await axios.get(url);
      
      if (!response.data || !response.data.items) {
        return res.status(400).json({ 
          message: 'Invalid RSS feed URL. The URL does not return valid RSS data',
          valid: false
        });
      }
      
      // Return sample data from the feed
      res.json({
        message: 'Valid RSS feed URL',
        valid: true,
        sampleData: {
          title: response.data.title,
          itemCount: response.data.items.length,
          sampleItems: response.data.items.slice(0, 3)
        }
      });
    } catch (error) {
      return res.status(400).json({ 
        message: 'Invalid RSS feed URL. Could not fetch data from the provided URL',
        valid: false,
        error: error.message
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllFeeds,
  addFeed,
  updateFeed,
  deleteFeed,
  testFeedUrl
}; 