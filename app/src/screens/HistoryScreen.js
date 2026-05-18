import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadHistory();
    }, [farmerId])
  );

  useEffect(() => {
    loadHistory();
  }, [farmerId]);

  const loadHistory = async () => {
    try {
      const data = await api.getHistory(farmerId);
      setRecords(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load history:', e);
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
  };

  const renderItem = ({ item }) => (
    <Card style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemProduct}>{item.product_type || 'Unknown'}</Text>
        <StatusBadge status={item.status} lang={lang} t={t} />
      </View>

      <View style={styles.itemDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Quantity:</Text>
          <Text style={styles.value}>{item.quantity || 0} {item.quantity_unit || 'kg'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>{item.location || 'Unknown'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>
            {new Date(item.created_at || item.submitted_at).toLocaleDateString()}
          </Text>
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
        keyExtractor={item => item.record_id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemProduct: {
    ...typography.h6,
    color: colors.text.primary,
    flex: 1,
  },
  itemDetails: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.body2,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  value: {
    ...typography.body2,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'right',
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
