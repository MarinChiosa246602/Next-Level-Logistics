import React from 'react';
import { View, StyleSheet, useWindowDimensions, ScrollView } from 'react-native';
import { colors, spacing } from '../theme';
import { getResponsivePadding, getResponsiveLayout } from '../utils/responsive';

const ResponsiveContainer = ({ children, scrollable = true, style }) => {
  const { width, height } = useWindowDimensions();
  const padding = getResponsivePadding(width);
  const layout = getResponsiveLayout(width);

  const Wrapper = scrollable ? ScrollView : View;

  return (
    <Wrapper
      style={[
        styles.container,
        { paddingHorizontal: padding },
        style,
      ]}
      contentContainerStyle={scrollable ? { flexGrow: 1 } : undefined}
    >
      <View style={{ maxWidth: layout.maxWidth, width: '100%', alignSelf: 'center' }}>
        {children}
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default ResponsiveContainer;
