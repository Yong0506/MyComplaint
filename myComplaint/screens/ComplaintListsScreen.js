import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIREBASE_DB =
  'https://mycomplaint-b2805-default-rtdb.asia-southeast1.firebasedatabase.app';

export default function ComplaintListsScreen({ navigation, route }) {
  const { title } = route.params || { title: 'Complaints' };
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);

      const staffDept = await AsyncStorage.getItem("staffDepartment");
      const res = await fetch(`${FIREBASE_DB}/complaints.json`);
      const data = await res.json();

      if (!data) {
        setComplaints([]);
        setLoading(false);
        return;
      }

      const all = Object.keys(data).map((id) => ({
        id,
        ...data[id]
      }));

      let filtered = all.filter(
        c => c.agency === staffDept
      );

      if (title === "Complaints") {
        filtered = filtered.filter(c => c.status === "in_progress");
      } else if (title === "History") {
        filtered = filtered.filter(c => c.status === "resolved");
      }

      setComplaints(filtered);

    } catch (err) {
      console.error('Error:', err);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View>
      <View style={styles.line} />
      <TouchableOpacity
        style={styles.listButton}
        onPress={() => navigation.navigate('ViewComplaint', { complaint: item })}
      >
        <View>
          <Text style={styles.complaintTitle}>{item.title}</Text>

          <Text
            style={[
              styles.status,
              item.status === "in_progress"
                ? { color: "orange" }
                : item.status === "resolved"
                  ? { color: "green" }
                  : { color: "red" }
            ]}
          >
            {item.status === "in_progress"
              ? "In Progress"
              : item.status === "resolved"
                ? "Resolved"
                : item.status}
          </Text>
        </View>

        <Text style={styles.arrow}>{'>'}</Text>
      </TouchableOpacity>
    </View>
  );

  const filteredSearch = complaints.filter(c =>
    c.title.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#5044ec" />
      </TouchableOpacity>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#777" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5044ec" />
        </View>
      ) : filteredSearch.length > 0 ? (
        <FlatList
          data={filteredSearch}
          renderItem={renderItem}
          keyExtractor={item => item.id}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No complaints found</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
  backButton: { position: "absolute", top: 65, left: 25 },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center", color: "#5044ec" },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    paddingVertical: 8,
    marginTop: 15,
    marginBottom: 15,
    paddingHorizontal: 15,
    alignItems: "center"
  },
  searchInput: { flex: 1, paddingHorizontal: 10, fontSize: 16 },
  listButton: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 15 },
  complaintTitle: { fontWeight: "bold", fontSize: 16 },
  status: { fontSize: 13, marginTop: 3 },
  arrow: { fontSize: 18, color: "#999" },
  line: { height: 1, backgroundColor: "#ccc" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: "#999" },
});
