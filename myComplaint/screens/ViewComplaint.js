import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAccessoryView } from "react-native-keyboard-accessory";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FIREBASE_DB = 'https://mycomplaint-b2805-default-rtdb.asia-southeast1.firebasedatabase.app';

export default function ViewComplaintScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();

  const complaint = route?.params?.complaint || route?.params?.item || {};
  const {
    id = '',
    title = 'No title',
    message = 'No description',
    image = null,
    agency = 'N/A',
    timestamp = '',
    location = null,
    address = '',
    status = '',
    resolvedTime = '',
    resolvedImage = null,
    comments = [],
  } = complaint;

  const agencyMap = {
    dept_dbkl: "Kuala Lumpur City Hall",
    dept_kdebwm: "KDEB Waste Management",
    dept_pcb: "Public Complaints Bureau",
    dept_rapidkl: "Rapid KL",
    dept_works: "Ministry of Works",
  };

  const [userComment, setUserComment] = useState('');
  const [within24Hours, setWithin24Hours] = useState(false);

  useEffect(() => {
    if (!resolvedTime) return;

    const [datePart, timePart] = resolvedTime.split(', ');
    const [day, month, year] = datePart.split('/').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    const resolved = new Date(year, month - 1, day, hours, minutes, seconds);

    const now = new Date();

    const diff = now - resolved;
    setWithin24Hours(diff <= 24 * 60 * 60 * 1000);
  }, [resolvedTime]);

  const commentsArray = comments
    ? Object.keys(comments)
      .map(key => comments[key])
      .filter(c => c != null) // remove nulls
    : [];

  const handleSubmitComment = async () => {
    if (!userComment.trim()) return;

    try {
      const existingComments = comments || [];

      const newId = (existingComments.length + 1).toString();

      const newComment = {
        type: "user",
        message: userComment.trim(),
        time: new Date().toLocaleString(),
      };

      const updatedComments = { ...existingComments, [newId]: newComment };

      const res = await fetch(`${FIREBASE_DB}/complaints/${id}/comments.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedComments),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to submit comment:", text);
        alert("Failed to submit comment.");
        return;
      }

      alert("Comment submitted!");

      comments.push(newComment);
      setUserComment("");
    } catch (err) {
      console.error("Error submitting comment:", err);
      alert("Error submitting comment.");
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 80 }]}>
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

      {status === 'resolved' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resolved Time</Text>
          <Text style={styles.sectionText}>{resolvedTime || 'N/A'}</Text>
        </View>
      )}

      {status === 'resolved' && resolvedImage ? (
        <Image source={{ uri: resolvedImage }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={styles.noPhoto}>
          <Text style={styles.noPhotoText}>No photo provided</Text>
        </View>
      )}

      {status === 'resolved' && commentsArray.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comments</Text>

          {commentsArray
            .sort((a, b) => new Date(a.time) - new Date(b.time))
            .map((c, index) => (
              <View key={index} style={styles.commentBox}>
                <Text style={styles.commentType}>
                  {c.type === 'user' ? 'User:' : 'Agency:'}
                </Text>
                <Text style={styles.commentText}>{c.message}</Text>
                <Text style={styles.commentTime}>{c.time}</Text>
              </View>
            ))}
        </View>
      )}

      {/* {status === 'resolved' && isWithin24Hours && (
        <View style={styles.section}>

          <TextInput
            style={styles.input}
            placeholder="Write your comment..."
            value={userComment}
            onChangeText={setUserComment}
            multiline
          />

          <TouchableOpacity style={styles.button} onPress={handleSubmitComment}>
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      )} */}

      {status === "resolved" && within24Hours && (
        <KeyboardAccessoryView alwaysVisible={true} style={[styles.section, { marginTop: 100 }]}>
          <View>
            <TextInput
              value={userComment}
              onChangeText={setUserComment}
              placeholder="Write your comment..."
              style={styles.input}
            />

            <TouchableOpacity
              onPress={handleSubmitComment}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAccessoryView>
      )}
    </ScrollView>

  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    fontSize: 14,
    backgroundColor: '#fff'
  },
  button: {
    marginTop: 10,
    backgroundColor: '#5044ec',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  },
  commentBox: {
    backgroundColor: '#f2f2f7',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  commentType: {
    fontWeight: 'bold',
    color: '#5044ec',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    color: '#777',
  },
});
