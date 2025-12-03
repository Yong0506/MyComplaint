import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIREBASE_DB = 'https://mycomplaint-b2805-default-rtdb.asia-southeast1.firebasedatabase.app';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');
    const trimmedEmail = email.trim();
    const trimmedPassword = password;

    if (!trimmedEmail) {
      setEmailError('Email is required');
      return;
    }
    if (!trimmedPassword) {
      setPasswordError('Password is required');
      return;
    }

    try {
      // Fetch all agency_users (avoid orderBy/index issues)
      const url = `${FIREBASE_DB}/agency_users.json`;
      console.log('LOGIN: fetching all staff from', url);
      const resp = await fetch(url);
      if (!resp.ok) {
        const txt = await resp.text();
        console.error('LOGIN: fetch failed', txt);
        Alert.alert('Login failed', 'Unable to query staff accounts.');
        return;
      }

      const data = await resp.json();
      console.log('LOGIN: agency_users raw:', data);

      if (!data || typeof data !== 'object') {
        setEmailError('No staff data found');
        return;
      }

      // Find staff by email
      let staffKey = null;
      let staff = null;
      for (const key in data) {
        if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
        const record = data[key];
        if (!record || !record.email) continue;
        if (String(record.email).toLowerCase() === trimmedEmail.toLowerCase()) {
          staffKey = key;      // this is the firebase key string (e.g. "-Oevqu...")
          staff = record;      // this is the staff object
          break;
        }
      }

      console.log('LOGIN: matched staffKey:', staffKey);
      console.log('LOGIN: matched staff object:', staff);

      if (!staff) {
        setEmailError('No staff account found for this email');
        return;
      }

      // Role check (case-insensitive)
      if ((staff.role || '').toLowerCase() !== 'staff') {
        setEmailError('Access denied. Not a staff account.');
        return;
      }

      // SHA-256 authentication: use the sha256Hash field + salt
      const salt = staff.salt;
      const storedHash = staff.sha256Hash; // note: your DB field name
      if (!salt || !storedHash) {
        Alert.alert('Login failed', 'Staff account missing SHA-256 fields. Contact admin.');
        return;
      }

      const computedHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        salt + trimmedPassword
      );

      console.log('Computed:', computedHash);
      console.log('Stored:', storedHash);

      if (computedHash !== storedHash) {
        setPasswordError('Incorrect password');
        return;
      }

      // Successful login: save staff info to AsyncStorage
      await AsyncStorage.setItem('staffID', staffKey);
      await AsyncStorage.setItem('staffEmail', staff.email);
      await AsyncStorage.setItem('staffName', staff.name || '');
      await AsyncStorage.setItem('staffDepartment', staff.departmentID || '');

      // Optional: update lastLogin time in DB (non-blocking)
      (async () => {
        try {
          const now = new Date().toISOString();
          await fetch(`${FIREBASE_DB}/agency_users/${encodeURIComponent(staffKey)}/lastLogin.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(now),
          });
        } catch (e) {
          console.warn('Failed to update lastLogin (non-blocking):', e);
        }
      })();

      // Navigate into the app and reset stack
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });

    } catch (err) {
      console.error('Login error:', err);
      Alert.alert('Login failed', 'An unexpected error occurred. See console for details.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Staff Login</Text>

      <TextInput
        style={[styles.input, emailError ? styles.inputError : null]}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

      <TextInput
        style={[styles.input, passwordError ? styles.inputError : null]}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.linkText}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { color: '#5044ec', fontSize: 32, fontWeight: 'bold', marginBottom: 40 },
  input: { width: '100%', height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, marginBottom: 20, backgroundColor: '#fff' },
  button: { width: '100%', height: 50, backgroundColor: '#5044ec', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 20 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkText: { color: '#3492eb', textDecorationLine: 'underline', marginTop: 10 },
  inputError: { borderColor: '#e53935' },
  errorText: { color: '#e53935', width: '100%', textAlign: 'left', marginTop: -10, marginBottom: 10, paddingLeft: 5 },
});
