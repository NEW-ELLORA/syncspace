import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import Dashboard from './src/Dashboard';
import Pairing from './src/Pairing';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('Dashboard');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      {currentRoute === 'Dashboard' && <Dashboard onNavigate={setCurrentRoute} />}
      {currentRoute === 'Pairing' && <Pairing onNavigate={setCurrentRoute} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  }
});
