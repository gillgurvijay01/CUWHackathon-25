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
} from "react-native";
import moment from "moment";
import Icon from "react-native-vector-icons/Ionicons"; // Make sure this is installed

export const NewsArticleDetail = ({ article, onGoBack }) => {
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this article: ${article?.title}`,
        url: article?.url,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Icon name="share-social-outline" size={22} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        {/* Article Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.category}>{article?.source?.name}</Text>
          <Text style={styles.title}>{article?.title}</Text>

          <View style={styles.authorContainer}>
            <View style={styles.authorImageContainer}>
              <Text style={styles.authorInitial}>
                {article?.authors[0]?.name[0] || "A"}
              </Text>
            </View>
            <View>
              <Text style={styles.author}>
                {article?.authors[0]?.name || "Unknown Author"}
              </Text>
              <Text style={styles.timestamp}>
                {moment(article?.publishedAt).format("MMM DD, YYYY • HH:mm")}
              </Text>
            </View>
          </View>

          <Image
            source={{
              uri: article?.image ?? "https://picsum.photos/800",
              cache: "force-cache",
            }}
            style={styles.image}
            resizeMode="cover"
          />

          <Text style={styles.description}>{article?.content_text}</Text>
          <Text style={styles.content}>{article?.content}</Text>
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
  shareButton: {
    padding: 8,
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
  description: {
    fontSize: 17,
    fontWeight: "500",
    color: "#333",
    lineHeight: 26,
    marginBottom: 16,
  },
  content: {
    fontSize: 16,
    color: "#444",
    lineHeight: 24,
  },
});
