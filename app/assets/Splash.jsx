import { StyleSheet, View, Text } from "react-native";
export function SplashScreen() {
  return (
    <View style={styles.splashContainer}>
      <Text style={styles.splashText}>Welcome to Aurora NewsFeed App</Text>
      <Text style={styles.smallText}>Build by Team CUW</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: "#007BFF",
    alignItems: "center",
    justifyContent: "center",
  },
  splashText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  smallText: {
    fontSize: 16,
    color: "#fff",
    marginTop: 10,
  },
});
