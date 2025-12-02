import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function LandingScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome To</Text>
      <Text style={styles.appName}>My Complaint</Text>

      <Text style={styles.description}>
        Easily report any public issue.{"\n"}
        We make sure it reaches the right agency.{"\n"}
        Fast. Simple. Transparent.
      </Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.buttonText}>Get Started</Text>
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
  welcome: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#5044ec',
  },
  appName: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 60,
  },
  description: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
    marginBottom: 80,
    lineHeight: 24,
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
});
