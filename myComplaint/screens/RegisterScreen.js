import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as Random from 'expo-random';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const FIREBASE_DB = 'https://mycomplaint-b2805-default-rtdb.asia-southeast1.firebasedatabase.app';

  const checkEmailExists = async (emailToCheck) => {
    try {
      if (!emailToCheck) return false;
      const res = await fetch(`${FIREBASE_DB}/users.json?orderBy=%22email%22&equalTo=${encodeURIComponent('"' + emailToCheck + '"')}`);
      if (!res.ok) {
        console.warn('Failed to check email existence');
        return false;
      }
      const data = await res.json();
      if (data != null && Object.keys(data).length > 0) {
        setEmailError('Email is already registered');
        Alert.alert('Email already registered', 'Please use a different email or login.');
        return true;
      }

      setEmailError('');
      return false;
    } catch (err) {
      console.error('Email check error', err);
      return false;
    }
  };

  const handleRegister = () => {
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password;
    const trimmedConfirm = confirmPassword;

    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let valid = true;

    if (!trimmedName) {
      setNameError('Full name is required');
      valid = false;
    }

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
    } else if (trimmedPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    } else if (!strongPassword.test(trimmedPassword)) {
      setPasswordError('Password must have upper, lower, number, and symbol');
      valid = false;
    }

    if (!trimmedConfirm) {
      setConfirmPasswordError('Please confirm your password');
      valid = false;
    } else if (trimmedConfirm !== trimmedPassword) {
      setConfirmPasswordError('Passwords do not match');
      valid = false;
    }

    if (!valid) {
      console.log('Register validation failed');
      return;
    }

    (async () => {
      try {
        const getSaltHex = async (len = 16) => {
          try {
            if (Random && typeof Random.getRandomBytesAsync === 'function') {
              const saltBytes = await Random.getRandomBytesAsync(len);
              return Array.from(saltBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
            }
          } catch (e) {
            console.warn('expo-random not available or failed', e);
          }

          try {
            if (typeof global !== 'undefined' && global.crypto && typeof global.crypto.getRandomValues === 'function') {
              const arr = new Uint8Array(len);
              global.crypto.getRandomValues(arr);
              return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
            }
          } catch (e) {
            console.warn('global.crypto.getRandomValues not available', e);
          }

          const fallback = Array.from({ length: len }, () => Math.floor(Math.random() * 256));
          return fallback.map((b) => b.toString(16).padStart(2, '0')).join('');
        };

        const saltHex = await getSaltHex(16);

        const hash = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          saltHex + trimmedPassword
        );

        const user = {
          name: trimmedName,
          email: trimmedEmail,
          passwordHash: hash,
          salt: saltHex,
          createdAt: new Date().toISOString(),
        };

        const already = await checkEmailExists(trimmedEmail);
        if (already) return;

        const res = await fetch(`${FIREBASE_DB}/users.json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
        });

        if (!res.ok) {
          const text = await res.text();
          console.error('Firebase error storing user', text);
          Alert.alert('Registration failed', 'Could not save user.');
          return;
        }

        Alert.alert('Success', 'Registration complete. You can now log in.');
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        navigation.navigate('Login');
      } catch (err) {
        console.error('Registration error', err);
        Alert.alert('Registration failed', 'An unexpected error occurred.');
      }
    })();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>

      <TextInput
        style={[styles.input, nameError ? styles.inputError : null]}
        placeholder="Full Name"
        value={name}
        onChangeText={(text) => setName(text)}
      />
      {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

      <TextInput
        style={[styles.input, emailError ? styles.inputError : null]}
        placeholder="Email"
        value={email}
        onChangeText={(text) => setEmail(text)}
        keyboardType="email-address"
      />
      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

      <TextInput
        style={[styles.input, passwordError ? styles.inputError : null]}
        placeholder="Password"
        value={password}
        onChangeText={(text) => setPassword(text)}
        secureTextEntry
      />
      {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

      <TextInput
        style={[styles.input, confirmPasswordError ? styles.inputError : null]}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={(text) => setConfirmPassword(text)}
        secureTextEntry
      />
      {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>Already have an account? Login here</Text>
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
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#5044ec',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
