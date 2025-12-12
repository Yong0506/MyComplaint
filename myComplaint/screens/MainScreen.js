import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen({ navigation }) {
  const [pending, setPending] = useState(0);
  const [inProgress, setInProgress] = useState(0);
  const [resolved, setResolved] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const userEmail = await AsyncStorage.getItem('userEmail');
        if (!userEmail) return;
        const FIREBASE_DB = 'https://mycomplaint-b2805-default-rtdb.asia-southeast1.firebasedatabase.app';
        const res = await fetch(`${FIREBASE_DB}/complaints.json`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data) return;
        let p = 0, ip = 0, r = 0;
        Object.values(data).forEach((c) => {
          if (!c || c.userEmail !== userEmail) return;
          const s = (c.status || '').toLowerCase();
          if (s === 'pending') p += 1;
          else if (s === 'in_progress') ip += 1;
          else if (s === 'resolved') r += 1;
        });
        setPending(p);
        setInProgress(ip);
        setResolved(r);
      } catch (err) {
        console.error('Failed to fetch complaint counts', err);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.text}>Complaint Overview</Text>

      <View style={[styles.line, { marginBottom: "20" }]} />

      <View style={styles.row}>
        <View style={[styles.card, { backgroundColor: "#f5c533ff" }]}>
          <Text style={styles.cardTitle}>Pending</Text>
          <Text style={styles.cardNumber}>{pending}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: "#e28600ff" }]}>
          <Text style={styles.cardTitle}>In Progress</Text>
          <Text style={styles.cardNumber}>{inProgress}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={{ flexBasis: "24%" }} />
        <View style={[styles.card, { backgroundColor: "#2cba88ff" }]}>
          <Text style={styles.cardTitle}>Resolved</Text>
          <Text style={styles.cardNumber}>{resolved}</Text>
        </View>
        <View style={{ flexBasis: "24%" }} />
      </View>

      <View style={styles.buttonContainer}>
        <View style={styles.line} />
        <TouchableOpacity
          style={styles.listButton}
          onPress={() => navigation.navigate('ComplaintLists', { title: 'Complaints' })}
        >
          <Text style={styles.buttonText}>View Complaint</Text>
          <Text style={styles.arrow}>{'>'}</Text>
        </TouchableOpacity>

        <View style={styles.line} />

        <TouchableOpacity
          style={styles.listButton}
          onPress={() => navigation.navigate('ComplaintLists', { title: 'History' })}
        >
          <Text style={styles.buttonText}>History</Text>
          <Text style={styles.arrow}>{'>'}</Text>
        </TouchableOpacity>

        <View style={styles.line} />

        <TouchableOpacity
          style={styles.listButton}
          onPress={() => navigation.navigate('Report')}
        >
          <Text style={styles.buttonText}>View Report</Text>
          <Text style={styles.arrow}>{'>'}</Text>
        </TouchableOpacity>
        <View style={styles.line} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#5044ec",
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#5044ec",
  },
  separator: {
    height: 1,
    backgroundColor: "#ccc",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    flex: 1,
    marginHorizontal: 5,
  },
  cardTitle: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  cardNumber: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  buttonContainer: {
    marginTop: 10,
  },
  listButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
  },
  buttonText: {
    fontSize: 16,
    color: "#333",
  },
  arrow: {
    fontSize: 18,
    color: "#999",
  },
  line: {
    height: 1,
    backgroundColor: "#5044ec",
  },
});


