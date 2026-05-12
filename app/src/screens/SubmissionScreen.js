import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Picker, StyleSheet, Alert, ScrollView } from 'react-native';
import { api } from '../services/api';

const SubmissionScreen = ({ farmerId, farmId }) => {
  const [form, setForm] = useState({
    product_type: '',
    quantity: '',
    quantity_unit: 'kg',
    condition: 'good',
    location_id: '',
    notes: '',
  });
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    async function loadLocations() {
      try {
        const data = await api.getLocations(farmId);
        setLocations(data.locations);
      } catch (e) {
        Alert.alert('Error', 'Could not load locations');
      }
    }
    loadLocations();
  }, [farmId]);

  const handleSubmit = async () => {
    if (!form.location_id) {
      Alert.alert('Error', 'Please select a location');
      return;
    }

    const payload = {
      farmer_id: farmerId,
      submitted_at: new Date().toISOString(),
      input_method: 'form',
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
      const result = await api.submitRecord(payload);
      Alert.alert('Success', `Record submitted! ID: ${result.record_id}`);
    } catch (e) {
      Alert.alert('Error', 'Submission failed');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Log Harvest</Text>

      <Text>Product Type</Text>
      <TextInput
        style={styles.input}
        value={form.product_type}
        onChangeText={val => setForm({...form, product_type: val})}
      />

      <Text>Quantity</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={form.quantity}
        onChangeText={val => setForm({...form, quantity: val})}
      />

      <Text>Unit</Text>
      <Picker
        selectedValue={form.quantity_unit}
        onValueChange={val => setForm({...form, quantity_unit: val})}
      >
        <Picker.Item label="Kilograms (kg)" value="kg" />
        <Picker.Item label="Crates" value="crates" />
        <Picker.Item label="Units" value="units" />
        <Picker.Item label="Boxes" value="boxes" />
      </Picker>

      <Text>Condition</Text>
      <View style={styles.chipContainer}>
        {['good', 'mixed', 'damaged'].map(status => (
          <Button
            key={status}
            title={status}
            color={form.condition === status ? 'blue' : 'gray'}
            onPress={() => setForm({...form, condition: status})}
          />
        ))}
      </View>

      <Text>Location</Text>
      <Picker
        selectedValue={form.location_id}
        onValueChange={val => setForm({...form, location_id: val})}
      >
        <Picker.Item label="Select a location..." value="" />
        {locations.map(loc => (
          <Picker.Item key={loc.location_id} label={loc.label} value={loc.location_id} />
        ))}
      </Picker>

      <Text>Notes (Optional)</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        multiline
        value={form.notes}
        onChangeText={val => setForm({...form, notes: val})}
      />

      <Button title="Submit" onPress={handleSubmit} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
  chipContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 }
});

export default SubmissionScreen;
