import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import ResponsiveContainer from '../components/ResponsiveContainer';
import cargoOfferService from '../services/cargoOfferService';
import { colors, spacing } from '../theme';

const CargoBookingScreen = ({ navigation, route }) => {
  const { offer, farmerId } = route.params;

  const [bigBoxes, setBigBoxes] = useState('');
  const [smallBoxes, setSmallBoxes] = useState('');
  const [pallets, setPallets] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const maxAvailable = offer.cargo_volume_available || 0;
  
  const numBigBoxes = parseInt(bigBoxes) || 0;
  const numSmallBoxes = parseInt(smallBoxes) || 0;
  const numPallets = parseInt(pallets) || 0;
  
  const volumeBooked = (numBigBoxes * 0.02) + (numSmallBoxes * 0.003) + (numPallets * 1.0);
  const isValid = volumeBooked > 0 && volumeBooked <= maxAvailable;

  const handleSubmitBooking = async () => {
    if (!isValid) {
      Alert.alert('Error', `Please enter a volume between 0 and ${maxAvailable.toFixed(2)}m³`);
      return;
    }

    try {
      setLoading(true);

      console.log('Creating booking:', {
        offer_id: offer.offer_id,
        farmer_id: farmerId,
        volume: volumeBooked,
      });

      const result = await cargoOfferService.createBooking(farmerId, {
        offer_id: offer.offer_id,
        booked_by_farmer_id: farmerId,
        cargo_volume_booked: volumeBooked,
        pickup_notes: pickupNotes || null,
      });

      console.log('Booking created:', result);

      Alert.alert('Success', 'Cargo space booked successfully!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.pop(2);
          },
        },
      ]);
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Error', error.message || 'Failed to book cargo space');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveContainer scrollable>
      <Header title="📦 Book Cargo Space" subtitle="Reserve space on this shipment" />

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Shipment Details</Text>
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>From</Text>
            <Text style={styles.detailValue}>{offer.pickup_location_id || 'Farmer Location'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>To</Text>
            <Text style={styles.detailValue}>{offer.delivery_location_label}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Delivery Date</Text>
            <Text style={styles.detailValue}>
              {new Date(offer.delivery_window_start).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Delivery Time</Text>
            <Text style={styles.detailValue}>
              {new Date(offer.delivery_window_start).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              -{' '}
              {new Date(offer.delivery_window_end).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Vehicle</Text>
            <Text style={styles.detailValue}>
              {offer.vehicle_brand} {offer.vehicle_model}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>License Plate</Text>
            <Text style={styles.detailValue}>{offer.license_plate}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Capacity Available</Text>
        <View style={styles.capacityBox}>
          <View style={styles.capacityItem}>
            <Text style={styles.capacityLabel}>Total Capacity</Text>
            <Text style={styles.capacityValue}>
              {(offer.cargo_volume_total || 0).toFixed(2)}m³
            </Text>
          </View>
          <Text style={styles.capacitySeparator}>→</Text>
          <View style={styles.capacityItem}>
            <Text style={styles.capacityLabel}>Available</Text>
            <Text style={[styles.capacityValue, { color: colors.primary }]}>
              {(offer.cargo_volume_available || 0).toFixed(2)}m³
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>How Much Space Do You Need?</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Big Boxes (0.02m³ each)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            value={bigBoxes}
            onChangeText={setBigBoxes}
            keyboardType="number-pad"
            editable={!loading}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Small Cartons (0.003m³ each)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            value={smallBoxes}
            onChangeText={setSmallBoxes}
            keyboardType="number-pad"
            editable={!loading}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Pallets (1.0m³ each)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            value={pallets}
            onChangeText={setPallets}
            keyboardType="number-pad"
            editable={!loading}
          />
        </View>

        <View style={[styles.formGroup, styles.calculationBox]}>
          <Text style={styles.label}>Calculated Volume Booked:</Text>
          <Text style={[
            styles.calculatedVolume, 
            volumeBooked > maxAvailable ? { color: colors.error } : { color: colors.primary }
          ]}>
            {volumeBooked.toFixed(3)}m³
          </Text>
          
          {volumeBooked > maxAvailable && (
            <Text style={styles.errorText}>
              ⚠️ Exceeds available space ({maxAvailable.toFixed(2)}m³)
            </Text>
          )}
          {volumeBooked > 0 && volumeBooked <= maxAvailable && (
            <Text style={styles.successText}>
              ✓ {((volumeBooked / maxAvailable) * 100).toFixed(0)}% of available space
            </Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Special Requests (Optional)</Text>
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            placeholder="e.g., Handle with care, refrigerated transport..."
            value={pickupNotes}
            onChangeText={setPickupNotes}
            multiline
            editable={!loading}
          />
        </View>
      </Card>

      <Card style={[styles.card, styles.lastCard]}>
        <View style={styles.buttonGroup}>
          <Button
            variant="outline"
            onPress={() => navigation.goBack()}
            style={{ flex: 1, marginRight: 8 }}
            disabled={loading}
          >
            ← Cancel
          </Button>
          <Button
            variant="primary"
            onPress={handleSubmitBooking}
            style={{ flex: 1 }}
            disabled={!isValid || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              '✓ Confirm Booking'
            )}
          </Button>
        </View>
      </Card>
    </ResponsiveContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  lastCard: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  detailLabel: {
    fontSize: 11,
    color: '#9e9e9e',
    textTransform: 'uppercase',
    marginBottom: 4,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#212121',
  },
  capacityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  capacityItem: {
    alignItems: 'center',
    flex: 1,
  },
  capacityLabel: {
    fontSize: 11,
    color: '#9e9e9e',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  capacityValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  capacitySeparator: {
    fontSize: 16,
    color: '#bdbdbd',
    fontWeight: '300',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#757575',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#212121',
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: '#f44336',
    backgroundColor: '#ffebee',
  },
  errorText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 6,
    fontWeight: '500',
  },
  successText: {
    fontSize: 12,
    color: '#4caf50',
    marginTop: 6,
    fontWeight: '500',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  calculationBox: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  calculatedVolume: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
});

export default CargoBookingScreen;
