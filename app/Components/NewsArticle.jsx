import React from "react";
import {
  ScrollView,
  Image,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Share,
  Linking,
  Alert,
} from "react-native";
import moment from "moment";
import Icon from "react-native-vector-icons/Ionicons"; // Make sure this is installed
import AsyncStorage from "@react-native-async-storage/async-storage";

export const NewsArticleDetail = ({ article, onGoBack }) => {
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  
  // Function to get the author name
  const getAuthorName = () => {
    if (article?.authors && Array.isArray(article.authors) && article.authors.length > 0) {
      const author = article.authors[0];
      if (author && typeof author === 'object' && author.name) {
        return author.name;
      }
      if (typeof author === 'string') {
        return author;
      }
    }
    return article?.source || "Unknown Author";
  };
  
  // Check if article is bookmarked when component mounts
  React.useEffect(() => {
    checkIfBookmarked();
  }, []);
  
  // Check if the article is bookmarked
  const checkIfBookmarked = async () => {
    try {
      const storedBookmarks = await AsyncStorage.getItem('@bookmarked_articles');
      if (storedBookmarks) {
        const bookmarks = JSON.parse(storedBookmarks);
        const articleId = article?.id || article?.guid;
        setIsBookmarked(bookmarks.includes(articleId));
      }
    } catch (error) {
      console.error("Error checking bookmarks:", error);
    }
  };
  
  // Toggle bookmark status
  const toggleBookmark = async () => {
    try {
      const articleId = article?.id || article?.guid;
      if (!articleId) return;
      
      const storedBookmarks = await AsyncStorage.getItem('@bookmarked_articles');
      let bookmarks = storedBookmarks ? JSON.parse(storedBookmarks) : [];
      
      if (isBookmarked) {
        // Remove bookmark
        bookmarks = bookmarks.filter(id => id !== articleId);
      } else {
        // Add bookmark
        bookmarks.push(articleId);
      }
      
      // Save updated bookmarks
      await AsyncStorage.setItem('@bookmarked_articles', JSON.stringify(bookmarks));
      
      // Update state
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };
  
  // Get author initial for avatar
  const getAuthorInitial = () => {
    const authorName = getAuthorName();
    return authorName && authorName.length > 0 ? authorName[0].toUpperCase() : "?";
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    try {
      return moment(dateString).format("MMM DD, YYYY • HH:mm");
    } catch (e) {
      return "Unknown date";
    }
  };
  
  // Open the article URL in browser
  const openArticleUrl = () => {
    const url = article?.url || article?.link;
    if (url) {
      Linking.canOpenURL(url)
        .then(supported => {
          if (supported) {
            Linking.openURL(url);
          } else {
            Alert.alert("Error", "Cannot open this URL");
          }
        })
        .catch(err => {
          console.error("Error opening URL:", err);
          Alert.alert("Error", "Cannot open this URL");
        });
    } else {
      Alert.alert("Error", "No URL available for this article");
    }
  };

  // Share the article
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this article: ${article?.title}`,
        url: article?.url || article?.link,
      });
    } catch (error) {
      console.log(error);
    }
  };

  // Get the content to display
  const getContent = () => {
    // First try content_text (plaintext content)
    if (article?.content_text && article.content_text.trim().length > 0) {
      return article.content_text;
    }
    
    // Then try content (might contain HTML)
    if (article?.content && article.content.trim().length > 0) {
      // Simple HTML tag removal
      return article.content.replace(/<[^>]*>?/gm, '');
    }
    
    // Finally try description as fallback
    if (article?.description && article.description.trim().length > 0) {
      return article.description.replace(/<[^>]*>?/gm, '');
    }
    
    return "No content available for this article.";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={toggleBookmark} style={styles.headerButton}>
            <Text style={styles.bookmarkIcon}>
              {isBookmarked ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Icon name="share-social-outline" size={22} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container}>
        {/* Article Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.category}>{article?.source || "News"}</Text>
          <Text style={styles.title}>{article?.title}</Text>

          <View style={styles.authorContainer}>
            <View style={styles.authorImageContainer}>
              <Text style={styles.authorInitial}>{getAuthorInitial()}</Text>
            </View>
            <View>
              <Text style={styles.author}>{getAuthorName()}</Text>
              <Text style={styles.timestamp}>
                {formatDate(article?.date_published)}
              </Text>
            </View>
          </View>

          {article?.image && (
            <Image
              source={{
                uri: article.image,
                cache: "force-cache",
              }}
              style={styles.image}
              resizeMode="cover"
            />
          )}

          <Text style={styles.content}>{getContent()}</Text>
          
          {/* Read more button */}
          {(article?.url || article?.link) && (
            <TouchableOpacity style={styles.readMoreButton} onPress={openArticleUrl}>
              <Text style={styles.readMoreText}>Read Full Article</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  bookmarkIcon: {
    fontSize: 22,
    color: "#333",
  },
  contentContainer: {
    padding: 16,
  },
  category: {
    color: "#3b82f6",
    fontWeight: "600",
    marginBottom: 8,
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111",
    lineHeight: 32,
    marginBottom: 16,
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  authorImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  authorInitial: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  author: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  timestamp: {
    fontSize: 13,
    color: "#666",
  },
  image: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    marginBottom: 16,
  },
  content: {
    fontSize: 16,
    color: "#444",
    lineHeight: 24,
    marginBottom: 20,
  },
  readMoreButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  readMoreText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
