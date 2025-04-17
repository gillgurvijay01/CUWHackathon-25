const mongoose = require('mongoose');
const RssFeed = require('./../models/RssFeed'); // Adjust the path if necessary

const defaultRssFeeds = [
    {
        name: 'CUW News',
        url: 'https://rss.app/feeds/v1.1/P5BUAfjaWqot8MAg.json',
        category: 'News',
        description: 'Concordia University Wisconsin news and updates.',
        active: true
    },
    {
        name: 'Google News',
        url: 'https://rss.app/feeds/v1.1/gZxdwnx1N0cBMfQt.json',
        category: 'Technology',
        description: 'Latest news and updates from Google.',
        active: true
    },
    {
        name: 'Microsoft News',
        url: 'https://rss.app/feeds/v1.1/hyApoiRn3WYZEzgw.json',
        category: 'Technology',
        description: 'Latest news and updates from Microsoft.',
        active: true
    },
    {
        name: 'Meta News',
        url: 'https://rss.app/feeds/v1.1/kb49CJ4EZkmUxAQo.json',
        category: 'Technology',
        description: 'Latest news and updates from Meta.',
        active: true
    },
    {
        name: "Aurora WDC",
        url: "https://rss.app/feeds/v1.1/oOBBMr6brDTbdsGh.json",
        category: "Technology",
        description: "Latest news and updates from Aurora WDC.",
        active: true

    }
];

async function initializeDatabase() {
    try {
        const count = await RssFeed.countDocuments();
        if (count === 0) {
            console.log('No RSS feeds found. Initializing default data...');
            await RssFeed.insertMany(defaultRssFeeds);
            console.log('Default RSS feeds added successfully.');
        } else {
            console.log('RSS feeds already exist. Skipping initialization.');
        }
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

module.exports = initializeDatabase;