import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';
import { offlineQueue } from '../services/offlineQueue';
import { t } from '../constants/translations';
import { ConditionSelector } from '../components/Selectors';
import { Picker } from '@react-native-picker/picker';

const SubmissionScreen = ({ farmerId, farmId, lang = 'nl' }) => {
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

  async function loadLocations() {
    try {
      const data = await api.getLocations(farmId);
      setLocations(data.locations);
    } catch (e) {
      Alert.alert(t('common.error', lang), t('common.error', lang));
    }
  }

  React.useEffect(() => {
    loadLocations();
  }, [farmId]);

  const handlePhotoCapture = async () => {
    setIsProcessing(true);
    setAiWarning(null);
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos');
        setIsProcessing(false);
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        // Photo taken successfully - simulate AI processing
        Alert.alert('Photo captured', 'Processing with AI...');
        
        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // For demo purposes, simulate AI pre-fill with sample data
        const mockAiResult = {
          product_type: 'Tomatoes',
          quantity: '25',
          quantity_unit: 'kg',
          condition: 'good'
        };

        setForm({
          ...form,
          ...mockAiResult
        });

        Alert.alert('Success', 'Form pre-filled from photo analysis!');
      } else {
        setIsProcessing(false);
      }
    } catch (e) {
      console.error('Photo capture error:', e);
      Alert.alert('Error', 'Failed to capture photo');
      setIsProcessing(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.location_id) {
      Alert.alert('Error', t('submission.location', lang));
      return;
    }

    const payload = {
      farmer_id: farmerId,
      submitted_at: new Date().toISOString(),
      input_method: 'mixed',
      location_id: form.location_id,
      form_fields: {
        product_type: form.product_type,
        quantity: parseFloat(form.quantity),
        quantity_unit: form.quantity_unit,
        condition: form.condition,
        notes: form.notes,
      }
    };

    try {
      await api.submitRecord(payload);
      Alert.alert(t('common.success', lang), 'Record submitted!');
    } catch (e) {
      // Offline support: enqueue if request fails
      await offlineQueue.enqueue(payload);
      Alert.alert('Offline', t('home.offline_banner', lang));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t('submission.title', lang)}</Text>

      <View style={styles.photoSection}>
        <TouchableOpacity style={styles.photoButton} onPress={handlePhotoCapture}>
          <Text style={styles.photoButtonText}>
            {isProcessing ? t('submission.ai_processing', lang) : t('submission.take_photo', lang)}
          </Text>
        </TouchableOpacity>
        {aiWarning && <Text style={styles.warningText}>{aiWarning}</Text>}
      </View>

      <Text style={styles.label}>{t('submission.product_type', lang)}</Text>
      <Picker
        style={styles.picker}
        selectedValue={form.product_type}
        onValueChange={val => setForm({...form, product_type: val})}
      >
        <Picker.Item label="Select product..." value="" />
        <Picker.Item label="Tomatoes" value="Tomatoes" />
        <Picker.Item label="Carrots" value="Carrots" />
        <Picker.Item label="Apples" value="Apples" />
        <Picker.Item label="Wheat" value="Wheat" />
      </Picker>

      <Text style={styles.label}>{t('submission.quantity', lang)}</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={form.quantity}
        onChangeText={val => setForm({...form, quantity: val})}
      />

      <Text style={styles.label}>{t('submission.unit', lang)}</Text>
      <Picker
        style={styles.picker}
        selectedValue={form.quantity_unit}
        onValueChange={val => setForm({...form, quantity_unit: val})}
      >
        <Picker.Item label="Kilograms (kg)" value="kg" />
        <Picker.Item label="Crates" value="crates" />
        <Picker.Item label="Units" value="units" />
        <Picker.Item label="Boxes" value="boxes" />
      </Picker>

      <Text style={styles.label}>{t('submission.condition', lang)}</Text>
      <ConditionSelector
        value={form.condition}
        onChange={val => setForm({...form, condition: val})}
        lang={lang}
        t={t}
      />

      <Text style={styles.label}>{t('submission.location', lang)}</Text>
      <Picker
        style={styles.picker}
        selectedValue={form.location_id}
        onValueChange={val => setForm({...form, location_id: val})}
      >
        <Picker.Item label="Select a location..." value="" />
        {locations.map(loc => (
          <Picker.Item key={loc.location_id} label={loc.label} value={loc.location_id} />
        ))}
      </Picker>

      <Text style={styles.label}>{t('submission.notes', lang)}</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        multiline
        value={form.notes}
        onChangeText={val => setForm({...form, notes: val})}
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>{t('submission.submit', lang)}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f9f9f9' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#333', textAlign: 'center' },
  label: { fontSize: 18, fontWeight: '500', marginBottom: 8, color: '#555', marginTop: 15 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 15, borderRadius: 8, backgroundColor: '#fff', fontSize: 16 },
  picker: { borderWidth: 1, borderColor: '#ccc', marginBottom: 15, borderRadius: 8, backgroundColor: '#fff' },
  photoSection: { marginBottom: 20, alignItems: 'center' },
  photoButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center' },
  photoButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  warningText: { color: '#c53030', marginTop: 10, fontSize: 14, textAlign: 'center' },
  submitButton: { backgroundColor: '#28a745', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 30, marginBottom: 50 },
  submitButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
});

export default SubmissionScreen;
