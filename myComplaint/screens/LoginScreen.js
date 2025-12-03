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

    if (!trimmedEmail) return setEmailError("Email is required");
    if (!trimmedPassword) return setPasswordError("Password is required");

    try {
      const url = `${FIREBASE_DB}/agency_users.json?orderBy=%22email%22&equalTo=%22${trimmedEmail}%22`;
      const resp = await fetch(url);
      const data = await resp.json();

      if (!data || Object.keys(data).length === 0) {
        setEmailError("No staff account found.");
        return;
      }

      const key = Object.keys(data)[0];
      const staff = data[key];

      if (staff.role !== "Staff") {
        setEmailError("Access denied. Not a staff account.");
        return;
      }

      const storedHash = staff.passwordHash;
      const salt = staff.salt;

      const computed = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        salt + trimmedPassword
      );

      if (computed !== storedHash) {
        setPasswordError("Incorrect password");
        return;
      }

      await AsyncStorage.setItem("staffID", key);
      await AsyncStorage.setItem("staffEmail", staff.email);
      await AsyncStorage.setItem("staffName", staff.name || "");
      await AsyncStorage.setItem("staffDepartment", staff.departmentID);

      navigation.reset({
        index: 0,
        routes: [{ name: "Main" }],
      });

    } catch (err) {
      Alert.alert("Login failed", "Unexpected error occurred.");
      console.log(err);
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

      <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
        <Text style={styles.linkText}>Forgot Password?</Text>
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
