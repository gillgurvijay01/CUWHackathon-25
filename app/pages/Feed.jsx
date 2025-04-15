import React, { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, StyleSheet, Button, Image } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import uuid from "react-native-uuid";
import NewsArticle from "../Components/NewsArticle";
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
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const response = await fetch(
        "https://rss.app/feeds/v1.1/hyApoiRn3WYZEzgw.json"
      );
      const json = await response.json();
      setData(json);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    registerForPushNotificationsAsync().then((token) =>
      setExpoPushToken(token)
    );

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
      });
    fetchData();
    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);
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

  const sendRandomArticleNotification = async () => {
    if (data.items && data.items.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.items.length);
      const randomArticle = data.items[randomIndex];

      await Notifications.scheduleNotificationAsync({
        content: {
          title: randomArticle.title || "New Article",
          body: randomArticle.summary || "Check out this article!",
          data: { url: randomArticle.link },
        },
        trigger: { seconds: 2 },
      });
    } else {
      alert("No articles available to send as a notification.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>This is feed screen</Text>
      <FlatList
        data={data.items}
        renderItem={renderItem}
        keyExtractor={() => uuid.v4()}
      />
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#fff",
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: "#ccc",
          alignItems: "center",
        }}
      >
        <Text>Your Expo Push Token:</Text>
        <Text selectable>{expoPushToken}</Text>
        <Button title="Send Test Notification" onPress={sendTestNotification} />
        <Button
          title="Send Random Article Notification"
          onPress={sendRandomArticleNotification}
        />
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9f9f9",
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#333",
  },
  itemContainer: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a73e8",
    marginBottom: 8,
  },
  itemDate: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  itemAuthor: {
    fontSize: 14,
    color: "#777",
    marginBottom: 8,
  },
  itemImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemCategories: {
    fontSize: 14,
    color: "#888",
    fontStyle: "italic",
  },
});
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
