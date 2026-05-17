import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import { getAccessibleTouchTarget } from '../utils/accessibility';

const Button = ({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const variants = {
    primary: {
      backgroundColor: colors.primary,
      pressedBackgroundColor: colors.primaryDark,
    },
    secondary: {
      backgroundColor: colors.secondary,
      pressedBackgroundColor: colors.secondaryLight,
    },
    success: {
      backgroundColor: colors.success,
      pressedBackgroundColor: colors.primaryDark,
    },
    error: {
      backgroundColor: colors.error,
      pressedBackgroundColor: '#B71C1C',
    },
    outline: {
      backgroundColor: colors.white,
      borderColor: colors.primary,
      borderWidth: 1,
    },
  };

  const sizes = {
    sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, fontSize: 14, minHeight: 40 },
    md: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, fontSize: 16, minHeight: 44 },
    lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, fontSize: 18, minHeight: 48 },
  };

  const variant_style = variants[variant] || variants.primary;
  const size_style = sizes[size] || sizes.md;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel || String(children)}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      style={[
        styles.button,
        {
          backgroundColor: disabled ? colors.gray300 : variant_style.backgroundColor,
          borderColor: variant_style.borderColor,
          borderWidth: variant_style.borderWidth || 0,
          ...size_style,
          width: fullWidth ? '100%' : 'auto',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.white} />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: variant === 'outline' ? colors.primary : colors.white,
              fontSize: size_style.fontSize,
            },
          ]}
          allowFontScaling={true}
          maxFontSizeMultiplier={1.3}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
    color: colors.white,
  },
});

export default Button;
