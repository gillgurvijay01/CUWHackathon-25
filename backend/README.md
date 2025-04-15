# RSS Feed Aggregator API

A backend service for a mobile app that aggregates RSS feeds based on user preferences.

## Features

- User registration and authentication
- User preference management (up to 3 company preferences)
- RSS feed source management (add, update, delete)
- Feed aggregation based on user company preferences
- Feed sorting by publication date
- Feed filtering by companies of interest

## API Endpoints Documentation

### User Management

#### Register a new user
```
POST /api/users/register
```

Request body:
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "preferences": ["Tesla", "Microsoft", "Concordia University Wisconsin"]
}
```

Response:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "6443a89b0c98a2b45e1f8f7a",
    "username": "testuser",
    "email": "test@example.com",
    "preferences": ["Tesla", "Microsoft", "Concordia University Wisconsin"]
  }
}
```

#### Login user
```
POST /api/users/login
```

Request body:
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "message": "Login successful",
  "user": {
    "id": "6443a89b0c98a2b45e1f8f7a",
    "username": "testuser",
    "email": "test@example.com",
    "preferences": ["Tesla", "Microsoft", "Concordia University Wisconsin"]
  }
}
```

#### Get user preferences
```
GET /api/users/:userId/preferences
```

Example: `GET /api/users/6443a89b0c98a2b45e1f8f7a/preferences`

Response:
```json
{
  "preferences": ["Tesla", "Microsoft", "Concordia University Wisconsin"]
}
```

#### Update user preferences
```
PUT /api/users/:userId/preferences
```

Example: `PUT /api/users/6443a89b0c98a2b45e1f8f7a/preferences`

Request body:
```json
{
  "preferences": ["Tesla", "Aurora WDC", "Meta"]
}
```

Response:
```json
{
  "message": "Preferences updated successfully",
  "preferences": ["Tesla", "Aurora WDC", "Meta"]
}
```

### News/Feed Consumption

#### Get all available news (non-personalized)
```
GET /api/news?sort=desc&limit=10
```

Query parameters:
- `sort`: 'asc' or 'desc' (default: 'desc')
- `limit`: Number of items to return (default: 50)

Response:
```json
{
  "count": 10,
  "items": [
    {
      "id": "eac9f665fbf31500a61a40a9be091536",
      "url": "https://www.linkedin.com/feed/update/urn:li:activity:7306269607462330368",
      "title": "We are Tesla",
      "content_text": "We are Tesla...",
      "date_published": "2025-03-14T20:21:41.000Z",
      "source": "Tesla"
    },
    // More items...
  ]
}
```

#### Get personalized news based on user preferences
```
GET /api/news/personalized?userId=6443a89b0c98a2b45e1f8f7a&sort=desc&limit=10
```

Query parameters:
- `userId`: User ID for personalization (required)
- `sort`: 'asc' or 'desc' (default: 'desc')
- `limit`: Number of items to return (default: 50)

Response:
```json
{
  "count": 5,
  "personalized": true,
  "preferences": ["Tesla", "Microsoft", "Concordia University Wisconsin"],
  "items": [
    {
      "id": "eac9f665fbf31500a61a40a9be091536",
      "url": "https://www.linkedin.com/feed/update/urn:li:activity:7306269607462330368",
      "title": "We are Tesla",
      "content_text": "We are Tesla...",
      "date_published": "2025-03-14T20:21:41.000Z",
      "source": "Tesla"
    },
    // More items...
  ]
}
```

#### Get all available companies
```
GET /api/news/categories
```

Response:
```json
{
  "count": 7,
  "companies": [
    "Tesla", 
    "Microsoft", 
    "Google", 
    "Meta", 
    "Concordia University Wisconsin",
    "Aurora Health",
    "Aurora WDC"
  ]
}
```

### Feed Source Management

#### Get all feed sources
```
GET /api/feeds
```

Response:
```json
{
  "count": 7,
  "feeds": [
    {
      "_id": "6443a89b0c98a2b45e1f8f7b",
      "name": "Concordia University Wisconsin",
      "url": "https://rss.app/feeds/v1.1/P5BUAfjaWqot8MAg.json",
      "category": "education",
      "description": "LinkedIn posts from Concordia University Wisconsin",
      "active": true,
      "created_at": "2025-04-11T15:23:07.890Z",
      "updated_at": "2025-04-11T15:23:07.890Z"
    },
    {
      "_id": "6443a89b0c98a2b45e1f8f7c",
      "name": "Tesla",
      "url": "https://rss.app/feeds/v1.1/x9yX21R6rExtxk0W.json",
      "category": "automotive",
      "description": "LinkedIn posts from Tesla",
      "active": true,
      "created_at": "2025-04-11T15:23:07.890Z",
      "updated_at": "2025-04-11T15:23:07.890Z"
    },
    // More feeds...
  ]
}
```

#### Add a new feed source
```
POST /api/feeds
```

Request body:
```json
{
  "name": "NASA",
  "url": "https://rss.app/feeds/v1.1/nasa_example.json",
  "category": "science",
  "description": "Latest space news from NASA"
}
```

Response:
```json
{
  "message": "Feed added successfully",
  "feed": {
    "_id": "6443a89b0c98a2b45e1f8f7d",
    "name": "NASA",
    "url": "https://rss.app/feeds/v1.1/nasa_example.json",
    "category": "science",
    "description": "Latest space news from NASA",
    "active": true,
    "created_at": "2025-04-11T15:30:22.456Z",
    "updated_at": "2025-04-11T15:30:22.456Z"
  }
}
```

#### Update a feed source
```
PUT /api/feeds/:feedId
```

Example: `PUT /api/feeds/6443a89b0c98a2b45e1f8f7d`

Request body:
```json
{
  "name": "NASA Official",
  "active": true,
  "description": "Updated description for NASA feed"
}
```

Response:
```json
{
  "message": "Feed updated successfully",
  "feed": {
    "_id": "6443a89b0c98a2b45e1f8f7d",
    "name": "NASA Official",
    "url": "https://rss.app/feeds/v1.1/nasa_example.json",
    "category": "science",
    "description": "Updated description for NASA feed",
    "active": true,
    "created_at": "2025-04-11T15:30:22.456Z",
    "updated_at": "2025-04-11T15:35:10.123Z"
  }
}
```

#### Delete a feed source
```
DELETE /api/feeds/:feedId
```

Example: `DELETE /api/feeds/6443a89b0c98a2b45e1f8f7d`

Response:
```json
{
  "message": "Feed deleted successfully",
  "feedId": "6443a89b0c98a2b45e1f8f7d"
}
```

#### Test a feed URL
```
POST /api/feeds/test
```

Request body:
```json
{
  "url": "https://rss.app/feeds/v1.1/x9yX21R6rExtxk0W.json"
}
```

Response:
```json
{
  "message": "Valid RSS feed URL",
  "valid": true,
  "sampleData": {
    "title": "Tesla | LinkedIn",
    "itemCount": 10,
    "sampleItems": [
      {
        "id": "eac9f665fbf31500a61a40a9be091536",
        "url": "https://www.linkedin.com/feed/update/urn:li:activity:7306269607462330368",
        "title": "We are Tesla",
        "content_text": "We are Tesla...",
        "date_published": "2025-03-14T20:21:41.000Z"
      },
      // More sample items...
    ]
  }
}
```

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with configuration:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/NewsFeed
   ```

