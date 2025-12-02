import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EditProfileScreen({ navigation }) {
  const [name, setName] = useState('');
  const [userKey, setUserKey] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('userEmail');
        if (!storedEmail) return;

        const FIREBASE_DB = 'https://mycomplaint-b2805-default-rtdb.asia-southeast1.firebasedatabase.app';
        const emailKey = encodeURIComponent(storedEmail);

        const mapRes = await fetch(`${FIREBASE_DB}/emails/${emailKey}.json`);
        if (mapRes.ok) {
          const mapped = await mapRes.json();
          if (mapped) {
            setUserKey(mapped);
            const userRes = await fetch(`${FIREBASE_DB}/users/${mapped}.json`);
            if (userRes.ok) {
              const userData = await userRes.json();
              if (userData && userData.name) setName(userData.name);
              return;
            }
          }
        }

        const allRes = await fetch(`${FIREBASE_DB}/users.json`);
        if (!allRes.ok) return;
        const all = await allRes.json();
        if (!all) return;
        for (const k of Object.keys(all)) {
          const u = all[k];
          if (u && u.email === storedEmail) {
            setUserKey(k);
            if (u.name) setName(u.name);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to load profile for edit', err);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    if (!name || name.trim().length === 0) {
      Alert.alert('Invalid name', 'Please enter your name');
      return;
    }
    try {
      const FIREBASE_DB = 'https://mycomplaint-b2805-default-rtdb.asia-southeast1.firebasedatabase.app';
      if (!userKey) {
        Alert.alert('Save failed', 'User key not found.');
        return;
      }

      const res = await fetch(`${FIREBASE_DB}/users/${userKey}/name.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(name),
      });
      if (!res.ok) {
        const txt = await res.text();
        console.error('Failed to save name', txt);
        Alert.alert('Save failed', 'Could not update profile.');
        return;
      }

      Alert.alert('Saved', 'Profile updated successfully');
      navigation.goBack();
    } catch (err) {
      console.error('Save error', err);
      Alert.alert('Save failed', 'An unexpected error occurred.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#5044ec" />
      </TouchableOpacity>

      <Text style={styles.title}>Edit Profile</Text>

      <View style={styles.profileIconContainer}>
        <Ionicons name="person-circle-outline" size={90} color="#5044ec" />
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="person-outline" size={24} color="#5044ec" style={styles.icon} />
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor="#999"
        />
      </View>

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
