import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { t } from '../constants/translations';

const HomeScreen = ({ navigation, lang = 'nl', isOffline = false }) => {
  return (
    <View style={styles.container}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>{t('home.offline_banner', lang)}</Text>
        </View>
      )}

      <View style={styles.hero}>
        <Text style={styles.title}>{t('home.title', lang)}</Text>
        <Text style={styles.subtitle}>Manage your harvest data simply.</Text>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: '#007AFF' }]}
          onPress={() => navigation.navigate('Submission')}
        >
          <Text style={styles.menuButtonText}>{t('home.log_harvest', lang)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: '#34C759' }]}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.menuButtonText}>{t('home.my_records', lang)}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.0 • Dutch / English / French</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  offlineBanner: { backgroundColor: '#FFCC00', padding: 10, alignItems: 'center' },
  offlineText: { color: '#333', fontWeight: 'bold', fontSize: 14 },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  subtitle: { fontSize: 18, color: '#666', marginTop: 10, textAlign: 'center' },
  menu: { flex: 1, justifyContent: 'center', padding: 30, gap: 20 },
  menuButton: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  menuButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  footer: { padding: 20, alignItems: 'center' },
  footerText: { color: '#ccc', fontSize: 12 },
});

export default HomeScreen;
