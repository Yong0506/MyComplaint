import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleLogin = () => {
    setEmailError('');
    setPasswordError('');

    const trimmedEmail = email.trim();
    const trimmedPassword = password;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let valid = true;

    if (!trimmedEmail) {
      setEmailError('Email is required');
      valid = false;
    } else if (!emailPattern.test(trimmedEmail)) {
      setEmailError('Please enter a valid email');
      valid = false;
    }

    if (!trimmedPassword) {
      setPasswordError('Password is required');
      valid = false;
    }

    if (!valid) {
      console.log('Login validation failed');
      return;
    }

    (async () => {
      try {
        const FIREBASE_DB = 'https://mycomplaint-b2805-default-rtdb.asia-southeast1.firebasedatabase.app';

        const url = `${FIREBASE_DB}/users.json?orderBy=%22email%22&equalTo=${encodeURIComponent('"' + trimmedEmail + '"')}`;
        const resp = await fetch(url);
        if (!resp.ok) {
          const txt = await resp.text();
          console.error('Firebase query error', txt);
          Alert.alert('Login failed', 'Unable to query user data.');
          return;
        }

        const data = await resp.json();
        if (!data || Object.keys(data).length === 0) {
          setEmailError('No account found for this email');
          return;
        }

        const key = Object.keys(data)[0];
        const user = data[key];
        const storedHash = user.passwordHash;
        const salt = user.salt;

        if (!storedHash || !salt) {
          Alert.alert('Login failed', 'User record is invalid.');
          return;
        }

        const computed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, salt + trimmedPassword);
        if (computed === storedHash) {
          await AsyncStorage.setItem('userEmail', trimmedEmail);
          setEmail('');
          setPassword('');
          navigation.navigate('Main');
        } else {
          setPasswordError('Incorrect password');
        }
      } catch (err) {
        console.error('Login error', err);
        Alert.alert('Login failed', 'An unexpected error occurred.');
      }
    })();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={[styles.input, emailError ? styles.inputError : null]}
        placeholder="Email"
        value={email}
        onChangeText={(text) => setEmail(text)}
      />
      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

      <TextInput
        style={[styles.input, passwordError ? styles.inputError : null]}
        placeholder="Password"
        value={password}
        secureTextEntry
        onChangeText={(text) => setPassword(text)}
      />
      {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>Don't have an account? Register here</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: '#5044ec',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#5044ec',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#3492eb',
    textDecorationLine: 'underline',
    marginTop: 10,
  },
  inputError: {
    borderColor: '#e53935',
  },
  errorText: {
    color: '#e53935',
    width: '100%',
    textAlign: 'left',
    marginTop: -10,
    marginBottom: 10,
    paddingLeft: 5,
  },
});
