![AuroraWDC](https://aurorawdc.com/wp-content/uploads/2024/05/Aurora_Logo-new-RGB.png)

# CUW Hackathon Spring 2025 sponsored by Aurora WDC! 

## Hackathon Format

Date: Thursday, April 10th

Time: 4:00pm - 9:00pm CST

# Our Solution: RSS Feed Aggregator Mobile App

## Project Overview

We've created a mobile app using React Native (Expo) that aggregates RSS feeds based on user preferences. The app fetches content from multiple company RSS sources, allows users to personalize their feed experience by selecting companies of interest, and presents content in a clean, organized manner.

### Key Features

- **User Authentication**: Register and login functionality for personalized experiences
- **Company-Based Feed Aggregation**: Users can select up to 3 companies to customize their feed content
- **Sorted Content**: All feeds are automatically sorted by date/time for the most relevant experience
- **Company Filtering**: Users can discover content through company-based navigation
- **RSS Feed Management**: Admin functionality to add, update, or remove feed sources

## Technical Architecture

Our solution consists of:

1. **Backend API**: Node.js/Express server with MongoDB database
   - RESTful API for user management, feed aggregation, and preference-based content delivery
   - RSS feed fetching and processing via Axios
   - Data storage using MongoDB (users, preferences, feed sources)

2. **Mobile App**: React Native (Expo) frontend
   - Clean, intuitive UI for browsing feed content
   - Authentication flows for personalization
   - Company preference management interface
   - Article viewing and interaction features

## API Documentation

Our backend provides a comprehensive set of RESTful APIs:

### Main API Endpoints

- **User Management**:
  - `POST /api/users/register` - Create new user account
  - `POST /api/users/login` - Authenticate user
  - `GET/PUT /api/users/:userId/preferences` - Get/update user company preferences

- **Feed Consumption**:
  - `GET /api/news` - Get all feeds (with sorting options)
  - `GET /api/news/personalized?userId=<id>` - Get personalized feeds based on user company preferences
  - `GET /api/news/categories` - Get available companies with feeds

- **Feed Management**:
  - `GET /api/feeds` - List all feed sources
  - `POST /api/feeds` - Add new company feed source 
  - `PUT/DELETE /api/feeds/:id` - Update/remove feed source

For detailed API documentation with request/response examples, see the [Backend README](./backend/README.md).

## Installation and Setup

### Backend Server

Navigate to the `backend` directory and follow these steps:

1. Install dependencies: `npm install`
2. Create a `.env` file with configuration:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/NewsFeed
   ```
3. Run the development server: `npm run dev`
4. Seed initial feed sources: `node scripts/seedFeeds.js`

### Mobile App

Navigate to the `app` directory and follow these steps:

1. Install dependencies: `npm install`
2. Update the API endpoint in `app/config.js` to point to your backend server
3. Start the Expo development server: `npm start`
4. Scan the QR code with Expo Go app or run in a simulator

## Challenge Objectives Met

- **RSS Feed Integration**: We implemented a system that aggregates multiple RSS feeds and presents them in a unified interface
- **Role-Based Access**: Users can customize their feed experience through company preferences, effectively creating personalized content access
- **Notification Functionality**: Planned for future implementation - would use Firebase Cloud Messaging for push notifications on new content

---

## Examples:

#### RSS Feed APIs Examples:

1. **RSS2JSON API**  
   - **Description:** Converts RSS feeds into JSON format for easier parsing and integration into your app.  
   - **Link:** [rss2json.com](https://rss2json.com/)  

2. **Superfeedr**  
   - **Description:** A real-time feed API that processes, normalizes, and pushes updates from RSS/Atom feeds.  
   - **Link:** [superfeedr.com](https://superfeedr.com/)  

3. **RSSBridge**  
   - **Description:** An open-source PHP project that acts as an API to generate RSS feeds for websites lacking native RSS support.  
   - **Link:** [GitHub - RSS-Bridge](https://github.com/RSS-Bridge/rss-bridge)  

4. **NewsCatcher API**  
   - **Description:** Primarily designed for news aggregation, this API provides access to numerous news sources via endpoints similar to RSS feeds.  
   - **Link:** [newscatcherapi.com](https://newscatcherapi.com/)  

5. **Feedity API**  
   - **Description:** Generates RSS feeds from any web page that does not natively offer one, making it a useful tool for content aggregation.  
   - **Link:** [feedity.com](https://feedity.com/)  

6. **RapidAPI RSS Parser Options**  
   - **Description:** A collection of RSS parsing APIs available on the RapidAPI marketplace that can convert RSS feeds to JSON and provide enhanced parsing capabilities.  
   - **Link:** [RapidAPI](https://rapidapi.com/search/rss%20parser)  

#### Similar Apps Examples:

- [**Feedly**](https://apps.apple.com/us/app/feedly-smart-news-reader/id396069556)
- [**Inoreader**](https://play.google.com/store/apps/details?id=com.innologica.inoreader&hl=en_US&pli=1)


