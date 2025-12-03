import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

const FIREBASE_DB =
  "https://mycomplaint-b2805-default-rtdb.asia-southeast1.firebasedatabase.app";

export default function ViewComplaintScreen({ navigation, route }) {
  const complaint = route?.params?.complaint || {};
  const [evidencePhoto, setEvidencePhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: true
    });

    if (!result.canceled) {
      setEvidencePhoto("data:image/jpeg;base64," + result.assets[0].base64);
    }
  };

  const resolveComplaint = async () => {
    if (!evidencePhoto) {
      Alert.alert("Missing Evidence", "Please take a photo before resolving.");
      return;
    }

    try {
      setLoading(true);

      const staffID = await AsyncStorage.getItem("staffID");

      /** 1. Get GPS Location */
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required.");
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const evidenceLocation = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      };

      /** 2. Timestamp */
      const resolvedTime = new Date().toISOString();

      /** 3. Update Firebase */
      const updateData = {
        status: "resolved",
        resolvedTime,
        resolvedBy: staffID,
        evidencePhoto,
        evidenceLocation
      };

      const res = await fetch(`${FIREBASE_DB}/complaints/${complaint.id}.json`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });

      if (!res.ok) {
        Alert.alert("Error", "Failed to update complaint.");
        setLoading(false);
        return;
      }

      Alert.alert("Success", "Complaint marked as resolved.");
      navigation.goBack();

    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Unexpected issue occurred.");
    }

    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#5044ec" />
      </TouchableOpacity>

      <Text style={styles.title}>{complaint.title}</Text>

      {complaint.image ? (
        <Image source={{ uri: complaint.image }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={styles.noPhoto}>
          <Text>No photo provided</Text>
        </View>
      )}

      {/* Existing description block */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.sectionText}>{complaint.message}</Text>
      </View>

      {/* =============================== */}
      {/* STAFF ACTION SECTION STARTS HERE */}
      {/* =============================== */}

      <Text style={styles.sectionTitle2}>Staff Actions</Text>

      {/* Evidence Preview */}
      {evidencePhoto ? (
        <Image source={{ uri: evidencePhoto }} style={styles.evidencePhoto} />
      ) : (
        <Text style={{ color: "#777", marginBottom: 10 }}>
          No evidence photo added yet
        </Text>
      )}

      {/* Take Photo Button */}
      <TouchableOpacity style={styles.captureButton} onPress={pickPhoto}>
        <Ionicons name="camera-outline" size={22} color="#fff" />
        <Text style={styles.captureText}>Take Evidence Photo</Text>
      </TouchableOpacity>

      {/* Resolve Button */}
      <TouchableOpacity
        style={styles.resolveButton}
        onPress={resolveComplaint}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.resolveText}>Mark as Resolved</Text>
        )}
      </TouchableOpacity>

      {/* =============================== */}
      {/* STAFF ACTION SECTION ENDS HERE */}
      {/* =============================== */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingTop: 60, paddingHorizontal: 20 },
  backButton: { position: "absolute", top: 65, left: 25 },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center", color: "#5044ec" },
  photo: { width: "100%", height: 220, borderRadius: 12, marginTop: 20 },
  noPhoto: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginTop: 20,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center"
  },
  section: { marginTop: 18, padding: 12, backgroundColor: "#fafafa", borderRadius: 10 },
  sectionTitle: { fontSize: 14, color: "#5044ec", fontWeight: "600" },
  sectionText: { fontSize: 15, color: "#333" },

  sectionTitle2: {
    marginTop: 25,
    fontSize: 18,
    fontWeight: "bold",
    color: "#5044ec"
  },

  evidencePhoto: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginBottom: 15,
    marginTop: 10
  },

  captureButton: {
    flexDirection: "row",
    backgroundColor: "#5044ec",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20
  },
  captureText: {
    color: "#fff",
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "600"
  },

  resolveButton: {
    backgroundColor: "#2cba88",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 40
  },
  resolveText: { color: "#fff", fontSize: 17, fontWeight: "bold" }
});
