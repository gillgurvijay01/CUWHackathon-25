import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  createStaticNavigation,
  useNavigation,
} from "@react-navigation/native";
import Login from "./Login";
const Home = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text>Home</Text>
      <Text>Welcome to the Home Screen!</Text>
      <Text onPress={() => navigation.navigate("Login")}>
        Click Here to Go to login.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Home;
