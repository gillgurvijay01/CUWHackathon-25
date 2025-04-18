const axios = require('axios');
const RssFeed = require('../models/RssFeed');
const Parser = require('rss-parser');

const fetchFeedData = async (url, sourceName) => {
  try {
    console.log(`Fetching feed from ${sourceName}: ${url}`);
    
    // First, try a direct fetch to check the content type
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      }
    });
    
    // Check if the response is JSON (RSS.app uses JSON format)
    if (typeof response.data === 'object') {
      console.log(`Feed from ${sourceName} is in JSON format`);
      
      let items = [];
      
      // Handle different JSON structures
      if (response.data.items && Array.isArray(response.data.items)) {
        // Standard RSS.app format
        items = response.data.items;
        console.log(`Found ${items.length} items in standard JSON format`);
      } else if (response.data.feed && response.data.feed.items && Array.isArray(response.data.feed.items)) {
        // Nested format
        items = response.data.feed.items;
        console.log(`Found ${items.length} items in nested JSON format`);
      } else if (Array.isArray(response.data)) {
        // Direct array format
        items = response.data;
        console.log(`Found ${items.length} items in array JSON format`);
      } else {
        // Try to find an array property
        for (const key in response.data) {
          if (Array.isArray(response.data[key]) && response.data[key].length > 0) {
            items = response.data[key];
            console.log(`Found ${items.length} items in '${key}' JSON property`);
            break;
          }
        }
      }
      
      if (!items.length) {
        console.warn(`No valid items found in JSON feed: ${sourceName}`);
        return [];
      }
      
      // Process and normalize JSON feed items
      return items.map(item => {
     
        let imageUrl = null;
        
        
        if (item.image || item.thumbnail || item.enclosure) {
          imageUrl = item.image || 
                    (item.thumbnail ? item.thumbnail.url || item.thumbnail : null) ||
                    (item.enclosure && item.enclosure.url) || null;
        } else if (item.media_content && item.media_content.length) {
          imageUrl = item.media_content[0].url || null;
        }
        
        // Create normalized item with consistent property names
        return {
          title: item.title || 'No Title',
          link: item.url || item.link || '',
          content: item.content_text || item.description || item.summary || '',
          date_published: item.date_published || item.pubDate || item.published || item.date || new Date().toISOString(),
          author: item.author || item.creator || sourceName,
          image: imageUrl,
          guid: item.id || item.guid || item.link || `${sourceName}-${Date.now()}-${Math.random()}`
        };
      });
    } 
    
    else {
      console.log(`Feed from ${sourceName} appears to be in XML format, using rss-parser`);
      
      // Use a timeout to prevent hanging on slow feeds
      const parser = new Parser({
        timeout: 10000, // 10 second timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        customFields: {
          item: [
            ['media:content', 'media'],
            ['media:thumbnail', 'thumbnail'],
            ['enclosure', 'enclosure']
          ]
        }
      });
      const xmlData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      const feed = await parser.parseString(xmlData);
      
      if (!feed || !feed.items || !Array.isArray(feed.items)) {
        console.warn(`No valid items found in XML feed: ${sourceName}`);
        return [];
      }
      
      return feed.items.map(item => {
        let imageUrl = null;

        if (item.media && item.media.$ && item.media.$.url) {
          imageUrl = item.media.$.url;
        } 

        else if (item.enclosure && item.enclosure.url && 
                (item.enclosure.type || '').startsWith('image/')) {
          imageUrl = item.enclosure.url;
        }

        else if (item.thumbnail && item.thumbnail.$ && item.thumbnail.$.url) {
          imageUrl = item.thumbnail.$.url;
        }

        else if (item.content && typeof item.content === 'string') {
          const imgMatch = /<img[^>]+src="([^">]+)"/i.exec(item.content);
          if (imgMatch && imgMatch[1]) {
            imageUrl = imgMatch[1];
          }
        }

        else if (item['content:encoded'] && typeof item['content:encoded'] === 'string') {
          const imgMatch = /<img[^>]+src="([^">]+)"/i.exec(item['content:encoded']);
          if (imgMatch && imgMatch[1]) {
            imageUrl = imgMatch[1];
          }
        }
        return {
          title: item.title || 'No Title',
          link: item.link || '',
          content: item.content || item.description || item.summary || '',
          date_published: item.pubDate || item.published || item.date || new Date().toISOString(),
          author: item.creator || item.author || item['dc:creator'] || sourceName,
          image: imageUrl,
          guid: item.guid || item.id || item.link || `${sourceName}-${Date.now()}-${Math.random()}`
        };
      });
    }
  } catch (error) {
    console.error(`Error fetching feed from ${sourceName}:`, error.message);
    return [];
  }
};

