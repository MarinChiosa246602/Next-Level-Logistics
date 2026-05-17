import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, ScrollView } from 'react-native';
import { userSession } from '../services/userSession';
import { colors, typography, spacing, radius } from '../theme';
import Header from '../components/Header';
import Button from '../components/Button';
import Card from '../components/Card';
import { t } from '../constants/translations';

const LoginScreen = ({ navigation, lang = 'nl' }) => {
  const [farmerId, setFarmerId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!farmerId.trim()) {
      Alert.alert('Error', 'Please enter a Farmer ID');
      return;
    }

    setLoading(true);
    try {
      await userSession.setFarmer({
        farmer_id: farmerId,
        farm_id: '00000000-0000-0000-0000-000000000000',
        name: 'Selected Farmer'
      });

      navigation.navigate('Home', {
        farmer_id: farmerId,
        farm_id: '00000000-0000-0000-0000-000000000000',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Header title="Farmer Login" />

        <View style={styles.content}>
          <Card style={styles.card}>
            <Text style={styles.title}>{t('home.welcome', lang)}</Text>
            <Text style={styles.subtitle}>Enter your Farmer ID to access the system</Text>

            <TextInput
              style={styles.input}
              placeholder="e.g. ae94c048-e694-4c0d..."
              placeholderTextColor={colors.text.tertiary}
              value={farmerId}
              onChangeText={setFarmerId}
              editable={!loading}
            />

            <Button
              onPress={handleLogin}
              disabled={!farmerId.trim() || loading}
              loading={loading}
              fullWidth
            >
              Enter System
            </Button>
          </Card>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              🌾 Harvest Data Collection App • v1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  card: {
    marginVertical: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.white,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  footerText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
});

export default LoginScreen;
