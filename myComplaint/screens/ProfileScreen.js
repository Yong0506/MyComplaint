import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const FIREBASE_DB = "https://mycomplaint-b2805-default-rtdb.asia-southeast1.firebasedatabase.app";

export default function ProfileScreen({ navigation }) {
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [departmentName, setDepartmentName] = useState("");

  useEffect(() => {
    loadStaffData();
  }, []);

  const loadStaffData = async () => {
    const name = await AsyncStorage.getItem("staffName");
    const email = await AsyncStorage.getItem("staffEmail");
    const deptID = await AsyncStorage.getItem("staffDepartment");

    setStaffName(name || "");
    setStaffEmail(email || "");

    const res = await fetch(`${FIREBASE_DB}/departments/${deptID}/departmentName.json`);
    if (res.ok) {
      const dept = await res.json();
      setDepartmentName(dept || "Unknown Department");
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Staff Profile</Text>

      <View style={styles.profileIconContainer}>
        <Ionicons name="person-circle-outline" size={90} color="#5044ec" />
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="person-outline" size={24} color="#5044ec" />
        <Text style={styles.infoText}>{staffName}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="mail-outline" size={24} color="#5044ec" />
        <Text style={styles.infoText}>{staffEmail}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="briefcase-outline" size={24} color="#5044ec" />
        <Text style={styles.infoText}>{departmentName}</Text>
      </View>

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => navigation.navigate("EditProfile")}
      >
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
        <Ionicons name="log-out-outline" size={22} color="#fff" style={{ marginLeft: 8 }} />
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
    marginBottom: 10,
  },
  icon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#000',
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    width: '100%',
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: '#5044ec',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 6,
    marginTop: 15,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff2e2e',
    paddingVertical: 12,
    paddingHorizontal: 80,
    borderRadius: 12,
    marginTop: 350,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
