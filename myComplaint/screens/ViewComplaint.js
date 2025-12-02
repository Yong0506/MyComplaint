import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ViewComplaintScreen({ navigation, route }) {
  // route.params can provide the complaint object. Support several common shapes.
  const complaint = route?.params?.complaint || route?.params?.item || {};
  const {
    title = 'No title',
    message = 'No description',
    image = null,
    agency = 'N/A',
    timestamp = '',
    location = null,
    address = '',
  } = complaint;

  const agencyMap = {
    dept_dbkl: "Kuala Lumpur City Hall",
    dept_kdebwm: "KDEB Waste Management",
    dept_pcb: "Public Complaints Bureau",
    dept_rapidkl: "Rapid KL",
    dept_works: "Ministry of Works",
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#5044ec" />
      </TouchableOpacity>

      <Text style={styles.title}>{title}</Text>

      {image ? (
        <Image source={{ uri: image }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={styles.noPhoto}>
          <Text style={styles.noPhotoText}>No photo provided</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.sectionText}>{message}</Text>
      </View>

      <View style={styles.rowSection}>
        <View style={styles.half}>
          <Text style={styles.sectionTitle}>Agency</Text>
          <Text style={styles.sectionText}>
            {agencyMap[agency] || agency}
          </Text>
        </View>
        <View style={styles.half}>
          <Text style={styles.sectionTitle}>Taken At</Text>
          <Text style={styles.sectionText}>{timestamp}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        {address ? (
          <Text style={styles.sectionText}>{address}</Text>
        ) : location ? (
          <Text style={styles.sectionText}>
            Lat: {location.latitude?.toFixed(5)} | Lng: {location.longitude?.toFixed(5)}
          </Text>
        ) : (
          <Text style={styles.sectionText}>No location provided</Text>
        )}
      </View>
    </ScrollView>
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
  photo: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginTop: 20,
    backgroundColor: '#eee',
  },
  noPhoto: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginTop: 20,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPhotoText: {
    color: '#777',
  },
  section: {
    marginTop: 18,
    padding: 12,
    backgroundColor: '#fafafa',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#5044ec',
    fontWeight: '600',
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  rowSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
    marginLeft: 10,
  },
  half: {
    flex: 1,
    paddingRight: 8,
  },
});
