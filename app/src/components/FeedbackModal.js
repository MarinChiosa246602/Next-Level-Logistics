import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import Header from './Header';
import Button from './Button';
import { feedbackService } from '../services/feedbackService';

const FeedbackModal = ({ visible, onClose, context = '' }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Please select a rating');
      return;
    }

    setLoading(true);
    try {
      await feedbackService.submitRating(rating, comment);
      Alert.alert('Thank you!', 'Your feedback helps us improve');
      setRating(0);
      setComment('');
      onClose();
    } catch (e) {
      Alert.alert('Error', 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <Text style={styles.title}>How's your experience?</Text>

        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map(num => (
            <Text
              key={num}
              style={[styles.star, rating >= num && styles.starActive]}
              onPress={() => setRating(num)}
            >
              {rating >= num ? '⭐' : '☆'}
            </Text>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Additional comments (optional)"
          multiline
          numberOfLines={4}
          value={comment}
          onChangeText={setComment}
          placeholderTextColor={colors.text.tertiary}
        />

        <View style={styles.buttons}>
          <Button
            variant="outline"
            onPress={onClose}
            fullWidth
            style={styles.buttonMargin}
          >
            Cancel
          </Button>
          <Button
            loading={loading}
            onPress={handleSubmit}
            fullWidth
          >
            Submit
          </Button>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    width: '80%',
    maxWidth: 400,
  },
  title: {
    ...typography.h6,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  star: {
    fontSize: 32,
    padding: spacing.xs,
  },
  starActive: {
    opacity: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    minHeight: 80,
    color: colors.text.primary,
    textAlignVertical: 'top',
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  buttonMargin: {
    marginRight: spacing.sm,
  },
});

export default FeedbackModal;