const getNews = async (req, res) => {
  try {

    console.log(`Request for news with params:`, req.query);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skipIndex = (page - 1) * limit;
    const noShuffle = req.query.noShuffle === 'true';
    
    const feeds = await RssFeed.find({ active: true });
    console.log(`Found ${feeds.length} active feeds`);
    
    if (feeds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: 'No active feeds found'
      });
    }
    
 
    const allItems = [];
    const feedPromises = feeds.map(feed => fetchFeedData(feed.url, feed.name));
    const results = await Promise.allSettled(feedPromises);
    
  
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value && Array.isArray(result.value)) {
        const feed = feeds[index];
        const items = result.value.map(item => ({
          ...item,
          source: feed.name,
          sourceCategory: feed.category
        }));
        allItems.push(...items);
        console.log(`Added ${items.length} items from ${feed.name}`);
      } else {
        console.warn(`Failed to fetch or process feed ${feeds[index].name}: ${result.reason || 'No items returned'}`);
      }
    });
    

    console.log(`Total items before filtering: ${allItems.length}`);
    

    const processedItems = allItems.map(item => {
      if (!item.date_published) {
        item.date_published = item.published || item.pubDate || new Date().toISOString();
      }
      return item;
    });
    
    console.log(`Total items after processing: ${processedItems.length}`);
  
    processedItems.sort((a, b) => {
      const dateA = new Date(a.date_published || new Date());
      const dateB = new Date(b.date_published || new Date());
      return dateB - dateA;
    });
    

    let shuffledItems = processedItems;
    if (!noShuffle) {
      for (let i = shuffledItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
        [shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]];
      }
      console.log('Items shuffled');
    } else {
      console.log('Shuffle disabled, returning sorted by date');
    }
 
    const sourceCounts = {};
    shuffledItems.forEach(item => {
      sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
    });
    console.log('Items by source:', sourceCounts);
    
    // Pagination
    const totalCount = shuffledItems.length;
    const paginatedItems = shuffledItems.slice(skipIndex, skipIndex + limit);
    
    res.status(200).json({
      success: true,
      count: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      data: paginatedItems
    });
    
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
};


const getPersonalizedNews = async (req, res) => {
  try {
    const { sort = 'desc', limit = 50 } = req.query;
    const sortOrder = sort.toLowerCase() === 'asc' ? 1 : -1;


    const userPreferences = req.user.preferences;
    console.log('User preferences:', JSON.stringify(userPreferences));

    let feedSources;

    if (userPreferences && userPreferences.length > 0) {
      console.log('Filtering feeds by preferences:', userPreferences);
      
      // Get all active feeds to log what's available
      const allFeeds = await RssFeed.find({ active: true });
      console.log('Available active feeds:', allFeeds.map(f => f.name));
      
      feedSources = await RssFeed.find({
        active: true, // Changed from isActive to active
        name: { $in: userPreferences }
      });

      console.log(`Found ${feedSources.length} feeds matching user preferences`);
      console.log('Matched feeds:', feedSources.map(f => f.name));

      // If no feeds match preferences, return message
      if (!feedSources.length) {
        return res.status(404).json({
          message: 'No feed sources match your company preferences',
          preferences: userPreferences,
          available_feeds: allFeeds.map(f => f.name)
        });
      }
    } else {
      // If no preferences, get all active feed sources
      console.log('No user preferences found, fetching all active feeds');
      feedSources = await RssFeed.find({ active: true });
      if (!feedSources.length) {
        return res.status(404).json({ 
          message: 'No feed sources found',
          available_feeds: [] 
        });
      }
    }

    // Fetch data from all relevant feed sources in parallel
    const feedPromises = feedSources.map(feed => fetchFeedData(feed.url, feed.name));
    const feedResults = await Promise.all(feedPromises);

    // Combine and process all feed items
    let allItems = [];
    feedResults.forEach((items, index) => {
      if (items && items.length) {
        // Add source information to each item
        const sourceName = feedSources[index].name;
        console.log(`Processing ${items.length} items from ${sourceName}`);

        const processedItems = items.map(item => ({
          ...item,
          source: sourceName,
          date_published: item.date_published || item.published || item.pubDate || new Date().toISOString()
        }));

        allItems = [...allItems, ...processedItems];
      } else {
        console.log(`No items found for ${feedSources[index].name}`);
      }
    });

    console.log(`Total personalized items: ${allItems.length}`);

    // Count items by source before sorting
    const sourceCounts = {};
    allItems.forEach(item => {
      sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
    });
    console.log('Personalized items by source:', sourceCounts);

    // Sort items by publication date
    allItems.sort((a, b) => {
      const dateA = new Date(a.date_published || new Date());
      const dateB = new Date(b.date_published || new Date());
      return sortOrder * (dateB - dateA);
    });

    // Limit the number of items
    if (limit) {
      allItems = allItems.slice(0, parseInt(limit));
    }

    // Improve response with more debugging information
    res.json({
      count: allItems.length,
      personalized: userPreferences && userPreferences.length > 0,
      preferences: userPreferences,
      feeds_matched: feedSources.map(f => f.name),
      items: allItems
    });
  } catch (error) {
    console.error('Error in getPersonalizedNews controller:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const getNewsCategories = async (req, res) => {
  try {
    // Get names of all companies with active feeds - changed from active to active
    const companies = await RssFeed.distinct('name', { active: true });

    res.json({
      count: companies.length,
      companies
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getNewsById = async (req, res) => {
  try {
    const { id } = req.params;

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