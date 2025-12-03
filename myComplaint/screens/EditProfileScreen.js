import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const FIREBASE_DB = "https://mycomplaint-b2805-default-rtdb.asia-southeast1.firebasedatabase.app";

export default function EditProfileScreen({ navigation }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [staffID, setStaffID] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const id = await AsyncStorage.getItem("staffID");
    setStaffID(id);

    const res = await fetch(`${FIREBASE_DB}/agency_users/${id}.json`);
    const staff = await res.json();

    setName(staff.name);
    setContact(staff.contactNo || "");
  };

  const handleSave = async () => {
    if (!staffID) return;

    const updates = {
      name,
      contactNo: contact,
    };

    const res = await fetch(`${FIREBASE_DB}/agency_users/${staffID}.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (res.ok) {
      await AsyncStorage.setItem("staffName", name);
      Alert.alert("Saved", "Profile updated.");
      navigation.goBack();
    } else {
      Alert.alert("Error", "Failed to update profile.");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#5044ec" />
      </TouchableOpacity>

      <Text style={styles.title}>Edit Profile</Text>

      <TextInput
        style={styles.input}
        placeholder="Staff Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Contact Number"
        value={contact}
        onChangeText={setContact}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 30,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 65,
    left: 30,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5044ec',
    marginBottom: 20,
  },
  profileIconContainer: {
    marginBottom: 60,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 30,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    borderColor: '#cccccca9',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    width: '100%',
    marginBottom: 10,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5044ec',
    paddingVertical: 12,
    paddingHorizontal: 80,
    borderRadius: 12,
    marginTop: 350,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
