import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme';

export const ConditionSelector = ({ value, onChange, lang = 'nl', t }) => {
  const options = [
    { id: 'good', label: t('common.good', lang), icon: '✅' },
    { id: 'mixed', label: t('common.mixed', lang), icon: '⚠️' },
    { id: 'damaged', label: t('common.damaged', lang), icon: '❌' },
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
            {opt.icon} {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export const StatusBadge = ({ status, lang = 'nl', t }) => {
  const statusColors = {
    confirmed: { bg: '#E8F5E9', text: colors.success },
    pending: { bg: '#FFF3E0', text: colors.warning },
    flagged: { bg: '#FFEBEE', text: colors.error },
    rejected: { bg: '#F5F5F5', text: colors.gray600 },
  };

  const statusStyle = statusColors[status] || statusColors.rejected;
  const label = t(`common.${status}`, lang) || status;

  return (
    <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
      <Text style={[styles.badgeText, { color: statusStyle.text }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  activeChip: {
    borderColor: colors.primary,
    backgroundColor: '#E8F5E9',
  },
  text: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  activeText: {
    color: colors.primary,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

