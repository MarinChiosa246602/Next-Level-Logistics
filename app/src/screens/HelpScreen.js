import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import Card from './Card';
import Button from './Button';
import ResponsiveContainer from './ResponsiveContainer';
import { getResponsiveLayout } from '../utils/responsive';

const HelpScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const faqs = [
    {
      id: 1,
      question: 'How do I log harvest data?',
      answer: 'Navigate to the Log tab, take a photo of your harvest, fill in the details, and submit. Our AI will help auto-fill some information.',
    },
    {
      id: 2,
      question: 'Can I use the app offline?',
      answer: 'Yes! The app works offline and will sync your data when you reconnect to the internet.',
    },
    {
      id: 3,
      question: 'How do I track my harvest history?',
      answer: 'Visit the History tab to see all your past harvest records with dates and status.',
    },
    {
      id: 4,
      question: 'What languages are supported?',
      answer: 'The app supports English, Dutch, and French. Change the language from the Home tab.',
    },
    {
      id: 5,
      question: 'How do I report an issue?',
      answer: 'You can submit feedback and error reports from any screen. We review all reports to improve the app.',
    },
  ];

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <ResponsiveContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Help & Support</Text>
        <Text style={styles.subtitle}>Frequently Asked Questions</Text>
      </View>

      <View style={styles.faqContainer}>
        {faqs.map(faq => (
          <Card key={faq.id} style={styles.faqCard}>
            <TouchableOpacity
              style={styles.faqQuestion}
              onPress={() => toggleFAQ(faq.id)}
              accessible={true}
              accessibilityLabel={`${faq.question}, press to expand`}
              accessibilityRole="button"
              accessibilityState={{ expanded: expandedFAQ === faq.id }}
            >
              <Text style={styles.questionText}>{faq.question}</Text>
              <Text style={styles.expandIcon}>
                {expandedFAQ === faq.id ? '−' : '+'}
              </Text>
            </TouchableOpacity>

            {expandedFAQ === faq.id && (
              <View style={styles.faqAnswer}>
                <Text style={styles.answerText}>{faq.answer}</Text>
              </View>
            )}
          </Card>
        ))}
      </View>

      <Card style={styles.contactCard}>
        <Text style={styles.contactTitle}>Need More Help?</Text>
        <Text style={styles.contactText}>
          Contact our support team for additional assistance with the app.
        </Text>
        <Button
          onPress={() => Alert.alert('Support', 'support@nextlevellogitics.com')}
          variant="secondary"
          fullWidth
          style={styles.contactButton}
          accessibilityLabel="Contact support email"
        >
          Contact Support
        </Button>
      </Card>

      <View style={styles.spacing} />
    </ResponsiveContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body2,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  faqContainer: {
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  faqCard: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  questionText: {
    ...typography.h6,
    color: colors.primary,
    flex: 1,
    marginRight: spacing.md,
  },
  expandIcon: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: 'bold',
  },
  faqAnswer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
    backgroundColor: colors.gray50,
  },
  answerText: {
    ...typography.body2,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  contactCard: {
    marginVertical: spacing.lg,
  },
  contactTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  contactText: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  contactButton: {
    marginTop: spacing.md,
  },
  spacing: {
    height: spacing.xl,
  },
});

export default HelpScreen;
