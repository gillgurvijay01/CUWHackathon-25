import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Alert,
} from "react-native";
import { nanoid } from "nanoid";
import {
  createStaticNavigation,
  useNavigation,
} from "@react-navigation/native";
import { nodeUrl } from "../config/GlobalConfig";
import { storeToken } from "../auth/auth";
export default function Login() {
  const navigation = useNavigation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignin = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${nodeUrl}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.status !== 200) {
        Alert.alert("Invalid credentials");
        setLoading(false);
        return;
      }

      const data = await response.json(); // assuming response returns { token, user }

      if (response.status === 200) {
        storeToken(JSON.stringify(data.user)); // Store token in AsyncStorage
        Alert.alert("Success", "Login successful");
        navigation.replace("Feed"); // replace prevents going back to Login
      } else {
        Alert.alert("Error", "Token not received");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Feed Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#aaa"
        value={username}
        onChangeText={(text) => setUsername(text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={(text) => setPassword(text)}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSignin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Logging in Account..." : "Login"}
        </Text>
      </TouchableOpacity>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
          <Text style={styles.footerLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logo: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 40,
    color: "#333",
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#007BFF",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 5,
    marginTop: 20,
  },
  footerText: {
    color: "#666",
    fontSize: 14,
  },
  footerLink: {
    color: "#4B7BEC",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
  },
});
