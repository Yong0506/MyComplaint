import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart, BarChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIREBASE_DB = 'https://mycomplaint-b2805-default-rtdb.asia-southeast1.firebasedatabase.app';

export default function ReportScreen({ navigation }) {

  const screenWidth = Dimensions.get("window").width;

  const [statusCount, setStatusCount] = useState({
    pending: 0,
    inprogress: 0,
    resolved: 0,
  });

  const [agencyCount, setAgencyCount] = useState({
    dept_dbkl: 0,
    dept_kdebwm: 0,
    dept_pcb: 0,
    dept_rapidkl: 0,
    dept_works: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const userEmail = await AsyncStorage.getItem('userEmail');
    if (!userEmail) return;

    const response = await fetch(`${FIREBASE_DB}/complaints.json`);
    const data = await response.json();

    if (!data) return;

    let tempStatus = { pending: 0, inprogress: 0, resolved: 0 };
    let tempAgency = {
      dept_dbkl: 0,
      dept_kdebwm: 0,
      dept_pcb: 0,
      dept_rapidkl: 0,
      dept_works: 0,
    };

    Object.keys(data).forEach(id => {
      const c = data[id];

      if (c.userEmail !== userEmail) return;

      if (c.status === "pending") tempStatus.pending++;
      if (c.status === "in_progress") tempStatus.inprogress++;
      if (c.status === "resolved") tempStatus.resolved++;

      if (tempAgency[c.agency] !== undefined) {
        tempAgency[c.agency]++;
      }
    });

    setStatusCount(tempStatus);
    setAgencyCount(tempAgency);
  };

  const agenciesFullName = {
    dept_dbkl: "Kuala Lumpur City Hall",
    dept_kdebwm: "KDEB Waste Management",
    dept_pcb: "Public Complaints Bureau",
    dept_rapidkl: "Rapid KL",
    dept_works: "Ministry of Works",
  };

  const pieData = [
    {
      name: "Pending",
      population: statusCount.pending,
      color: "#FFCE54"
    },
    {
      name: "In Progress",
      population: statusCount.inprogress,
      color: "#4FC1E9"
    },
    {
      name: "Resolved",
      population: statusCount.resolved,
      color: "#A0D568"
    }
  ];

  const barLabels = [
    "DBKL",
    "KDEBWM",
    "PCB",
    "RapidKL",
    "Works"
  ];

  const barData = {
    labels: barLabels,
    datasets: [
      {
        data: [
          agencyCount.dept_dbkl,
          agencyCount.dept_kdebwm,
          agencyCount.dept_pcb,
          agencyCount.dept_rapidkl,
          agencyCount.dept_works,
        ]
      }
    ]
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="#5044ec" />
      </TouchableOpacity>

      <Text style={styles.title}>Report Summary</Text>

      <Text style={styles.sectionTitle}>Complaint Status</Text>
      {/* <View style={styles.box}>
        <Text style={styles.item}>Pending: {statusCount.pending}</Text>
        <Text style={styles.item}>In Progress: {statusCount.inprogress}</Text>
        <Text style={styles.item}>Resolved: {statusCount.resolved}</Text>
      </View> */}
      <PieChart
        data={pieData}
        width={screenWidth - 20}
        height={220}
        chartConfig={chartConfig}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />

      <Text style={styles.sectionTitle}>Complaints by Agency</Text>
      {/* <View style={styles.box}>
        {Object.keys(agencyCount).map(key => (
          <Text key={key} style={styles.item}>
            {agenciesFullName[key]}: {agencyCount[key]}
          </Text>
        ))}
      </View> */}
      <BarChart
        data={barData}
        width={screenWidth - 20}
        height={260}
        chartConfig={chartConfig}
        verticalLabelRotation={30}
      />

    </ScrollView>
  );
}

const chartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(80, 68, 236, ${opacity})`,
  labelColor: () => "#333",
};

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
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: '#5044ec',
  },
  box: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  item: {
    fontSize: 16,
    marginBottom: 8,
  },
});
