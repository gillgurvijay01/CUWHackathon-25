import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Button,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import uuid from "react-native-uuid";
import { nodeUrl } from "../config/GlobalConfig";
import { SafeAreaView } from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken } from "../auth/auth";

// Import for NewsArticleDetail component
import { NewsArticleDetail } from "../Components/NewsArticle";
import { removeToken as logout } from "../auth/auth";
import {
  createStaticNavigation,
  useNavigation,
} from "@react-navigation/native";
import Toast from "react-native-toast-message";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const Feed = () => {
  const [expoPushToken, setExpoPushToken] = useState("");
  const notificationListener = useRef();
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("articles");
  const [userPreferences, setUserPreferences] = useState([]);
  const [bookmarks, setBookmarks] = useState([]); // Store bookmarked articles

  const responseListener = useRef();
  const [data, setData] = useState([]); // All news data
  const [filteredData, setFilteredData] = useState([]); // Filtered news based on preferences
  const [bookmarkedData, setBookmarkedData] = useState([]); // Bookmarked articles
  const [page, setPage] = useState(1); // Pagination
  const [hasMore, setHasMore] = useState(true); // If more data to fetch
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false); // For bottom loader
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [refreshing, setRefreshing] = useState(false); // For pull-to-refresh

  // Constants for bookmark storage
  const BOOKMARK_STORAGE_KEY = 'bookmarks';

  const fetchUserPreferences = async () => {
    try {
      const token = await getToken();
      if (token) {
        try {
          const userData = JSON.parse(token);
          
          const preferences = Array.isArray(userData.preferences) ? userData.preferences : [];

          const validPreferences = preferences.filter(pref => pref !== null && pref !== undefined);
          
          setUserPreferences(validPreferences);
        } catch (parseError) {
          console.error("Error parsing user data:", parseError);
          setUserPreferences([]);
        }
      } else {
        setUserPreferences([]);
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      setUserPreferences([]);
    }
  };

  const filterPostsByPreferences = (posts, preferences) => {
    if (!preferences || preferences.length === 0 || !posts || posts.length === 0) {
      return [];
    }

    console.log("=== FILTERING POSTS BY PREFERENCES ===");
    console.log(`Posts: ${posts.length}, Preferences: ${preferences.length}`);
    console.log("Preferences:", JSON.stringify(preferences));
    
    // First, normalize the preference values for easy comparison
    const normalizedPreferences = preferences.map(pref => {
      if (!pref) return null;
      
      // Convert preference to string if it's an object
      if (typeof pref === 'object') {
        return (pref.name || pref.id || '').toLowerCase();
      }
      
      // If it's already a string
      return String(pref).toLowerCase();
    }).filter(p => p !== null);
    
    console.log("Normalized preferences:", JSON.stringify(normalizedPreferences));

    if (posts.length > 0) {
      console.log("Sample post sources:", JSON.stringify(posts.slice(0, 3).map(p => p.source)));
    }
    
    const filtered = posts.filter(post => {
      // Skip invalid posts
      if (!post) return false;

      if (post.source) {
        const postSource = post.source.toLowerCase();

        if (posts.indexOf(post) < 3) {
          console.log(`Checking source match for: "${postSource}"`);
          normalizedPreferences.forEach(pref => {
            const isMatch = postSource.includes(pref);
            console.log(`  - "${pref}": ${isMatch ? 'MATCH' : 'no match'}`);
          });
        }
  
        const sourceMatches = normalizedPreferences.some(pref => 
          postSource.includes(pref) || pref.includes(postSource)
        );
        
        if (sourceMatches) return true;
      }
      
      const matchesCategory = post.categories ? post.categories.some(category => 
        normalizedPreferences.some(pref => 
          category.toLowerCase().includes(pref) || pref.includes(category.toLowerCase())
        )
      ) : false;
      
      // Check if title or content contains preference keywords
      const matchesContent = normalizedPreferences.some(pref => 
        (post.title && post.title.toLowerCase().includes(pref)) ||
        (post.content_text && post.content_text.toLowerCase().includes(pref)) ||
        (post.content && post.content.toLowerCase().includes(pref))
      );
      
      return matchesCategory || matchesContent;
    });
    
    console.log(`Filtered result: ${filtered.length} posts matched preferences`);
    
    return filtered;
  };

 
  const fetchData = async (pageNumber = 1, refreshCache = false) => {
    try {
      if (pageNumber === 1) {
        if (!refreshing) setLoading(true);
      } else {
        setIsFetchingMore(true);
      }

      // Clear cache if refreshing
      if (refreshCache) {
        await clearNewsCache();
      }

      // Add sort=desc parameter to ensure consistent sorting by date
      const response = await fetch(`${nodeUrl}/news?page=${pageNumber}&sort=desc&no_shuffle=true`);
      const json = await response.json();

      // DEBUG CODE : Log user preferences and sources information
      if (pageNumber === 1) {
        console.log("=== USER PREFERENCES ===");
        console.log(JSON.stringify(userPreferences));
        
        // Get available sources for comparison
        try {
          const sourcesResponse = await fetch(`${nodeUrl}/news/categories`);
          const sourcesJson = await sourcesResponse.json();
          console.log("=== AVAILABLE COMPANIES ===");
          console.log(JSON.stringify(sourcesJson.companies || []));
        } catch (error) {
          console.error("Failed to fetch available companies:", error);
        }
        
        console.log("=== API RESPONSE STRUCTURE ===");
        console.log("Response keys:", Object.keys(json));
        
        if (json.success) {
          console.log("Success:", json.success);
          console.log("Total count:", json.count);
          console.log("Page:", json.page);
          console.log("Total pages:", json.totalPages);
        }
        
        // Extract and count data by source
        let extractedItems = [];
        
        // Flexibly handle different response structures
        if (json.data && Array.isArray(json.data)) {
          console.log("Data found in 'data' field");
          extractedItems = json.data;
        } else if (json.items && Array.isArray(json.items)) {
          console.log("Data found in 'items' field");
          extractedItems = json.items;
        } else {
          // Try to find an array in the response
          for (const key in json) {
            if (Array.isArray(json[key]) && json[key].length > 0) {
              console.log(`Data found in '${key}' field`);
              extractedItems = json[key];
              break;
            }
          }
        }
        
        const sources = {};
        // Count items by source
        extractedItems.forEach(item => {
          const source = item.source || "Unknown";
          sources[source] = (sources[source] || 0) + 1;
        });
        
        console.log("=== NEWS SOURCES RECEIVED ===");
        console.log(JSON.stringify(sources));
        console.log(`Total items: ${extractedItems.length}`);
        
        // Check for specific companies
        const companiesOfInterest = ["Aurora WDC", "CUW News", "Tesla"];
        companiesOfInterest.forEach(company => {
          const count = sources[company] || 0;
          console.log(`${company}: ${count} items`);
          
          // If no items, show first few items to debug
          if (count === 0 && extractedItems.length > 0) {
            console.log("Sample source names:", JSON.stringify(extractedItems.slice(0, 5).map(i => i.source)));
          }
        });
      }

      // Extract items from the response based on the structure we get from the API
      let newItems = [];
      
      // Check for both possible structures to make it flexible
      if (json.data && Array.isArray(json.data)) {
        newItems = json.data;
      } else if (json.items && Array.isArray(json.items)) {
        newItems = json.items;
      } else {
        // Try to find an array in the response
        for (const key in json) {
          if (Array.isArray(json[key]) && json[key].length > 0) {
            newItems = json[key];
            break;
          }
        }
        
        if (newItems.length === 0) {
          console.error("Unexpected API response structure:", Object.keys(json));
          console.log("API response:", JSON.stringify(json));
        }
      }
      
      console.log(`Extracted ${newItems.length} items from the API response`);
      
      // Ensure that each item has all the required properties to prevent errors
      const safeItems = newItems.map(item => {
        // Log sample items to see their structure
        if (newItems.indexOf(item) < 2) {
          console.log('Sample item structure:', JSON.stringify(item));
        }
        
        return {
          ...item,
          id: item.id || item.guid || `item-${Math.random()}`, // Ensure each item has an ID
          title: item.title || 'Untitled',
          date_published: item.date_published || item.published || item.pubDate || new Date().toISOString(),
          url: item.url || item.link || '', // Ensure we capture the article URL
          authors: Array.isArray(item.authors) ? item.authors : 
                   (item.author ? [{ name: item.author }] : []), // Normalize authors format
          categories: Array.isArray(item.categories) ? item.categories : [],
          source: item.source || 'Unknown',
          content_text: item.content_text || item.description || item.content || ''
        };
      });
      
      // Always re-sort items by date (newest first) to ensure consistent ordering
      const sortedItems = [...safeItems].sort((a, b) => {
        const dateA = new Date(a.date_published || 0);
        const dateB = new Date(b.date_published || 0);
        return dateB - dateA; // descending order (newest first)
      });
      
      if (pageNumber === 1) {
        setData(sortedItems);
      } else {
        // Merge with existing data and re-sort to ensure proper order
        const mergedData = [...data, ...sortedItems];
        const uniqueData = removeDuplicateItems(mergedData);
        
        // Re-sort the merged data by date
        const sortedMergedData = uniqueData.sort((a, b) => {
          const dateA = new Date(a.date_published || 0);
          const dateB = new Date(b.date_published || 0);
          return dateB - dateA;
        });
        
        setData(sortedMergedData);
      }
      
      setHasMore(sortedItems.length > 0); // if no items returned, stop fetching
      
      // Cache the fetched data
      if (pageNumber === 1) {
        await cacheNewsData(sortedItems);
      }
      
      // Apply filtering based on active tab
      if (activeTab === 'preferred') {
        const filtered = filterPostsByPreferences(
          pageNumber === 1 ? sortedItems : data, 
          userPreferences
        );
        setFilteredData(filtered);
      }
      
    } catch (error) {
      console.error("Error fetching news data:", error);
      // If fetch fails and it's the first page, try to load from cache
      if (pageNumber === 1) {
        await loadFromCache();
      }
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
      setRefreshing(false);
    }
  };

  /**
   * Removes duplicate items from an array based on id
   * @param {Array} items - Array of items to check for duplicates
   * @returns {Array} - Array without duplicates
   */
  const removeDuplicateItems = (items) => {
    const uniqueIds = new Set();
    return items.filter(item => {
      const isDuplicate = uniqueIds.has(item.id);
      uniqueIds.add(item.id);
      return !isDuplicate;
    });
  };

  /**
   * Caches the news data for offline access
   * @param {Array} newsItems - The news items to cache
   */
  const cacheNewsData = async (newsItems) => {
    try {
      if (newsItems && newsItems.length > 0) {
        const cacheData = {
          timestamp: new Date().getTime(),
          data: newsItems
        };
        await AsyncStorage.setItem('cached_news', JSON.stringify(cacheData));
      }
    } catch (error) {
      console.error("Error caching news data:", error);
    }
  };


  const loadFromCache = async () => {
    try {
      const cachedData = await AsyncStorage.getItem('cached_news');
      if (cachedData) {
        const { data: cachedItems, timestamp } = JSON.parse(cachedData);
        
        // Only use cache if it's less than 1 hour old
        const cacheAge = new Date().getTime() - timestamp;
        const ONE_HOUR = 60 * 60 * 1000;
        
        if (cacheAge < ONE_HOUR && cachedItems.length > 0) {
          console.log(`Loading ${cachedItems.length} items from cache`);
          
          // Ensure items have all required properties
          const safeItems = cachedItems.map(item => ({
            ...item,
            id: item.id || item.guid || `item-${Math.random()}`,
            title: item.title || 'Untitled',
            date_published: item.date_published || new Date().toISOString(),
            authors: Array.isArray(item.authors) ? item.authors : [],
            categories: Array.isArray(item.categories) ? item.categories : [],
            source: item.source || 'Unknown'
          }));
          
          // Sort cached items by date (newest first)
          const sortedCachedItems = [...safeItems].sort((a, b) => {
            const dateA = new Date(a.date_published || 0);
            const dateB = new Date(b.date_published || 0);
            return dateB - dateA; // descending order (newest first)
          });
          
          setData(sortedCachedItems);
          
          // Apply filtering for preferred tab
          if (activeTab === 'preferred') {
            const filtered = filterPostsByPreferences(sortedCachedItems, userPreferences);
            setFilteredData(filtered);
          }
        } else {
          console.log('Cache is too old or empty, not using it');
        }
      } else {
        console.log('No cached news data found');
      }
    } catch (error) {
      console.error("Error loading from cache:", error);
    }
  };

  
  const clearNewsCache = async () => {
    try {
      await AsyncStorage.removeItem('cached_news');
    } catch (error) {
      console.error("Error clearing news cache:", error);
    }
  };

 
  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchData(1, true); // Pass true to indicate cache refresh
  };

  const loadMore = () => {
    if (!isFetchingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage);
    }
  };

  /**
   * Switch between tabs (All/Preferred/Bookmarks)
   * @param {string} tab - The tab to switch to ('all', 'preferred', or 'bookmarks')
   */
  const switchTab = (tab) => {
    if (tab === activeTab) return;
    
    setActiveTab(tab);
    
    if (tab === 'preferred') {
      // Apply filtering when switching to preferred tab
      const filtered = filterPostsByPreferences(data, userPreferences);
      setFilteredData(filtered);
    } else if (tab === 'bookmarks') {
      // When switching to bookmarks tab, make sure we have updated bookmark data
      if (data.length > 0) {
        const bookmarkedItems = data.filter(item => 
          bookmarks.includes(item.id || item.guid)
        );
        setBookmarkedData(bookmarkedItems);
      }
    }
  };

  useEffect(() => {
    registerForPushNotificationsAsync().then(setExpoPushToken);

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
      });

    fetchUserPreferences();
    loadBookmarks(); // Load bookmarks
    fetchData(1);

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  // Re-filter data when preferences change
  useEffect(() => {
    if (activeTab === 'preferred') {
      const filtered = filterPostsByPreferences(data, userPreferences);
      setFilteredData(filtered);
    }
  }, [userPreferences]);

  // Add this useEffect after the other useEffects
  useEffect(() => {
    // When data changes, update bookmarked data
    if (data.length > 0 && bookmarks.length > 0) {
      const bookmarkedItems = data.filter(item => 
        bookmarks.includes(item.id || item.guid)
      );
      setBookmarkedData(bookmarkedItems);
      
      // If we're currently on the bookmarks tab, we need to refresh it
      if (activeTab === 'bookmarks') {
        switchTab('bookmarks');
      }
    }
  }, [data, bookmarks]);

  const handleArticlePress = (article) => {
    setSelectedArticle(article);
  };

  const handleGoBack = () => {
    setSelectedArticle(null);
  };

  /**
   * Loads bookmarks from AsyncStorage
   */
  const loadBookmarks = async () => {
    try {
      // Use consistent storage key
      const storedBookmarks = await AsyncStorage.getItem(BOOKMARK_STORAGE_KEY);
      if (storedBookmarks) {
        const parsedBookmarks = JSON.parse(storedBookmarks);
        setBookmarks(parsedBookmarks);
        console.log(`Loaded ${parsedBookmarks.length} bookmarks from storage`);
        
        // If we already have data, filter it to show bookmarks
        if (data.length > 0) {
          const bookmarkedItems = data.filter(item => 
            parsedBookmarks.includes(item.id || item.guid)
          );
          setBookmarkedData(bookmarkedItems);
        }
      } else {
        setBookmarks([]);
        setBookmarkedData([]);
      }
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      setBookmarks([]);
      setBookmarkedData([]);
    }
  };

  /**
   * Saves bookmarks to AsyncStorage
   */
  const saveBookmarks = async (newBookmarks) => {
    try {
      await AsyncStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(newBookmarks));
      console.log(`Saved ${newBookmarks.length} bookmarks to storage`);
    } catch (error) {
      console.error("Error saving bookmarks:", error);
    }
  };

  /**
   * Checks if an article is bookmarked
   * @param {Object} article - The article to check
   * @returns {boolean} - Whether the article is bookmarked
   */
  const isBookmarked = (article) => {
    const articleId = article.id || article.guid;
    return bookmarks.includes(articleId);
  };

  /**
   * Toggles bookmark status for an article
   * @param {Object} article - The article to bookmark/unbookmark
   */
  const handleBookmark = async (article) => {
    const articleId = article.id || article.guid;
    
    try {
      // Check if article is already bookmarked
      const isBookmarked = bookmarks.includes(articleId);
      let updatedBookmarks;
      
      if (isBookmarked) {
        // Remove from bookmarks
        updatedBookmarks = bookmarks.filter(id => id !== articleId);
      } else {
        // Add to bookmarks
        updatedBookmarks = [...bookmarks, articleId];
      }
      
      // Update state
      setBookmarks(updatedBookmarks);
      
      // Save to AsyncStorage using consistent key
      await saveBookmarks(updatedBookmarks);
      
      // Update bookmarked data
      if (data.length > 0) {
        const bookmarkedItems = data.filter(item => 
          updatedBookmarks.includes(item.id || item.guid)
        );
        setBookmarkedData(bookmarkedItems);
      }
      
      // Show feedback to user
      Toast.show({
        type: isBookmarked ? 'info' : 'success',
        text1: isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks',
        position: 'bottom',
      });
    } catch (error) {
      console.error('Error updating bookmarks:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to update bookmarks',
        position: 'bottom',
      });
    }
  };

  const renderItem = ({ item }) => {
    // Format the publication date
    const formatDate = (dateString) => {
      if (!dateString) return 'Unknown date';
      
      try {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
          return 'Today';
        } else if (diffDays === 1) {
          return 'Yesterday';
        } else if (diffDays < 7) {
          return `${diffDays} days ago`;
        } else {
          return date.toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          });
        }
      } catch (e) {
        return 'Unknown date';
      }
    };

    // Get source color based on source name for visual distinction
    const getSourceColor = (source) => {
      if (!source) return '#1a73e8';
      
      const sourceColors = {
        'Google': '#4285F4',
        'Microsoft': '#00A4EF',
        'Meta': '#0668E1',
        'CUW': '#8A2BE2',
        'Concordia': '#8A2BE2',   // Added for CUW
        'Aurora': '#00C853',      // Added for Aurora WDC
        'Tesla': '#E82127',       // Added for Tesla
        'WDC': '#00C853',         // Alternative for Aurora WDC
        'News': '#FF9800'         // Generic fallback
      };
      
      // Check if the source contains any of the keys
      for (const [key, color] of Object.entries(sourceColors)) {
        if (source.toLowerCase().includes(key.toLowerCase())) {
          return color;
        }
      }
      
      return '#1a73e8'; // Default color
    };
    
    // Get a short excerpt from content if available
    const getExcerpt = (content, maxLength = 120) => {
      if (!content) return '';
      
      // Remove HTML tags if present
      const cleanContent = content.replace(/<[^>]*>?/gm, '');
      
      if (cleanContent.length <= maxLength) return cleanContent;
      
      // Find the last space before the maxLength
      const lastSpace = cleanContent.substring(0, maxLength).lastIndexOf(' ');
      return cleanContent.substring(0, lastSpace) + '...';
    };
    
    // Get formatted author name
    const getAuthor = () => {
      // First check if we have authors array with name property
      if (item.authors && Array.isArray(item.authors) && item.authors.length > 0) {
        const author = item.authors[0];
        // Check if author is an object with a name property
        if (author && typeof author === 'object' && author.name) {
          return author.name;
        }
        // Check if author is a string directly
        if (typeof author === 'string') {
          return author;
        }
      }
      
      // Fall back to source name if we couldn't find a proper author
      if (item.source && item.source !== 'Unknown') {
        return item.source;
      }
      
      // Ultimate fallback
      return 'Unknown author';
    };

    return (
      <TouchableOpacity 
        style={styles.articleCardTouchable}
        activeOpacity={0.7} 
        onPress={() => handleArticlePress(item)}
      >
        <View style={[
          styles.itemContainer, 
          { borderLeftColor: getSourceColor(item.source) }
        ]}>
          {/* Source and Date row */}
          <View style={styles.sourceRow}>
            <View style={[styles.sourceBadge, { backgroundColor: getSourceColor(item.source) }]}>
              <Text style={styles.sourceText}>{item.source || 'News'}</Text>
            </View>
            <View style={styles.rightSourceRow}>
              <TouchableOpacity 
                onPress={() => handleBookmark(item)}
                style={styles.bookmarkButton}
              >
                <Text style={styles.bookmarkIcon}>
                  {isBookmarked(item) ? '★' : '☆'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.itemDate}>{formatDate(item.date_published)}</Text>
            </View>
          </View>
          
          {/* Main content layout */}
          <View style={styles.contentLayout}>
            {/* Image section - conditionally rendered */}
          {item.image && (
              <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.image }}
              style={styles.itemImage}
              resizeMode="cover"
            />
              </View>
            )}
            
            {/* Text content section */}
            <View style={styles.textContent}>
              <Text style={styles.itemTitle}>{item.title || 'Untitled'}</Text>
              
              {/* Show excerpt if available */}
              {item.content_text && (
                <Text style={styles.excerptText}>
                  {getExcerpt(item.content_text)}
          </Text>
              )}
              
              {/* Footer info */}
              <View style={styles.articleFooter}>
                <Text style={styles.itemAuthor}>{getAuthor()}</Text>
                
                {/* Categories badges */}
                {item.categories && item.categories.length > 0 && (
                  <View style={styles.categoriesContainer}>
                    {item.categories.slice(0, 2).map((category, index) => (
                      <View key={index} style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{category}</Text>
                      </View>
                    ))}
                    {item.categories.length > 2 && (
                      <Text style={styles.moreCategories}>+{item.categories.length - 2}</Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
  );
  };

  const sendTestNotification = async () => {
    // Array of sample breaking news notifications
    const breakingNews = [
      {
        title: "Breaking News!",
        body: "Major development in global politics. Tap to read more.",
      },
      {
        title: "Weather Alert",
        body: "Unexpected weather changes forecasted for tomorrow.",
      },
      {
        title: "Technology Update",
        body: "Revolutionary new tech product just announced.",
      },
      {
        title: "Sports Flash",
        body: "Championship results in! Surprising outcome in finals.",
      },
      {
        title: "Market Update",
        body: "Significant shifts in the stock market today.",
      },
    ];

    // Select a random news item
    const randomNews =
      breakingNews[Math.floor(Math.random() * breakingNews.length)];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: randomNews.title,
        body: randomNews.body,
        data: { type: "breaking_news" },
      },
      trigger: null, // Send immediately
    });
  };

  const sendRandomArticleNotification = async () => {
    // Using the data from current state
    if (!data || data.length === 0) {
      alert("No articles available to send notification");
      return;
    }

    const randomArticle = data[Math.floor(Math.random() * data.length)];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: randomArticle.title || "Article Recommendation",
        body: randomArticle.authors?.[0]?.name
          ? `By ${randomArticle.authors[0].name}`
          : "Check out this trending article",
        data: { articleId: randomArticle.id },
      },
      trigger: null, // Send immediately
    });
  };

  // Update displayData to include bookmarkedData
  // Determine which data to display based on active tab
  const displayData = activeTab === 'articles' 
    ? data 
    : activeTab === 'preferred' 
      ? filteredData 
      : bookmarkedData;

  return (
    <View style={styles.container}>
      {selectedArticle ? (
        <NewsArticleDetail article={selectedArticle} onGoBack={handleGoBack} />
      ) : (
        <>
          <View style={styles.topBar}>
            <Text style={styles.appTitle}>News Feed</Text>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setMenuVisible(!menuVisible)}
            >
              <Text style={styles.menuIcon}>☰</Text>
            </TouchableOpacity>
          </View>
          
          {/* Dropdown Menu */}
          {menuVisible && (
            <View style={styles.menuContainer}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate("Settings");
                }}
              >
                <Text style={styles.menuItemText}>Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => sendTestNotification()}
              >
                <Text style={styles.menuItemText}>Send Test Notification</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => sendRandomArticleNotification()}
              >
                <Text style={styles.menuItemText}>Send Article Notification</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuItem, styles.logoutMenuItem]}
              onPress={async () => {
                try {
                  await logout();
                    setMenuVisible(false);
                  alert("You have been logged out");
                  navigation.replace("Login");
                } catch (error) {
                  console.error("Logout failed:", error);
                }
              }}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
            </View>
          )}
          
          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'articles' && styles.activeTab
              ]}
              onPress={() => switchTab('articles')}
            >
              <Text 
                style={[
                  styles.tabText,
                  activeTab === 'articles' && styles.activeTabText
                ]}
              >
                Articles
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'preferred' && styles.activeTab
              ]}
              onPress={() => switchTab('preferred')}
            >
              <Text 
                style={[
                  styles.tabText,
                  activeTab === 'preferred' && styles.activeTabText
                ]}
              >
                My Preferences
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'bookmarks' && styles.activeTab
              ]}
              onPress={() => switchTab('bookmarks')}
            >
              <Text 
                style={[
                  styles.tabText,
                  activeTab === 'bookmarks' && styles.activeTabText
                ]}
              >
                Bookmarks
              </Text>
            </TouchableOpacity>
          </View>

          {refreshing && (
            <View style={styles.refreshingIndicator}>
              <Text style={styles.refreshingText}>Refreshing your feed...</Text>
          </View>
          )}

          <View style={styles.contentContainer}>
            {loading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1a73e8" />
                <Text style={styles.loadingText}>Loading your news feed...</Text>
              </View>
            ) : (
              <>
                {/* Debug output for data being displayed */}
                {console.log(`Rendering ${activeTab} news feed - Items: ${displayData.length}`)}
                {console.log(`All data: ${data.length} items, Filtered data: ${filteredData.length} items`)}
                
              <FlatList
                  data={displayData}
                renderItem={renderItem}
                keyExtractor={() => uuid.v4()}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                  ListEmptyComponent={
                    !loading && !refreshing ? (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                          {activeTab === 'preferred' 
                            ? "No articles match your preferences" 
                            : activeTab === 'bookmarks'
                              ? "No bookmarks found"
                              : "No articles found"}
                        </Text>
                        <Text style={styles.emptySubText}>
                          {activeTab === 'preferred'
                            ? "Try adding more preferences in Settings"
                            : activeTab === 'bookmarks'
                              ? "Add bookmarks by tapping the star icon"
                              : "Pull down to refresh"}
                        </Text>
                      </View>
                    ) : null
                  }
                ListFooterComponent={
                  isFetchingMore ? (
                      <View style={styles.loadMoreContainer}>
                        <ActivityIndicator size="small" color="#1a73e8" />
                        <Text style={styles.loadMoreText}>Loading more articles...</Text>
                      </View>
                  ) : null
                }
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      colors={["#1a73e8", "#8A2BE2"]}
                      tintColor="#1a73e8"
                      title="Refreshing news feed..."
                      titleColor="#1a73e8"
                    />
                  }
                />
              </>
            )}
          </View>
        </>
      )}
    </View>
  );
};

