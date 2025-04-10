import moment from "moment";
import React from "react";
import { Image, Text, TouchableOpacity, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";

export const NewsArticle = ({ post }) => {
  return (
    <TouchableOpacity activeOpacity={1} style={styles.container}>
      <Image
        source={{
          uri: post?.urlToImage ?? "https://picsum.photos/800",
          cache: "force-cache",
        }}
        resizeMode={"cover"}
        style={styles.image}
      />
      <LinearGradient
        colors={["#0000", "#000A", "#000"]}
        style={styles.titleContainer}
      >
        <Text style={styles.text}>{post?.title}</Text>
        <Text style={styles.timestamp}>
          {moment(post?.publishedAt).format("HH:MM DD, MMMM")}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 10,
    borderRadius: 10,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 200,
  },
  titleContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: "flex-start",
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  timestamp: {
    color: "#fff",
    fontSize: 12,
  },
});
