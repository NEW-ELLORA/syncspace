import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pullSyncData } from './SyncEngine';
import { Scanner } from 'lucide-react-native';

export default function Pairing({ onNavigate }: { onNavigate: (route: string) => void }) {
  const [pairingString, setPairingString] = useState('');
  const [status, setStatus] = useState('');

  const handlePair = async () => {
    if (!pairingString.includes('|')) {
      setStatus('Invalid format. Use URL|SECRET');
      return;
    }
    
    setStatus('Pairing...');
    const [url, secret] = pairingString.split('|');
    
    try {
      await pullSyncData(url, secret);
      
      await AsyncStorage.setItem('syncspace_endpoint', url);
      await AsyncStorage.setItem('syncspace_secret', secret);
      
      setStatus('Successfully paired & synced!');
      setTimeout(() => onNavigate('Dashboard'), 1500);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Scanner color="#818cf8" size={32} />
      </View>
      <Text style={styles.title}>Pair with Desktop</Text>
      <Text style={styles.subtitle}>Enter the connection string from your PC Settings</Text>

      <TextInput
        style={styles.input}
        placeholder="http://192.168.1.x:14205|secret..."
        placeholderTextColor="#64748b"
        value={pairingString}
        onChangeText={setPairingString}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity style={styles.primaryBtn} onPress={handlePair}>
        <Text style={styles.btnText}>Connect & Sync</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => onNavigate('Dashboard')}>
        <Text style={styles.secondaryText}>Back to Dashboard</Text>
      </TouchableOpacity>

      {status ? <Text style={styles.statusText}>{status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20, justifyContent: 'center' },
  iconContainer: { alignSelf: 'center', backgroundColor: '#312e81', padding: 20, borderRadius: 100, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 10 },
  subtitle: { color: '#94a3b8', textAlign: 'center', marginBottom: 30, paddingHorizontal: 20 },
  input: { backgroundColor: '#1e293b', color: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#334155', marginBottom: 20 },
  primaryBtn: { backgroundColor: '#6366f1', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  secondaryBtn: { padding: 15, alignItems: 'center' },
  secondaryText: { color: '#94a3b8', fontWeight: '500' },
  statusText: { color: '#fbbf24', textAlign: 'center', marginTop: 20, fontWeight: '500' }
});
