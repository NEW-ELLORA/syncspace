import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pullSyncData } from './SyncEngine';
import { RefreshCw, QrCode } from 'lucide-react-native';

export default function Dashboard({ onNavigate }: { onNavigate: (route: string) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const dbStr = await AsyncStorage.getItem('syncspace_db');
      if (dbStr) {
        setData(JSON.parse(dbStr));
      }
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManualSync = async () => {
    setLoading(true);
    try {
      const endpoint = await AsyncStorage.getItem('syncspace_endpoint');
      const secret = await AsyncStorage.getItem('syncspace_secret');
      if (!endpoint || !secret) {
        onNavigate('Pairing');
        return;
      }
      const newData = await pullSyncData(endpoint, secret);
      setData(newData);
    } catch (e) {
      alert("Sync failed. Check connection.");
    }
    setLoading(false);
  };

  const reminders = data?.reminders?.values || [];
  const balance = data?.budgets?.values?.[0]?.[2] || 0; // Assuming budget balance is in a specific column

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SyncSpace</Text>
        <TouchableOpacity onPress={handleManualSync} style={styles.syncBtn}>
          <RefreshCw color="#fff" size={20} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onNavigate('Pairing')} style={styles.syncBtn}>
          <QrCode color="#fff" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
        ) : !data ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No data. Please pair with Desktop.</Text>
            <TouchableOpacity onPress={() => onNavigate('Pairing')} style={styles.primaryBtn}>
              <Text style={styles.btnText}>Pair Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Total Balance</Text>
              <Text style={styles.cardBigText}>₹{balance}</Text>
            </View>

            <Text style={styles.sectionTitle}>Reminders ({reminders.length})</Text>
            {reminders.map((r: any, idx: number) => (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.itemText}>{r[1]} {/* Assuming r[1] is title */}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, borderBottomWidth: 1, borderColor: '#334155' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  syncBtn: { padding: 10, backgroundColor: '#334155', borderRadius: 8, marginLeft: 10 },
  content: { padding: 20 },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#94a3b8', marginBottom: 20 },
  primaryBtn: { backgroundColor: '#6366f1', padding: 15, borderRadius: 12, alignItems: 'center', width: '100%' },
  btnText: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#1e293b', padding: 20, borderRadius: 16, marginBottom: 20 },
  cardTitle: { color: '#94a3b8', fontSize: 14, marginBottom: 8 },
  cardBigText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
  listItem: { backgroundColor: '#1e293b', padding: 15, borderRadius: 12, marginBottom: 10 },
  itemText: { color: '#fff' }
});
