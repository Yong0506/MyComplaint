import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIREBASE_DB = 'https://mycomplaint-b2805-default-rtdb.asia-southeast1.firebasedatabase.app';

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
      const userEmail = await AsyncStorage.getItem('userEmail');

      if (!userEmail) {
        console.log('No user email found');
        setLoading(false);
        return;
      }

      // Fetch data from Firebase
      const response = await fetch(
        `${FIREBASE_DB}/complaints/.json`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch complaints');
      }

      const data = await response.json();

      if (!data) {
        setComplaints([]);
        setLoading(false);
        return;
      }

      const allComplaints = Object.keys(data).map((key) => ({
        id: key,
        name: data[key].title || 'Untitled',
        title: data[key].title,
        message: data[key].message,
        agency: data[key].agency,
        image: data[key].image,
        address: data[key].address,
        timestamp: data[key].timestamp,
        photoLocation: data[key].photoLocation,
        status: data[key].status,
        userEmail: data[key].userEmail,
        resolvedTime: data[key].resolvedTime || 'N/A',
        comments: data[key].comments ? Object.values(data[key].comments) : [],
      }));

      const userComplaints = allComplaints.filter(
        c => c.userEmail === userEmail
      );

      const filteredComplaints =
        title === 'History'
          ? userComplaints.filter(c => c.status === 'resolved')
          : userComplaints.filter(
            c => c.status === 'in_progress' || c.status === 'pending'
          );

      setComplaints(filteredComplaints);
    } catch (error) {
      console.error('Error fetching complaints:', error);
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
          <Text style={styles.complaintTitle}>{item.name}</Text>
          <Text
            style={[
              styles.status,
              item.status === 'pending'
                ? { color: 'red' }
                : item.status === 'in_progress'
                  ? { color: 'orange' }
                  : { color: 'green' },
            ]}
          >
            {title === 'History'
              ? 'Resolved'
              : item.status === 'pending'
                ? 'Pending'
                : item.status === 'in_progress'
                  ? 'In Progress'
                  : 'Completed'}
          </Text>
        </View>
        <Text style={styles.arrow}>{'>'}</Text>
      </TouchableOpacity>
    </View>
  );

  const filteredBySearch = complaints.filter(complaint =>
    complaint.name.toLowerCase().includes(searchText.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#5044ec" />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5044ec" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#5044ec" />
      </TouchableOpacity>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#777" style={{ marginLeft: 15, marginTop: 12 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#777"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {filteredBySearch.length > 0 ? (
        <FlatList
          data={filteredBySearch}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
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
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 65,
    left: 25,
    zIndex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#5044ec',
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    paddingVertical: 8,
    marginTop: 15,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  listButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  complaintTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
  },
  status: {
    fontSize: 13,
    marginTop: 3,
  },
  arrow: {
    fontSize: 18,
    color: '#999',
  },
  line: {
    height: 1,
    backgroundColor: '#ccc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
});
