import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '../theme';

const Header = ({ title, subtitle, rightAction, onBackPress, showBack = false }) => {
  return (
    <View style={styles.header}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {rightAction && <View style={styles.action}>{rightAction}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.h5,
    color: colors.white,
  },
  subtitle: {
    ...typography.body2,
    color: colors.white,
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  action: {
    marginLeft: spacing.md,
  },
});

export default Header;
