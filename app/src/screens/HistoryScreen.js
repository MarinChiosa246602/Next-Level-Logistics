import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { api } from '../services/api';
import { colors, typography, spacing, radius } from '../theme';
import Header from '../components/Header';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { t } from '../constants/translations';
import { StatusBadge } from '../components/Selectors';

const HistoryScreen = ({ farmerId, lang = 'nl' }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [farmerId]);

  const loadHistory = async () => {
    try {
      const data = await api.getHistory(farmerId);
      setRecords(data);
    } catch (e) {
      console.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <Card style={styles.item}>
      <View style={styles.itemContent}>
        <View style={styles.itemMain}>
          <Text style={styles.itemProduct}>{item.product.type}</Text>
          <Text style={styles.itemQty}>
            {item.quantity.estimated} {item.quantity.unit}
          </Text>
        </View>
        <View style={styles.itemMeta}>
          <Text style={styles.itemDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
          <StatusBadge status={item.status} lang={lang} t={t} />
        </View>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Harvest Records" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Harvest Records" subtitle={`${records.length} total entries`} />
      <FlatList
        data={records}
        keyExtractor={item => item.record_id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No harvest records yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  item: {
    marginBottom: spacing.md,
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemMain: {
    flex: 1,
  },
  itemProduct: {
    ...typography.h6,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  itemQty: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  itemMeta: {
    alignItems: 'flex-end',
    marginLeft: spacing.md,
  },
  itemDate: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    ...typography.body2,
    color: colors.text.tertiary,
  },
});

export default HistoryScreen;
