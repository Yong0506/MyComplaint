import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Keyboard, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import RNPickerSelect from 'react-native-picker-select';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

import { File, Paths } from 'expo-file-system';

export default function ComplaintScreen() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [image, setImage] = useState(null);
  const [agency, setAgency] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [address, setAddress] = useState('');
  const insets = useSafeAreaInsets();
  const [timestamp, setTimestamp] = useState('');

  const [loadingAgency, setLoadingAgency] = useState(false);
  const [loading, setLoading] = useState(false);

  const agencyFullNames = {
    dept_dbkl: "Kuala Lumpur City Hall",
    dept_kdebwm: "KDEB Waste Management",
    dept_pcb: "Public Complaints Bureau",
    dept_rapidkl: "Rapid KL",
    dept_works: "Ministry of Works",
  };

  // const handleUseCamera = async () => {
  //   try {
  //     const { status } = await ImagePicker.requestCameraPermissionsAsync();
  //     const locStatus = await Location.requestForegroundPermissionsAsync();

  //     if (status !== "granted" || locStatus.status !== "granted") {
  //       alert("Camera and Location permissions are required!");
  //       return;
  //     }

  //     const result = await ImagePicker.launchCameraAsync({
  //       allowsEditing: false,
  //       quality: 1,
  //     });

  //     if (result.canceled) {
  //       console.log("Camera cancelled");
  //       return;
  //     }

  //     const photoUri = result.assets[0].uri;
  //     const location = await Location.getCurrentPositionAsync({});
  //     const currentTimestamp = new Date().toLocaleString();

  //     setImage(photoUri);
  //     setTimestamp(currentTimestamp);
  //     setSelectedLocation({
  //       latitude: location.coords.latitude,
  //       longitude: location.coords.longitude,
  //     });
  //     console.log('Image captured and saved:', photoUri);
  //   } catch (error) {
  //     console.error("Error taking photo:", error);
  //   }
  // };

  const handleUseCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      const locStatus = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted" || locStatus.status !== "granted") {
        alert("Camera and Location permissions are required!");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled) return;

      const photoUri = result.assets[0].uri;

      const formData = new FormData();
      formData.append("image", {
        uri: photoUri,
        type: "image/jpeg",
        name: "photo.jpg",
      });

      setLoading(true);

      const response = await fetch("http://192.168.1.10:5000/blur", {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response.ok) throw new Error("Failed to blur image");

      const blob = await response.blob();

      const reader = new FileReader();
      reader.onloadend = async () => {
        const arrayBuffer = reader.result;
        const uint8Array = new Uint8Array(arrayBuffer);

        const file = new File(Paths.cache.uri, `blurred_${Date.now()}.jpg`);
        await file.write(uint8Array);

        setImage(file.uri);
        setLoading(false);
        console.log("Blurred image saved at:", file.uri);
      };
      reader.readAsArrayBuffer(blob);

      const location = await Location.getCurrentPositionAsync({});
      const currentTimestamp = new Date().toLocaleString();

      setTimestamp(currentTimestamp);
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

    } catch (error) {
      console.error("Error taking photo:", error);
    }
  };

  const predictAgency = async () => {
    if (!message.trim()) {
      alert("Please enter complaint description first.");
      return;
    }

    setLoadingAgency(true);

    try {
      const res = await fetch("http://192.168.1.10:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: message }),
      });

      const data = await res.json();

      if (!data.agency) {
        alert("AI could not determine agency.");
        setLoadingAgency(false);
        return;
      }

      setAgency(data.agency);
    } catch (err) {
      console.log(err);
      alert("Error connecting to AI.");
    }

    setLoadingAgency(false);
  };

  useEffect(() => {
    if (searchText.length < 3) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?q=${searchText}&format=json&limit=5`, {
        headers: {
          'User-Agent': 'myComplaintApp/1.0 (wenghong0506@email.com)',
        },
      })
        .then((res) => res.json())
        .then((data) => setSearchResults(data))
        .catch((err) => console.error(err));
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchText]);

  useEffect(() => {
    const getCurrentLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setLocationLoaded(true);
    };

    getCurrentLocation();
  }, []);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        if (!selectedLocation) return;
        const result = await Location.reverseGeocodeAsync({
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        });
        if (result && result.length > 0) {
          const addr = result[0];
          const parts = [addr.name, addr.street, addr.city, addr.region, addr.postalCode, addr.country].filter(Boolean);
          setAddress(parts.join(', '));
        } else {
          setAddress('');
        }
      } catch (err) {
        console.error('Reverse geocode failed', err);
        setAddress('');
      }
    };

    fetchAddress();
  }, [selectedLocation]);

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setImage(null);
    setAgency('');
    setTimestamp('');
    setAddress('');
    setSearchText('');
    setSearchResults([]);
  };

  // submit handling
  const handleSend = async () => {
    const errors = [];
    if (!title || title.trim().length < 3) errors.push('Please enter a title (at least 3 characters).');
    if (!message || message.trim().length < 10) errors.push('Please describe the complaint (at least 10 characters).');
    if (!image) errors.push('Please take a photo of the issue.');
    if (!agency) errors.push('Please select a government agency.');

    if (errors.length > 0) {
      Alert.alert('Error', errors.join('\n'));
      return;
    }

    let imageBase64 = null;
    try {
      const response = await fetch(image);
      const blob = await response.blob();

      const reader = new FileReader();
      reader.readAsDataURL(blob);

      imageBase64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });

      console.log('Image converted to Base64');
    } catch (err) {
      console.error('Error converting image to Base64:', err);
      Alert.alert('Error', 'Failed to process image. Please try again.');
      return;
    }

    const userEmail = await AsyncStorage.getItem('userEmail');
    const complaintData = {
      title,
      message,
      agency,
      image: imageBase64,
      address,
      timestamp: new Date().toLocaleString(),
      photoLocation: address,
      status: 'pending',
      userEmail: userEmail || null,
    };

    const netState = await NetInfo.fetch();

    if (netState.isConnected) {
      // online

      try {
        const FIREBASE_DB = 'https://mycomplaint-b2805-default-rtdb.asia-southeast1.firebasedatabase.app';
        const res = await fetch(`${FIREBASE_DB}/complaints.json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(complaintData),
        });
        if (!res.ok) {
          console.error('Failed to send complaint to Firebase');
        }
      } catch (err) {
        console.error('Error sending complaint to Firebase', err);
      }

      // send offline complaints
      const stored = await AsyncStorage.getItem('offlineComplaints');
      if (stored) {
        const offlineList = JSON.parse(stored);
        for (const offlineComplaint of offlineList) {
          console.log("Sent stored offline complaint:", offlineComplaint);
        }
        await AsyncStorage.removeItem('offlineComplaints');
      }

      alert('Complaint sent successfully!');
      resetForm();
    } else {
      // offline
      const stored = await AsyncStorage.getItem('offlineComplaints');
      const list = stored ? JSON.parse(stored) : [];
      list.push(complaintData);
      await AsyncStorage.setItem('offlineComplaints', JSON.stringify(list));
      alert('You are offline. Complaint saved locally!');
      resetForm();
    }
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      if (state.isConnected) {
        const stored = await AsyncStorage.getItem('offlineComplaints');
        if (stored) {
          const offlineList = JSON.parse(stored);
          for (const complaint of offlineList) {
            console.log("Auto-sent offline complaint:", complaint);
          }
          await AsyncStorage.removeItem('offlineComplaints');
        }
      }
    });

    return () => unsubscribe();
  }, []);


  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 80 }]}>
      <Text style={styles.title}>Complaint Form</Text>

      <TextInput
        style={styles.titleInput}
        placeholder="Enter the title"
        value={title}
        onChangeText={setTitle}
        multiline
      />

      <TextInput
        style={styles.descInput}
        placeholder="Describe your complaint"
        value={message}
        onChangeText={setMessage}
        multiline
      />

      <View style={{ zIndex: 1 }}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search location..."
          value={searchText}
          onChangeText={setSearchText}
        />

        {searchResults.length > 0 && (
          <View style={styles.resultList}>
            {searchResults.map((item) => (
              <TouchableOpacity
                key={item.place_id}
                style={styles.resultItem}
                onPress={() => {
                  setSelectedLocation({
                    latitude: parseFloat(item.lat),
                    longitude: parseFloat(item.lon),
                  });
                  setSearchResults([]);
                  setSearchText(item.display_name);
                  Keyboard.dismiss();
                }}
              >
                <Text>{item.display_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {selectedLocation ? (
        <MapView
          style={styles.map}
          region={{
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker coordinate={selectedLocation} />
        </MapView>
      ) : (
        <Text>Loading map...</Text>
      )}

      {image ? (
        <>
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.imagePreview} />
          </View>

          <View style={styles.imageMeta}>
            <Text style={styles.metaText} numberOfLines={3}>
              {address
                ? `📍 ${address}`
                : selectedLocation
                  ? `📍 Lat: ${selectedLocation.latitude.toFixed(5)} | Lng: ${selectedLocation.longitude.toFixed(5)}`
                  : ''}
            </Text>
            <Text style={styles.metaText}>🕒 Taken At: {timestamp}</Text>
          </View>
        </>
      ) : (
        <Text style={styles.infoText}>⚠️ No image captured yet</Text>
      )}

      <TouchableOpacity style={styles.button} onPress={handleUseCamera}>
        <Text style={styles.buttonText}>Take Photo</Text>
      </TouchableOpacity>

      {/* <View style={styles.dropdownContainer}>
        <RNPickerSelect
          onValueChange={(value) => setAgency(value)}
          placeholder={{ label: 'Select Government Agency', value: null }}
          items={[
            { label: 'Kuala Lumpur City Hall', value: 'dept_dbkl' },
            { label: 'KDEB Waste Management', value: 'dept_kdebwm' },
            { label: 'Public Complaints Bureau', value: 'dept_pcb' },
            { label: 'Rapid KL', value: 'dept_rapidkl' },
            { label: 'Ministry of Works', value: 'dept_works' },
          ]}
          style={{
            inputAndroid: styles.dropdown,
            inputIOS: styles.dropdown,
          }}
        />
      </View> */}

      <View style={styles.dropdownContainer}>
        <TouchableOpacity style={styles.aiButton} onPress={predictAgency}>
          <Text style={styles.aiButtonText}>Auto Detect Agency</Text>
        </TouchableOpacity>

        {agency ? (
          <Text style={styles.detectedText}>
            Detected Agency: {agencyFullNames[agency] || agency}
          </Text>
        ) : null}
      </View>

      <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
        <Text style={styles.sendButtonText}>Send Complaint</Text>
      </TouchableOpacity>
      {loading && (
        <View style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: "white", marginTop: 10 }}>Processing...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    marginTop: 50,
    textAlign: 'center',
    color: '#5044ec',
  },
  titleInput: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  descInput: {
    height: 180,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
    marginBottom: 40,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 5,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  resultItem: {
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  resultList: {
    maxHeight: 200,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderColor: '#ddd',
    borderWidth: 1,
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    marginBottom: 20,
  },
  imageMeta: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  metaText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  overlay: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  overlayText: {
    color: '#fff',
    fontSize: 14,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#5044ec',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dropdownContainer: {
    marginTop: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    paddingTop: 5,
    paddingBottom: 10,
  },
  dropdown: {
    fontSize: 16,
    paddingVertical: 12,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#5044ec',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  aiButton: {
    backgroundColor: "#5044ec",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center"
  },
  aiButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold"
  },
  detectedText: {
    marginTop: 10,
    fontSize: 15,
    color: "#333"
  }
});
