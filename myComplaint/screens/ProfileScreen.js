import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export default function ProfileScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const loadProfile = useCallback(async () => {
    try {
      const storedEmail = await AsyncStorage.getItem('userEmail');
      if (!storedEmail) return;
      setEmail(storedEmail);

      const FIREBASE_DB = 'https://mycomplaint-b2805-default-rtdb.asia-southeast1.firebasedatabase.app';
      const emailKey = encodeURIComponent(storedEmail);

      const mapRes = await fetch(`${FIREBASE_DB}/emails/${emailKey}.json`);
      if (mapRes.ok) {
        const mapped = await mapRes.json();
        if (mapped) {
          const userRes = await fetch(`${FIREBASE_DB}/users/${mapped}.json`);
          if (userRes.ok) {
            const userData = await userRes.json();
            if (userData && userData.name) setName(userData.name);
            return;
          }
        }
      }

      const queryRes = await fetch(`${FIREBASE_DB}/users.json`);
      if (!queryRes.ok) return;
      const all = await queryRes.json();
      if (!all) return;
      for (const k of Object.keys(all)) {
        const u = all[k];
        if (u && u.email === storedEmail) {
          if (u.name) setName(u.name);
          return;
        }
      }
    } catch (err) {
      console.error('Failed to load profile', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userEmail');
    } catch (e) {
      console.warn('Failed clearing userEmail', e);
    }
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Profile</Text>

      <View style={styles.profileIconContainer}>
        <Ionicons name="person-circle-outline" size={90} color="#5044ec" />
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="person-outline" size={24} color="#5044ec" style={styles.icon} />
        <Text style={styles.infoText}>{name || '—'}</Text>
      </View>
      <View style={styles.separator} />

      <View style={styles.infoRow}>
        <Ionicons name="mail-outline" size={24} color="#5044ec" style={styles.icon} />
        <Text style={styles.infoText}>{email || '—'}</Text>
      </View>
      <View style={styles.separator} />

      <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
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
