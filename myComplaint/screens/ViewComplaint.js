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
import MapView, { Marker } from "react-native-maps";

const FIREBASE_DB =
  "https://mycomplaint-b2805-default-rtdb.asia-southeast1.firebasedatabase.app";

export default function ViewComplaintScreen({ navigation, route }) {
  const complaint = route?.params?.complaint || {};

  const [evidencePhoto, setEvidencePhoto] = useState(
    complaint.evidencePhoto || null
  );
  const [loading, setLoading] = useState(false);

  // status check
  const isResolved =
    String(complaint.status || "").toLowerCase() === "resolved";

  // agency mapping
  const agencyMap = {
    dept_dbkl: "Kuala Lumpur City Hall",
    dept_kdebwm: "KDEB Waste Management",
    dept_pcb: "Public Complaints Bureau",
    dept_rapidkl: "Rapid KL",
    dept_works: "Ministry of Works"
  };

  // -------------------------
  // TAKE PHOTO (staff action)
  // -------------------------
  const pickPhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      base64: true
    });

    if (!result.canceled) {
      setEvidencePhoto("data:image/jpeg;base64," + result.assets[0].base64);
    }
  };

  // -------------------------
  // MARK AS RESOLVED (staff)
  // -------------------------
  const resolveComplaint = async () => {
    if (!evidencePhoto) {
      Alert.alert("Missing Evidence", "Please take a photo first.");
      return;
    }

    try {
      setLoading(true);

      const staffID = await AsyncStorage.getItem("staffID");

      // location permission
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

      const resolvedTime = new Date().toLocaleString("en-GB"); // Malaysian readable format

      const updateData = {
        status: "resolved",
        resolvedTime,
        resolvedBy: staffID,
        evidencePhoto,
        evidenceLocation
      };

      const res = await fetch(
        `${FIREBASE_DB}/complaints/${complaint.id}.json`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData)
        }
      );

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

  // -------------------------
  // BACK BUTTON (SAFE)
  // -------------------------
  const goBackSafe = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate("Main");
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={goBackSafe}>
          <Ionicons name="arrow-back" size={28} color="#5044ec" />
        </TouchableOpacity>

        {/* ----------------------- */}
        {/* TITLE */}
        {/* ----------------------- */}
        <Text style={styles.title}>{complaint.title}</Text>

        {/* ----------------------- */}
        {/* ORIGINAL PHOTO */}
        {/* ----------------------- */}
        {complaint.image ? (
          <Image
            source={{ uri: complaint.image }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noPhoto}>
            <Text>No photo provided</Text>
          </View>
        )}

        {/* ----------------------- */}
        {/* DESCRIPTION SECTION */}
        {/* ----------------------- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.sectionText}>{complaint.message}</Text>
        </View>

        {/* ----------------------- */}
        {/* AGENCY + TIME */}
        {/* ----------------------- */}
        <View style={styles.rowSection}>
          <View style={styles.half}>
            <Text style={styles.sectionTitle}>Agency</Text>
            <Text style={styles.sectionText}>
              {agencyMap[complaint.agency] || complaint.agency}
            </Text>
          </View>

          <View style={styles.half}>
            <Text style={styles.sectionTitle}>Taken At</Text>
            <Text style={styles.sectionText}>{complaint.timestamp}</Text>
          </View>
        </View>

        {/* ----------------------- */}
        {/* LOCATION TEXT */}
        {/* ----------------------- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          {complaint.address ? (
            <Text style={styles.sectionText}>{complaint.address}</Text>
          ) : complaint.location ? (
            <Text style={styles.sectionText}>
              Lat: {complaint.location.latitude?.toFixed(5)} | Lng:{" "}
              {complaint.location.longitude?.toFixed(5)}
            </Text>
          ) : (
            <Text style={styles.sectionText}>No location provided</Text>
          )}
        </View>

        {/* ----------------------- */}
        {/* ORIGINAL MAP */}
        {/* ----------------------- */}
        {complaint.location && complaint.location.latitude && (
          <MapView
            style={styles.map}
            region={{
              latitude: complaint.location.latitude,
              longitude: complaint.location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01
            }}
          >
            <Marker
              coordinate={{
                latitude: complaint.location.latitude,
                longitude: complaint.location.longitude
              }}
            />
          </MapView>
        )}

        {/* ----------------------- */}
        {/* RESOLVED SECTION DISPLAY */}
        {/* ----------------------- */}
        {isResolved && (
          <>
            <Text style={styles.sectionTitle2}>Resolved Details</Text>

            {complaint.evidencePhoto && (
              <Image
                source={{ uri: complaint.evidencePhoto }}
                style={styles.evidencePhoto}
                resizeMode="cover"
              />
            )}

            {complaint.evidenceLocation && (
              <MapView
                style={styles.map}
                region={{
                  latitude: complaint.evidenceLocation.latitude,
                  longitude: complaint.evidenceLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01
                }}
              >
                <Marker
                  coordinate={{
                    latitude: complaint.evidenceLocation.latitude,
                    longitude: complaint.evidenceLocation.longitude
                  }}
                />
              </MapView>
            )}

            {complaint.resolvedTime && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Resolved At</Text>
                <Text style={styles.sectionText}>{complaint.resolvedTime}</Text>
              </View>
            )}
          </>
        )}

        {/* ----------------------- */}
        {/* STAFF ACTIONS (ONLY IN-PROGRESS) */}
        {/* ----------------------- */}
        {!isResolved && (
          <>
            <Text style={styles.sectionTitle2}>Staff Actions</Text>

            {evidencePhoto && (
              <Image
                source={{ uri: evidencePhoto }}
                style={styles.evidencePhoto}
              />
            )}

            <TouchableOpacity style={styles.captureButton} onPress={pickPhoto}>
              <Ionicons name="camera-outline" size={22} color="#fff" />
              <Text style={styles.captureText}>Take Evidence Photo</Text>
            </TouchableOpacity>

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
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingTop: 60, paddingHorizontal: 20 },
  backButton: { position: "absolute", top: 65, left: 25 ,zIndex:10,elevation:10},
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#5044ec",
    zIndex:1
  },
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
  section: {
    marginTop: 18,
    padding: 12,
    backgroundColor: "#fafafa",
    borderRadius: 10
  },
  sectionTitle: { fontSize: 14, color: "#5044ec", fontWeight: "600" },
  sectionText: { fontSize: 15, color: "#333", lineHeight: 20 },
  rowSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 12,
    marginLeft: 10
  },
  half: { flex: 1, paddingRight: 8 },
  sectionTitle2: {
    marginTop: 25,
    fontSize: 18,
    fontWeight: "bold",
    color: "#5044ec"
  },
  map: { width: "100%", height: 200, borderRadius: 10, marginTop: 12 },
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
