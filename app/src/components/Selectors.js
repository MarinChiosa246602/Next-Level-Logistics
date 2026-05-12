import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const ConditionSelector = ({ value, onChange, lang = 'nl', t }) => {
  const options = [
    { id: 'good', label: t('common.good', lang) },
    { id: 'mixed', label: t('common.mixed', lang) },
    { id: 'damaged', label: t('common.damaged', lang) },
  ];

  return (
    <View style={styles.container}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.id}
          style={[styles.chip, value === opt.id && styles.activeChip]}
          onPress={() => onChange(opt.id)}
        >
          <Text style={[styles.text, value === opt.id && styles.activeText]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export const StatusBadge = ({ status, lang = 'nl', t }) => {
  const colors = {
    confirmed: '#e6fffa',
    text_confirmed: '#2c7a7b',
    pending: '#fffaf0',
    text_pending: '#b7791f',
    flagged: '#fff5f5',
    text_flagged: '#c53030',
    rejected: '#edf2f7',
    text_rejected: '#4a5568',
  };

  const label = t(`common.${status}`, lang) || status;

  return (
    <View style={[styles.badge, { backgroundColor: colors[status] || colors.rejected }]}>
      <Text style={[styles.badgeText, { color: colors[`text_${status}`] || colors.text_rejected }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  chip: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  activeChip: {
    borderColor: '#007AFF',
    backgroundColor: '#eef6ff',
  },
  text: { fontSize: 16, color: '#666' },
  activeText: { color: '#007AFF', fontWeight: 'bold' },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
});