export default Feed;

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2c3e50",
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: "#2c3e50",
  },
  menuContainer: {
    position: "absolute",
    top: 60,
    right: 12,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
    width: 200,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemText: {
    fontSize: 16,
    color: "#2c3e50",
  },
  logoutMenuItem: {
    borderBottomWidth: 0,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    marginTop: 5,
  },
  logoutText: {
    color: "#e74c3c",
    fontWeight: "600",
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 15,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#f5f7fa",
  },
  activeTab: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 2,
    borderBottomColor: "#1a73e8",
  },
  tabText: {
    fontSize: 14,
    color: "#7f8c8d",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#1a73e8",
    fontWeight: "600",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingHorizontal: 12,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "500",
  },
  itemContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#1a73e8",
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#2c3e50",
    lineHeight: 24,
  },
  itemDate: {
    fontSize: 14,
    color: "#95a5a6",
    fontWeight: "500",
  },
  itemAuthor: {
    fontSize: 14,
    color: "#7f8c8d",
    fontWeight: "500",
    marginRight: 12,
  },
  itemImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  itemCategories: {
    fontSize: 13,
    color: "#7f8c8d",
    fontStyle: "italic",
    marginTop: 6,
  },
  refreshingIndicator: {
    backgroundColor: "#e8f4ff",
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  refreshingText: {
    color: "#1a73e8",
    fontWeight: "600",
    textAlign: "center",
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#7f8c8d",
    fontStyle: "italic",
  },
  loadMoreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
  },
  loadMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#1a73e8",
  },
  articleCardTouchable: {
    marginHorizontal: 2,
    marginVertical: 4,
  },
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sourceBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  sourceText: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "600",
  },
  contentLayout: {
    flexDirection: "row",
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 16,
  },
  textContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  excerptText: {
    fontSize: 14,
    color: "#7f8c8d",
    marginVertical: 8,
    lineHeight: 20,
  },
  articleFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    flexWrap: "wrap",
  },
  categoriesContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  categoryBadge: {
    backgroundColor: "#f5f7fa",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 4,
  },
  categoryText: {
    fontSize: 12,
    color: "#34495e",
    fontWeight: "500",
  },
  moreCategories: {
    fontSize: 12,
    color: "#7f8c8d",
    fontWeight: "500",
    marginLeft: 4,
  },
  rightSourceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bookmarkButton: {
    padding: 4,
    marginRight: 8,
  },
  bookmarkIcon: {
    fontSize: 18,
    color: "#f39c12",
  },
});

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    alert("Must use physical device for Push Notifications");
  }

  return token;
}
