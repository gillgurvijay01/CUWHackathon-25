const axios = require('axios');
const RssFeed = require('../models/RssFeed');

/**
 * Fetch data from a single RSS feed URL
 * @param {String} url - The RSS feed URL
 * @returns {Array} - Array of feed items or empty array on error
 */
const fetchFeedData = async (url) => {
  try {
    const response = await axios.get(url);
    return response.data.items || [];
  } catch (error) {
    console.error(`Error fetching feed from ${url}:`, error.message);
    return [];
  }
};

/**
 * Get all news feeds without personalization
 * Fetches all active feeds and combines them
 */
const getNews = async (req, res) => {
  try {
    // Get sorting and pagination parameters from query
    const { sort = 'desc', limit = 100, page = 1 } = req.query;
    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const sortOrder = sort.toLowerCase() === 'asc' ? 1 : -1;

    // Get all active feed sources
    const feedSources = await RssFeed.find({ active: true });

    if (!feedSources.length) {
      return res.status(404).json({ message: 'No feed sources found' });
    }

    // Fetch data from all feed sources in parallel
    const feedPromises = feedSources.map(feed => fetchFeedData(feed.url));
    const feedResults = await Promise.all(feedPromises);

    // Combine and process all feed items
    let allItems = [];
    feedResults.forEach((items, index) => {
      if (items && items.length) {
        // Add source information to each item
        const sourceName = feedSources[index].name;

        const processedItems = items.map(item => ({
          ...item,
          source: sourceName,
          date_published: item.date_published || new Date().toISOString()
        }));

        allItems = [...allItems, ...processedItems];
      }
    });

    // Filter items to include only those not more than 10 days old
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    allItems = allItems.filter(item => {
      const itemDate = new Date(item.date_published);
      return itemDate >= tenDaysAgo;
    });

    // Sort by date first (most recent first by default)
    allItems.sort((a, b) => {
      const dateA = new Date(a.date_published);
      const dateB = new Date(b.date_published);
      return sortOrder * (dateB - dateA);
    });

    // Shuffle the items to break up author chunks
    for (let i = allItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allItems[i], allItems[j]] = [allItems[j], allItems[i]];
    }

    // Calculate pagination values
    const totalItems = allItems.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    // Get items for the requested page
    const paginatedItems = allItems.slice(startIndex, endIndex);

    res.json({
      count: totalItems,
      currentPage: pageNum,
      totalPages: totalPages,
      pageSize: pageSize,
      items: paginatedItems
    });
  } catch (error) {
    console.error('Error in getNews controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get personalized news feeds based on user preferences
 * User preferences contain company names (e.g., "Tesla", "Meta", "Concordia University")
 * If user has no preferences, falls back to all news
 */
const getPersonalizedNews = async (req, res) => {
  try {
    const { sort = 'desc', limit = 50 } = req.query;
    const sortOrder = sort.toLowerCase() === 'asc' ? 1 : -1;

    // Get user preferences from authenticated user
    const userPreferences = req.user.preferences;

    let feedSources;

    // If user has preferences, filter feed sources by company name
    if (userPreferences && userPreferences.length > 0) {
      feedSources = await RssFeed.find({
        active: true,
        name: { $in: userPreferences }
      });

      // If no feeds match preferences, return message
      if (!feedSources.length) {
        return res.status(404).json({
          message: 'No feed sources match your company preferences',
          preferences: userPreferences
        });
      }
    } else {
      // If no preferences, get all active feed sources
      feedSources = await RssFeed.find({ active: true });

      if (!feedSources.length) {
        return res.status(404).json({ message: 'No feed sources found' });
      }
    }

    // Fetch data from all relevant feed sources in parallel
    const feedPromises = feedSources.map(feed => fetchFeedData(feed.url));
    const feedResults = await Promise.all(feedPromises);

    // Combine and process all feed items
    let allItems = [];
    feedResults.forEach((items, index) => {
      if (items && items.length) {
        // Add source information to each item
        const sourceName = feedSources[index].name;

        const processedItems = items.map(item => ({
          ...item,
          source: sourceName,
          date_published: item.date_published || new Date().toISOString()
        }));

        allItems = [...allItems, ...processedItems];
      }
    });

    // Sort items by publication date
    allItems.sort((a, b) => {
      const dateA = new Date(a.date_published);
      const dateB = new Date(b.date_published);
      return sortOrder * (dateB - dateA);
    });

    // Limit the number of items
    if (limit) {
      allItems = allItems.slice(0, parseInt(limit));
    }

    res.json({
      count: allItems.length,
      personalized: userPreferences && userPreferences.length > 0,
      preferences: userPreferences,
      items: allItems
    });
  } catch (error) {
    console.error('Error in getPersonalizedNews controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get all available companies that have RSS feeds
 */
const getNewsCategories = async (req, res) => {
  try {
    // Get names of all companies with active feeds
    const companies = await RssFeed.distinct('name', { active: true });

    res.json({
      count: companies.length,
      companies
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get a specific news item by ID
 * Note: Since RSS feeds don't typically provide a consistent ID system,
 * this implementation depends on how you handle IDs in your application
 */
const getNewsById = async (req, res) => {
  try {
    const { id } = req.params;

    // This is a placeholder implementation
    // In a real app, you might store articles in a database or implement a more complex lookup

    res.status(501).json({
      message: 'Feature not implemented',
      note: 'This feature requires storing articles in a database for retrieval by ID'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getNews,
  getPersonalizedNews,
  getNewsCategories,
  getNewsById
}; 