3. Run the development server:
   ```
   npm run dev
   ```

4. Seed initial feed sources:
   ```
   node scripts/seedFeeds.js
   ```

## Feed Format

This API is designed to work with JSON feeds in the format provided by services like rss.app. Example:

```json
{
  "version": "https://jsonfeed.org/version/1.1",
  "title": "Feed Title",
  "items": [
    {
      "id": "unique-id",
      "url": "https://example.com/article",
      "title": "Article Title",
      "content_text": "Article content",
      "content_html": "<p>Article content</p>",
      "date_published": "2023-01-01T12:00:00.000Z",
      "authors": [{"name": "Author Name"}]
    }
  ]
}
```

## Postman Collection

You can import the following Postman collection to quickly test all endpoints:

1. Open Postman
2. Click "Import" > "Raw text/JSON"
3. Paste the following JSON:

```json
{
  "info": {
    "name": "RSS Feed Aggregator API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "User Management",
      "item": [
        {
          "name": "Register User",
          "request": {
            "method": "POST",
            "url": "http://localhost:5000/api/users/register",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"username\": \"testuser\",\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\",\n  \"preferences\": [\"Tesla\", \"Microsoft\", \"Meta\"]\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            }
          }
        },
        {
          "name": "Login User",
          "request": {
            "method": "POST",
            "url": "http://localhost:5000/api/users/login",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            }
          }
        },
        {
          "name": "Get User Preferences",
          "request": {
            "method": "GET",
            "url": "http://localhost:5000/api/users/{{userId}}/preferences"
          }
        },
        {
          "name": "Update User Preferences",
          "request": {
            "method": "PUT",
            "url": "http://localhost:5000/api/users/{{userId}}/preferences",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"preferences\": [\"Tesla\", \"Aurora WDC\", \"Meta\"]\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            }
          }
        }
      ]
    },
    {
      "name": "News/Feed Consumption",
      "item": [
        {
          "name": "Get All News",
          "request": {
            "method": "GET",
            "url": "http://localhost:5000/api/news?sort=desc&limit=10"
          }
        },
        {
          "name": "Get Personalized News",
          "request": {
            "method": "GET",
            "url": "http://localhost:5000/api/news/personalized?userId={{userId}}&sort=desc&limit=10"
          }
        },
        {
          "name": "Get All Companies",
          "request": {
            "method": "GET",
            "url": "http://localhost:5000/api/news/categories"
          }
        }
      ]
    },
    {
      "name": "Feed Management",
      "item": [
        {
          "name": "Get All Feeds",
          "request": {
            "method": "GET",
            "url": "http://localhost:5000/api/feeds"
          }
        },
        {
          "name": "Add New Feed",
          "request": {
            "method": "POST",
            "url": "http://localhost:5000/api/feeds",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"NASA\",\n  \"url\": \"https://rss.app/feeds/v1.1/nasa_example.json\",\n  \"category\": \"science\",\n  \"description\": \"Latest space news from NASA\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            }
          }
        },
        {
          "name": "Update Feed",
          "request": {
            "method": "PUT",
            "url": "http://localhost:5000/api/feeds/{{feedId}}",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"NASA Official\",\n  \"active\": true,\n  \"description\": \"Updated description for NASA feed\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            }
          }
        },
        {
          "name": "Delete Feed",
          "request": {
            "method": "DELETE",
            "url": "http://localhost:5000/api/feeds/{{feedId}}"
          }
        },
        {
          "name": "Test Feed URL",
          "request": {
            "method": "POST",
            "url": "http://localhost:5000/api/feeds/test",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"url\": \"https://rss.app/feeds/v1.1/x9yX21R6rExtxk0W.json\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "userId",
      "value": "user_id_here"
    },
    {
      "key": "feedId",
      "value": "feed_id_here"
    }
  ]
}
```

4. After importing, replace the `{{userId}}` and `{{feedId}}` variables with actual IDs after creating users and feeds

## Dependencies

- Express.js - Web framework
- Mongoose - MongoDB object modeling
- Axios - HTTP client for fetching RSS feeds
- bcryptjs - Password hashing
- dotenv - Environment variable management
- cors - Cross-Origin Resource Sharing