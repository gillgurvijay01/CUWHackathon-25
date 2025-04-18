import React, { useState, useEffect } from "react";
import { getToken } from "../auth/auth";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";

const { nodeUrl } = require("./../config/GlobalConfig"); // Import the baseURL from config

const Settings = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [availablePreferences, setAvailablePreferences] = useState([]);
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [originalPreferences, setOriginalPreferences] = useState([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      if (!token) {
        Alert.alert("Error", "You need to be logged in to view settings");
        return;
      }
      
      const userData = JSON.parse(token);
      setUser(userData);
      
      // Ensure preferences are properly formatted and filter out null values
      const preferences = userData.preferences || [];
      const validPreferences = Array.isArray(preferences) 
        ? preferences.filter(pref => pref !== null && pref !== undefined) 
        : [];
      
      setOriginalPreferences(validPreferences);
      setSelectedPreferences(validPreferences); // Also set selected preferences
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      Alert.alert("Error", "Failed to load user data");
      setLoading(false);
    }
  };

  const fetchAvailablePreferences = async () => {
    try {
      console.log("Fetching available preferences");
      // Use the news/categories endpoint which returns company names
      const response = await axios.get(`${nodeUrl}/news/categories`);
      
      if (response && response.data) {
        console.log("Response from news/categories:", response.data);
        
        // Handle response structure from news/categories
        let companies = [];
        
        if (response.data.companies && Array.isArray(response.data.companies)) {
          companies = response.data.companies;
          console.log("Found companies:", companies);
        } else {
          console.warn("Unexpected API response format:", response.data);
          companies = [];
        }
        
        // Convert company names to preference objects
        const safePreferences = companies.map((companyName, index) => {
          if (!companyName) return null;
          
          return {
            id: companyName,  
            name: companyName 
          };
        }).filter(pref => pref !== null);
        
        console.log("Available preferences:", safePreferences);
        setAvailablePreferences(safePreferences);
      } else {
        console.error("Invalid API response:", response);
        setAvailablePreferences([]);
        Alert.alert("Error", "Invalid response from server");
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
      setAvailablePreferences([]);
      Alert.alert("Error", "Failed to load preferences options");
    }
  };

  const togglePreferenceEdit = async () => {
    if (!editingPreferences) {
      await fetchAvailablePreferences();
    }
    setEditingPreferences(!editingPreferences);
  };

  const togglePreference = (preference) => {
    if (!preference || !preference.id) {
      console.error("Invalid preference object", preference);
      return;
    }
    

    const isSelected = selectedPreferences.some(
      (p) => p && p.id && p.id === preference.id
    );
    
    if (isSelected) {
      setSelectedPreferences(
        selectedPreferences.filter((p) => p && p.id !== preference.id)
      );
    } else {
      // Ensure max 3 preferences
      if (selectedPreferences.length < 3) {
        setSelectedPreferences([...selectedPreferences, preference]);
      } else {
        Alert.alert(
          "Limit Reached",
          "You can select a maximum of 3 preferences"
        );
      }
    }
  };

  const savePreferences = async () => {
    // Validate at least 1 preference selected
    if (selectedPreferences.length === 0) {
      Alert.alert("Error", "Please select at least 1 preference");
      return;
    }

    Alert.alert(
      "Confirm Changes",
      "Are you sure you want to update your preferences?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              setLoading(true);
              const token = await getToken();
              
              if (!user || !user.id) {
                throw new Error("User ID not found");
              }

              const validPreferences = selectedPreferences
                .filter(p => p && p.id)
                .map(p => p.id);
              
              console.log("Saving preferences:", validPreferences);

              // Update preferences on the server
              await axios.put(`${nodeUrl}/users/${user.id}/preferences`, {
                preferences: validPreferences,
              });
              
              console.log("Preferences updated on server successfully");

              // Update the local user data in AsyncStorage
              try {
                const userData = JSON.parse(token);
                userData.preferences = validPreferences; // Save just the IDs (company names) for better compatibility
                await AsyncStorage.setItem('@user_token', JSON.stringify(userData));
                console.log("Preferences saved to local storage:", userData.preferences);
                
                // Update local state
                setUser(userData);
              } catch (storageError) {
                console.error("Failed to update local preferences:", storageError);
                // Continue anyway since server update was successful
              }

              setEditingPreferences(false);
              setOriginalPreferences(selectedPreferences);
              Alert.alert("Success", "Your preferences have been updated");
              setLoading(false);
            } catch (error) {
              console.error("Failed to update preferences:", error);
              Alert.alert("Error", "Failed to update preferences");
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const cancelEditing = () => {
    setSelectedPreferences(originalPreferences);
    setEditingPreferences(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8A2BE2" />
        <Text style={styles.loadingText}>Loading your settings...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Ionicons name="settings-outline" size={30} color="#8A2BE2" />
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{
                uri:
                  user?.avatar ||
                  "https://xsgames.co/randomusers/avatar.php?g=male",
              }}
              style={styles.profileImage}
            />
          </View>
          <View style={styles.userInfoContainer}>
            <Text style={styles.username}>{user?.username || "User"}</Text>
            <Text style={styles.email}>{user?.email || "No email found"}</Text>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Preferences</Text>

          {!editingPreferences ? (
            <>
              <View style={styles.preferencesList}>
                {originalPreferences.length > 0 ? (
                  originalPreferences.map((pref, index) => (
                    <View key={pref?.id || index} style={styles.preferenceItem}>
                      <Text style={styles.preferenceText}>
                        {typeof pref === 'string' 
                          ? pref 
                          : (pref?.name || pref?.id || 'Unknown preference')}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noPreferences}>No preferences set</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={togglePreferenceEdit}
              >
                <Text style={styles.actionButtonText}>Change Preferences</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.helperText}>
                Select 1-3 preferences that interest you
              </Text>
              <View style={styles.preferencesGrid}>
                {availablePreferences.map((preference, index) => (
                  <TouchableOpacity
                    key={preference?.id || index}
                    style={[
                      styles.preferenceOption,
                      selectedPreferences.some((p) => p && p.id && p.id === preference?.id) &&
                        styles.selectedPreferenceOption,
                    ]}
                    onPress={() => togglePreference(preference)}
                  >
                    <Text
                      style={[
                        styles.preferenceOptionText,
                        selectedPreferences.some(
                          (p) => p && p.id && p.id === preference?.id
                        ) && styles.selectedPreferenceOptionText,
                      ]}
                    >
                      {preference?.name || 'Unnamed'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={cancelEditing}
                >
                  <Text
                    style={[styles.actionButtonText, styles.cancelButtonText]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={savePreferences}
                  disabled={selectedPreferences.length === 0}
                >
                  <Text style={styles.actionButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8FF",
  },
  scrollContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F8FF",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 10,
    color: "#333",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "#8A2BE2",
  },
  userInfoContainer: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  preferencesList: {
    marginBottom: 16,
  },
  preferenceItem: {
    backgroundColor: "#f0e6ff",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  preferenceText: {
    color: "#8A2BE2",
    fontWeight: "500",
  },
  noPreferences: {
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 10,
  },
  actionButton: {
    backgroundColor: "#8A2BE2",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  helperText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
  preferencesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  preferenceOption: {
    width: "48%",
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  selectedPreferenceOption: {
    backgroundColor: "#8A2BE2",
  },
  preferenceOptionText: {
    color: "#333",
    fontWeight: "500",
  },
  selectedPreferenceOptionText: {
    color: "#fff",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#8A2BE2",
    flex: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    color: "#8A2BE2",
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
  },
});

export default Settings;
