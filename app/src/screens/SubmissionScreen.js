import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, TextInput, ActivityIndicator, Modal, useWindowDimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';
import { offlineQueue } from '../services/offlineQueue';
import { feedbackService } from '../services/feedbackService';
import { colors, typography, spacing, radius } from '../theme';
import { t } from '../constants/translations';
import { ConditionSelector, ProductTypeSelector, LocationSelector, UnitSelector } from '../components/Selectors';
import Button from '../components/Button';
import Card from '../components/Card';
import Header from '../components/Header';
import ResponsiveContainer from '../components/ResponsiveContainer';
import FeedbackModal from '../components/FeedbackModal';
import { productTypes } from '../services/sampleData';

const SubmissionScreen = ({ farmerId, farmId, lang = 'nl' }) => {
  const { width } = useWindowDimensions();
  const [form, setForm] = useState({
    product_type: '',
    quantity: '',
    quantity_unit: 'kg',
    condition: 'good',
    location_id: '',
    notes: '',
  });
  const [locations, setLocations] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiWarning, setAiWarning] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [processedPhotoUrl, setProcessedPhotoUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const [photoAccepted, setPhotoAccepted] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  async function loadLocations() {
    if (!farmId) {
      console.warn('No farmId provided');
      return;
    }

    try {
      const data = await api.getLocations(farmId);
      console.log('API response:', data);

      let locationsArray = [];
      if (Array.isArray(data)) {
        locationsArray = data;
      } else if (data && Array.isArray(data.locations)) {
        locationsArray = data.locations;
      }

      console.log('Parsed locations:', locationsArray);

      if (locationsArray.length > 0) {
        setLocations(locationsArray);
      } else {
        throw new Error('No locations returned from API');
      }
    } catch (e) {
      console.error('Error loading locations:', e);
      // Fallback to sample locations from sampleData
      try {
        const { sampleLocations } = require('../services/sampleData');
        const fallback = sampleLocations.filter(loc => loc.farm_id === farmId);
        const finalLocations = fallback.length > 0 ? fallback : sampleLocations;
        console.log('Using fallback locations:', finalLocations);
        setLocations(finalLocations);
      } catch (fallbackError) {
        console.error('Failed to load fallback locations:', fallbackError);
        setLocations([]);
      }
    }
  }

  useEffect(() => {
    loadLocations();
  }, [farmId]);

  const handlePhotoCapture = async () => {
    setIsProcessing(true);
    setAiWarning(null);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error', lang), t('submission.camera_permission', lang));
        setIsProcessing(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled === false) {
        const localUri = result.assets[0].uri;
        setCapturedImage(localUri);
        // Process AI in background without blocking UI
        processPhotoWithAI(localUri).catch(e => {
          console.error('AI processing error:', e);
          setAiWarning(t('submission.ai_fallback', lang));
        });
      }
      setIsProcessing(false);
    } catch (e) {
      console.error('Photo capture error:', e);
      Alert.alert(t('common.error', lang), t('submission.camera_error', lang));
      setIsProcessing(false);
    }
  };

  const processPhotoWithAI = async (imageUri) => {
    setIsUploading(true);
    setAiWarning(null);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'harvest_photo.jpg',
      });

      const data = await api.uploadPhoto(formData);
      const fileUrl = data.file_url;
      const filePath = data.file_path;

      const aiData = await api.analyzePhoto(fileUrl, filePath);

      setProcessedPhotoUrl(fileUrl);
      setAiResults(aiData);
      setForm({
        ...form,
        product_type: aiData.product_type || form.product_type,
        quantity: aiData.estimated_quantity?.toString() || form.quantity,
        quantity_unit: aiData.quantity_unit || form.quantity_unit,
        condition: aiData.condition_rating || form.condition,
      });

      if (aiData.confidence?.overall < 0.6) {
        setAiWarning(t('submission.low_confidence', lang));
      }
      return fileUrl;
    } catch (e) {
      console.error('AI processing error:', e);
      setAiWarning(t('submission.ai_fallback', lang));
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setProcessedPhotoUrl(null);
    setShowRetakeModal(false);
    setAiResults(null);
    setPhotoAccepted(false);
  };

  const handleKeepPhoto = () => {
    setShowRetakeModal(false);
    setPhotoAccepted(true);
    // Photo is now ready for submission
  };

  const handleSubmit = async () => {
    if (!form.location_id) {
      Alert.alert(t('common.error', lang), t('submission.location_required', lang));
      return;
    }

    setIsSubmitting(true);
    const inputMethod = capturedImage ? 'photo' : 'form';
    const payload = {
      farmer_id: farmerId,
      submitted_at: new Date().toISOString(),
      input_method: inputMethod,
      location_id: form.location_id,
      form_fields: {
        product_type: form.product_type,
        quantity: parseFloat(form.quantity) || 0,
        quantity_unit: form.quantity_unit,
        condition: form.condition,
        notes: form.notes,
      },
      photo: capturedImage ? { file_url: processedPhotoUrl || capturedImage } : null,
    };

    try {
      const result = await api.submitRecord(payload);
      Alert.alert(t('common.success', lang), t('submission.success', lang));
      setForm({
        product_type: '',
        quantity: '',
        quantity_unit: 'kg',
        condition: 'good',
        location_id: '',
        notes: '',
      });
      setCapturedImage(null);
      setProcessedPhotoUrl(null);
      setAiResults(null);
      setPhotoAccepted(false);
    } catch (e) {
      await offlineQueue.enqueue(payload);
      Alert.alert(t('common.error', lang), t('submission.offline_queued', lang));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title={t('submission.title', lang)} />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Card style={styles.photoCard}>
            <Text style={styles.sectionTitle}>📸 Capture Photo</Text>
            <TouchableOpacity
              style={[styles.photoButton, (isProcessing || isUploading) && styles.photoButtonDisabled]}
              onPress={handlePhotoCapture}
              disabled={isProcessing || isUploading}
              accessible={true}
              accessibilityLabel="Take photo of harvest"
              accessibilityHint="Opens camera to capture harvest photo for automatic analysis"
            >
              {isProcessing || isUploading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={colors.white} size="small" accessible={true} accessibilityLabel="Loading" />
                  <Text style={styles.loadingText} allowFontScaling={true} maxFontSizeMultiplier={1.3}>
                    {isUploading ? t('submission.analyzing_ai', lang) : t('submission.capturing', lang)}
                  </Text>
                </View>
              ) : (
                <Text style={styles.photoButtonText} allowFontScaling={true} maxFontSizeMultiplier={1.3}>
                  {t('submission.take_photo', lang)}
                </Text>
              )}
            </TouchableOpacity>
            {capturedImage && (
              <View style={styles.previewContainer}>
                <Image source={{ uri: capturedImage }} style={styles.previewImage} />
                {photoAccepted ? (
                  <View style={styles.acceptedPhotoContainer}>
                    <Text style={styles.acceptedPhotoText}>✓ Photo Accepted</Text>
                    <Button
                      variant="secondary"
                      onPress={() => {
                        setPhotoAccepted(false);
                        setCapturedImage(null);
                        setProcessedPhotoUrl(null);
                      }}
                      fullWidth
                      size="sm"
                      style={{ marginTop: spacing.md }}
                    >
                      Change Photo
                    </Button>
                  </View>
                ) : (
                  <>
                    <Text style={styles.previewLabel} allowFontScaling={true}>{t('submission.photo_preview', lang)}</Text>
                    <View style={styles.photoActionButtons}>
                      <Button
                        variant="error"
                        onPress={handleRetake}
                        fullWidth
                        size="md"
                        style={styles.photoActionButton}
                      >
                        🔄 Retake
                      </Button>
                      <Button
                        variant="success"
                        onPress={handleKeepPhoto}
                        fullWidth
                        size="md"
                        style={styles.photoActionButton}
                      >
                        ✓ Use Photo
                      </Button>
                    </View>
                  </>
                )}
              </View>
            )}
            {aiWarning && <Text style={styles.warningText} allowFontScaling={true}>⚠️ {aiWarning}</Text>}
          </Card>

          <Card style={styles.formCard}>
            <Text style={styles.sectionTitle}>📋 Form Details</Text>

            <View>
              <Text style={styles.label}>{t('submission.product_type', lang)}</Text>
              <ProductTypeSelector
                value={form.product_type}
                onChange={val => setForm({...form, product_type: val})}
                options={productTypes}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>{t('submission.quantity', lang)}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={form.quantity}
                  onChangeText={val => setForm({...form, quantity: val})}
                  placeholder="0"
                  accessible={true}
                  accessibilityLabel="Quantity"
                  accessibilityHint="Enter the quantity of harvest"
                  maxFontSizeMultiplier={1.3}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>{t('submission.unit', lang)}</Text>
                <UnitSelector
                  value={form.quantity_unit}
                  onChange={val => setForm({...form, quantity_unit: val})}
                />
              </View>
            </View>

            <View>
              <Text style={styles.label}>{t('submission.condition', lang)}</Text>
              <ConditionSelector
                value={form.condition}
                onChange={val => setForm({...form, condition: val})}
                lang={lang}
                t={t}
              />
            </View>

            <View>
              <Text style={styles.label}>{t('submission.location', lang)}</Text>
              {locations.length === 0 ? (
                <Text style={styles.errorText}>⚠️ No locations available. Please check your farm setup.</Text>
              ) : (
                <LocationSelector
                  value={form.location_id}
                  onChange={val => setForm({...form, location_id: val})}
                  locations={locations}
                />
              )}
            </View>

            <View>
              <Text style={styles.label}>{t('submission.notes', lang)}</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                multiline
                value={form.notes}
                onChangeText={val => setForm({...form, notes: val})}
                placeholder="Add any additional notes..."
                accessible={true}
                accessibilityLabel="Additional notes"
                maxFontSizeMultiplier={1.3}
              />
            </View>
          </Card>

          <Button
            onPress={handleSubmit}
            disabled={!form.location_id}
            loading={isSubmitting}
            variant="success"
            fullWidth
            size="lg"
            style={styles.submitButton}
            accessibilityLabel="Submit harvest record"
            accessibilityHint="Submits the harvest data to the server"
          >
            {t('submission.submit', lang)}
          </Button>

          <TouchableOpacity
            style={styles.feedbackButton}
            onPress={() => setShowFeedback(true)}
            accessible={true}
            accessibilityLabel="Send feedback about this page"
            accessibilityRole="button"
          >
            <Text style={styles.feedbackText}>💬 Feedback</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <FeedbackModal
        visible={showFeedback}
        onClose={() => setShowFeedback(false)}
        context="submission_screen"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  photoCard: {
    marginBottom: spacing.lg,
  },
  photoButton: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  photoButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  photoButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: 200,
    height: 150,
    borderRadius: radius.lg,
    borderColor: colors.border,
    borderWidth: 1,
  },
  previewLabel: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  warningText: {
    color: colors.error,
    marginTop: spacing.md,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
    backgroundColor: '#FFEBEE',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  photoActionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  photoActionButton: {
    flex: 1,
  },
  formCard: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    fontSize: 16,
    color: colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  col: {
    flex: 1,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    width: '85%',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: 250,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  modalButtonMargin: {
    marginRight: spacing.sm,
  },
  feedbackButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  feedbackText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontWeight: '500',
    backgroundColor: '#FFEBEE',
    padding: spacing.md,
    borderRadius: radius.lg,
  },
});

export default SubmissionScreen;
