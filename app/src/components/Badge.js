import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

const Badge = ({ label, status, variant = 'default' }) => {
  const getVariantStyles = () => {
    const variants = {
      default: { bg: colors.gray100, text: colors.gray700 },
      success: { bg: '#E8F5E9', text: colors.success },
      error: { bg: '#FFEBEE', text: colors.error },
      warning: { bg: '#FFF3E0', text: colors.warning },
      info: { bg: '#E3F2FD', text: colors.info },
    };

    if (status) {
      return variants[status] || variants.default;
    }
    return variants[variant] || variants.default;
  };

  const styles_variant = getVariantStyles();

  return (
    <View style={[styles.badge, { backgroundColor: styles_variant.bg }]}>
      <Text style={[styles.text, { color: styles_variant.text }]}>
        {label || status}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.label,
  },
});

export default Badge;
