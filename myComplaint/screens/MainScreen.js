import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIREBASE_DB =
  'https://mycomplaint-b2805-default-rtdb.asia-southeast1.firebasedatabase.app';

export default function MainScreen({ navigation }) {
  const [inProgressCount, setInProgressCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [departmentName, setDepartmentName] = useState("");

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 8000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const staffDept = await AsyncStorage.getItem("staffDepartment");

      /** Load department name */
      const deptRes = await fetch(`${FIREBASE_DB}/departments/${staffDept}/departmentName.json`);
      if (deptRes.ok) {
        setDepartmentName(await deptRes.json());
      }

      /** Fetch all complaints */
      const res = await fetch(`${FIREBASE_DB}/complaints.json`);
      const data = await res.json();
      if (!data) return;

      let ip = 0, r = 0;

      Object.values(data).forEach((c) => {
        if (!c || c.agency !== staffDept) return;

        const status = (c.status || "").toLowerCase();

        if (status === "in_progress") ip++;
        if (status === "resolved") r++;
      });

      setInProgressCount(ip);
      setResolvedCount(r);

    } catch (err) {
      console.error("Dashboard load error:", err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Staff Dashboard</Text>
      <Text style={styles.text}>{departmentName}</Text>

      <View style={styles.line} />

      <View style={styles.row}>
        <View style={[styles.card, { backgroundColor: "#e28600ff" }]}>
          <Text style={styles.cardTitle}>In Progress</Text>
          <Text style={styles.cardNumber}>{inProgressCount}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: "#2cba88ff" }]}>
          <Text style={styles.cardTitle}>Resolved</Text>
          <Text style={styles.cardNumber}>{resolvedCount}</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.listButton}
          onPress={() => navigation.navigate('ComplaintLists', { title: 'Complaints' })}
        >
          <Text style={styles.buttonText}>View Active Complaints</Text>
          <Text style={styles.arrow}>{'>'}</Text>
        </TouchableOpacity>

        <View style={styles.line} />

        <TouchableOpacity
          style={styles.listButton}
          onPress={() => navigation.navigate('ComplaintLists', { title: 'History' })}
        >
          <Text style={styles.buttonText}>Resolved Complaints</Text>
          <Text style={styles.arrow}>{'>'}</Text>
        </TouchableOpacity>

        <View style={styles.line} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center", color: "#5044ec" },
  text: { fontSize: 18, marginBottom: 15, textAlign: "center", color: "#5044ec" },
  line: { height: 1, backgroundColor: "#5044ec", marginVertical: 10 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  card: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  cardTitle: { fontSize: 18, color: "#fff", textAlign: "center" },
  cardNumber: { fontSize: 26, fontWeight: "bold", color: "#fff", textAlign: "center" },

  buttonContainer: { marginTop: 10 },
  listButton: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 15 },
  buttonText: { fontSize: 16, color: "#333" },
  arrow: { fontSize: 18, color: "#999" }
});
