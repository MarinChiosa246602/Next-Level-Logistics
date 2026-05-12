import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { api } from '../services/api';
import { t } from '../constants/translations';
import { StatusBadge } from '../components/Selectors';

const HistoryScreen = ({ farmerId, lang = 'nl' }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await api.getHistory(farmerId);
        setRecords(data);
      } catch (e) {
        console.error('Failed to load history');
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [farmerId]);

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <View style={styles.itemMain}>
        <Text style={styles.itemProduct}>{item.product.type}</Text>
        <Text style={styles.itemQty}>{item.quantity.estimated} {item.quantity.unit}</Text>
      </View>
      <View style={styles.itemMeta}>
        <Text style={styles.itemDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        <StatusBadge status={item.status} lang={lang} t={t} />
      </View>
    </View>
  );

  if (loading) return <View style={styles.center}><Text>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('home.my_records', lang)}</Text>
      <FlatList
        data={records}
        keyExtractor={item => item.record_id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingBottom: 20 },
  item: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 5,
    borderLeftColor: '#007AFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemMain: { flex: 1 },
  itemProduct: { fontSize: 18, fontWeight: '600', color: '#333' },
  itemQty: { fontSize: 14, color: '#666' },
  itemMeta: { alignItems: 'flex-end' },
  itemDate: { fontSize: 12, color: '#999', marginBottom: 4 },
});

export default HistoryScreen;
