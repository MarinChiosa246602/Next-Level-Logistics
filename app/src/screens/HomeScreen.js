import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import { t } from '../constants/translations';

const HomeScreen = ({ navigation, lang = 'nl', setLang, isOffline = false }) => {
  return (
    <ScrollView style={styles.container}>
      <Header title={t('home.welcome', lang)} />

      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>⚠️ {t('home.offline_banner', lang)}</Text>
        </View>
      )}

      <View style={styles.langContainer}>
        {['en', 'nl', 'fr'].map(l => (
          <TouchableOpacity
            key={l}
            onPress={() => setLang && setLang(l)}
            style={[styles.langButton, lang === l && styles.langButtonActive]}
          >
            <Text style={[styles.langText, lang === l && styles.langTextActive]}>
              {l.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.hero}>
        <Text style={styles.title}>{t('home.title', lang)}</Text>
        <Text style={styles.subtitle}>Manage your harvest data simply.</Text>
      </View>

      <Card style={styles.infoCard}>
        <Text style={styles.cardTitle}>Quick Start</Text>
        <Text style={styles.cardText}>
          Use the Log tab to record your harvest data with photos or manual entry.
        </Text>
      </Card>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.0 • Multi-language Support</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  offlineBanner: {
    backgroundColor: colors.warning,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  offlineText: {
    color: colors.gray900,
    fontWeight: '600',
    fontSize: 14,
  },
  langContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  langButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.gray100,
  },
  langButtonActive: {
    backgroundColor: colors.primary,
  },
  langText: {
    fontSize: 12,
    color: colors.gray600,
    fontWeight: '500',
  },
  langTextActive: {
    color: colors.white,
  },
  hero: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  infoCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  cardText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  footer: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  footerText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
});

export default HomeScreen;

