import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Button,
  Image,
  ActivityIndicator,
} from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import uuid from "react-native-uuid";
import { nodeUrl } from "../config/GlobalConfig";
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

  const renderItem = ({ item }) => (
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
  );

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.header}>This is feed screen</Text>

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

        <View style={styles.contentContainer}></View>
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
        <Button title="Send Test Notification" onPress={sendTestNotification} />
        <Button
          title="Send Random Article Notification"
          onPress={sendRandomArticleNotification}
        />
      </View>
    </>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f0f2f5",
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginVertical: 20,
    textAlign: "center",
    color: "#1a73e8",
    letterSpacing: 0.5,
  },
  contentContainer: {
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  footer: {
    padding: 16,
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eaeaea",
  },
  itemContainer: {
    padding: 18,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  itemTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 10,
    lineHeight: 26,
  },
  itemDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
    fontWeight: "500",
  },
  itemAuthor: {
    fontSize: 14,
    color: "#5a6b7b",
    marginBottom: 12,
    fontWeight: "500",
  },
  itemImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: "#e1e4e8",
  },
  itemCategories: {
    fontSize: 13,
    color: "#777",
    fontStyle: "italic",
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
});
const sendTestNotification = async () => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Test Notification 📬",
      body: "Hello from your Expo app!",
      data: { testData: "123" },
    },
    trigger: { seconds: 2 },
  });
};
const sendRandomArticleNotification = async () => {
  if (data && data.length > 0) {
    const randomIndex = Math.floor(Math.random() * data.length);
    const randomArticle = data[randomIndex];

    console.log("Random article picked for notification:", randomArticle);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: randomArticle.title || "New Article",
        body: randomArticle.summary || "Check out this article!",
        data: { url: randomArticle.link || "" },
      },
      trigger: { seconds: 2 },
    });
  } else {
    alert("No articles available to send as a notification.");
  }
};

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Failed to get push token!");
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("Expo Push Token:", token);
  } else {
    alert("Push notifications require a physical device");
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}
export default Feed;
