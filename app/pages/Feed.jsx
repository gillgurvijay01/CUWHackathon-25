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
} from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import uuid from "react-native-uuid";
import { nodeUrl } from "../config/GlobalConfig";

// Import for NewsArticleDetail component
import { NewsArticleDetail } from "../Components/NewsArticle";
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
  const responseListener = useRef();
  const [data, setData] = useState([]); // Flat list data
  const [page, setPage] = useState(1); // Pagination
  const [hasMore, setHasMore] = useState(true); // If more data to fetch
  const [loading, setLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false); // For bottom loader
  const [selectedArticle, setSelectedArticle] = useState(null);

  const fetchData = async (pageNumber = 1) => {
    try {
      if (pageNumber === 1) setLoading(true);
      else setIsFetchingMore(true);

      const response = await fetch(`${nodeUrl}/news?page=${pageNumber}`);
      const json = await response.json();

      // Adjust this depending on your API response structure
      const newItems = json.items || [];
      setData((prev) => (pageNumber === 1 ? newItems : [...prev, ...newItems]));
      setHasMore(newItems.length > 0); // if no items returned, stop fetching
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  const loadMore = () => {
    if (!isFetchingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage);
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

    fetchData(1);

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const handleArticlePress = (article) => {
    setSelectedArticle(article);
  };

  const handleGoBack = () => {
    setSelectedArticle(null);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleArticlePress(item)}>
      <View style={styles.itemContainer}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDate}>
          Published: {new Date(item.date_published).toLocaleDateString()}
        </Text>
        <Text style={styles.itemAuthor}>
          Author: {item.authors[0]?.name || "N/A"}
        </Text>
        {item.image && (
          <Image
            source={{ uri: item.image }}
            style={styles.itemImage}
            resizeMode="cover"
          />
        )}
        <Text style={styles.itemCategories}>
          Categories: {item.categories?.join(", ") || "None"}
        </Text>
      </View>
    </TouchableOpacity>
  );
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

  return (
    <View style={styles.container}>
      {selectedArticle ? (
        <NewsArticleDetail article={selectedArticle} onGoBack={handleGoBack} />
      ) : (
        <>
          <Text style={styles.header}>Top Feed in last 10 days</Text>

          <View style={{ marginBottom: 10, alignItems: "center" }}>
            <Button
              title="Reload Feed"
              onPress={() => {
                setPage(1);
                fetchData(1);
              }}
              color="#1a73e8"
            />
          </View>

          <View style={styles.contentContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1a73e8" />
              </View>
            ) : (
              <FlatList
                data={data}
                renderItem={renderItem}
                keyExtractor={() => uuid.v4()}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                  isFetchingMore ? (
                    <Text style={{ textAlign: "center" }}>Loading more...</Text>
                  ) : null
                }
              />
            )}
          </View>

          <View style={styles.footer}>
            <Text>Your Expo Push Token:</Text>
            <Text selectable>{expoPushToken}</Text>
            <Button
              title="Send Test Notification"
              onPress={sendTestNotification}
            />
            <Button
              title="Send Random Article Notification"
              onPress={sendRandomArticleNotification}
            />
          </View>
        </>
      )}
    </View>
  );
};
export default Feed;
// Rest of your code (styles and functions) remains unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingHorizontal: 12,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: -10,
    color: "#2c3e50",
    letterSpacing: 0.5,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 10,
    color: "#2c3e50",
    lineHeight: 24,
  },
  itemDate: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 4,
    fontWeight: "500",
  },
  itemAuthor: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 12,
    fontWeight: "500",
  },
  itemImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 12,
  },
  itemCategories: {
    fontSize: 13,
    color: "#7f8c8d",
    fontStyle: "italic",
    marginTop: 6,
  },
  footer: {
    padding: 18,
    backgroundColor: "#e8eef7",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#d4e0f7",
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 15,
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
