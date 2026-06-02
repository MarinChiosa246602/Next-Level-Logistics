import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import ResponsiveContainer from '../components/ResponsiveContainer';
import { rdwService } from '../services/rdwService';
import cargoOfferService from '../services/cargoOfferService';
import { locationService } from '../services/locationService';
import { colors, spacing } from '../theme';

const CargoOfferCreationScreen = ({ navigation, route }) => {
  const farmerId = route?.params?.farmerId;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleData, setVehicleData] = useState(null);
  const [searchingVehicle, setSearchingVehicle] = useState(false);

  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [deliveryLat, setDeliveryLat] = useState('');
  const [deliveryLng, setDeliveryLng] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date());
  const [deliveryStartTime, setDeliveryStartTime] = useState(new Date());
  const [deliveryEndTime, setDeliveryEndTime] = useState(new Date());
  const [driverPhone, setDriverPhone] = useState('');
  const [driverNotes, setDriverNotes] = useState('');

  const [pickupLat, setPickupLat] = useState('');
  const [pickupLng, setPickupLng] = useState('');
  const [pickupLocationName, setPickupLocationName] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const handleUseCurrentLocation = async () => {
    try {
      setGettingLocation(true);
      const location = await locationService.getCurrentLocation();

      setPickupLat(location.latitude.toString());
      setPickupLng(location.longitude.toString());

      const address = await locationService.reverseGeocode(
        location.latitude,
        location.longitude
      );

      if (address) {
        setPickupLocationName(address.city || address.fullAddress || 'Current Location');
      } else {
        setPickupLocationName(`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
      }

      Alert.alert('Success', 'Location captured successfully!');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', error.message || 'Failed to get your location. Please enable location services.');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSearchVehicle = async () => {
    if (!licensePlate.trim()) {
      Alert.alert('Error', 'Please enter a license plate');
      return;
    }

    try {
      setSearchingVehicle(true);
      const data = await rdwService.getVehicleData(licensePlate);

      if (!data) {
        Alert.alert('Not Found', 'Vehicle not found. Please check the license plate.');
        return;
      }

      const totalCapacity = (data.cargoVolume || data.bootCapacity || 0) * 0.8;

      setVehicleData({
        ...data,
        cargoVolume: totalCapacity
      });
      setStep(2);
    } catch (error) {
      console.error('Error searching vehicle:', error);
      Alert.alert('Error', error.message || 'Failed to search vehicle');
    } finally {
      setSearchingVehicle(false);
    }
  };

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setDeliveryDate(date);
      const newStart = new Date(date);
      newStart.setHours(8, 0, 0);
      setDeliveryStartTime(newStart);

      const newEnd = new Date(date);
      newEnd.setHours(17, 0, 0);
      setDeliveryEndTime(newEnd);
    }
  };

  const handleStartTimeChange = (event, time) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
    }
    if (time) {
      const newTime = new Date(deliveryDate);
      newTime.setHours(time.getHours(), time.getMinutes());
      setDeliveryStartTime(newTime);
    }
  };

  const handleEndTimeChange = (event, time) => {
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
    }
    if (time) {
      const newTime = new Date(deliveryDate);
      newTime.setHours(time.getHours(), time.getMinutes());
      setDeliveryEndTime(newTime);
    }
  };

  const handleCreateOffer = async () => {
    if (!deliveryLocation.trim()) {
      Alert.alert('Error', 'Please enter delivery location');
      return;
    }

    try {
      setLoading(true);

      // Geocode the delivery location to get coordinates
      const geocoded = await locationService.geocodeAddress(deliveryLocation);

      if (!geocoded) {
        Alert.alert('Error', 'Could not find coordinates for delivery location. Please check the address.');
        setLoading(false);
        return;
      }

      const deliveryLatValue = geocoded.latitude;
      const deliveryLngValue = geocoded.longitude;

      const offerData = {
        license_plate: vehicleData.licensePlate,
        vehicle_brand: vehicleData.brand,
        vehicle_model: vehicleData.model,
        vehicle_year: vehicleData.year?.toString(),
        cargo_volume_total: parseFloat(vehicleData.cargoVolume),
        pickup_location_id: null,
        pickup_lat: pickupLat ? parseFloat(pickupLat) : null,
        pickup_lng: pickupLng ? parseFloat(pickupLng) : null,
        delivery_location_label: deliveryLocation,
        delivery_lat: deliveryLatValue,
        delivery_lng: deliveryLngValue,
        delivery_window_start: deliveryStartTime.toISOString(),
        delivery_window_end: deliveryEndTime.toISOString(),
        driver_contact_phone: driverPhone || null,
        driver_notes: driverNotes || null,
      };

      const result = await cargoOfferService.createCargoOffer(farmerId, offerData);

      Alert.alert('Success', 'Cargo offer created!');
      navigation.navigate('AvailableCargo', {
        farmerId,
        newOfferId: result.offer_id
      });
    } catch (error) {
      console.error('Error creating offer:', error);
      Alert.alert('Error', 'Failed to create cargo offer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveContainer scrollable>
      <Header title="Create Cargo Offer" subtitle={`Step ${step} of 2`} />

      {step === 1 && (
        <Card style={styles.card}>
          <Text style={styles.stepTitle}>Select Your Vehicle</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>License Plate</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="e.g., AB-12-CD"
                value={licensePlate}
                onChangeText={setLicensePlate}
                editable={!searchingVehicle}
              />
              <Button
                variant="primary"
                size="sm"
                onPress={handleSearchVehicle}
                disabled={searchingVehicle}
                style={styles.searchButton}
              >
                {searchingVehicle ? '...' : '🔍'}
              </Button>
            </View>
          </View>

          {vehicleData && (
            <Card style={[styles.vehicleCard, { backgroundColor: colors.background }]}>
              <Text style={styles.vehicleTitle}>
                ✓ {vehicleData.brand} {vehicleData.model}
              </Text>
              <View style={styles.vehicleDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Year:</Text>
                  <Text style={styles.detailValue}>{vehicleData.year || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cargo Volume:</Text>
                  <Text style={[styles.detailValue, { color: colors.primary, fontWeight: '600' }]}>
                    {vehicleData.cargoVolume.toFixed(2)}m³
                  </Text>
                </View>
                <View style={[styles.detailRow, { marginTop: 8 }]}>
                  <Text style={styles.smallText}>
                    (20% reduction applied for car corners)
                  </Text>
                </View>
              </View>
            </Card>
          )}

          <View style={styles.buttonRow}>
            <Button
              variant="primary"
              onPress={() => vehicleData ? setStep(2) : null}
              disabled={!vehicleData || searchingVehicle}
              style={{ flex: 1 }}
            >
              Next →
            </Button>
          </View>
        </Card>
      )}

      {step === 2 && vehicleData && (
        <Card style={styles.card}>
          <Text style={styles.stepTitle}>Delivery Details</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Pickup Location</Text>
            {pickupLocationName ? (
              <View style={styles.locationDisplay}>
                <Text style={styles.locationText}>📍 {pickupLocationName}</Text>
                <Text style={styles.coordinateText}>{pickupLat}, {pickupLng}</Text>
              </View>
            ) : (
              <Text style={styles.placeholderText}>No location selected</Text>
            )}
            <TouchableOpacity
              style={[styles.button, gettingLocation && styles.buttonDisabled]}
              onPress={handleUseCurrentLocation}
              disabled={gettingLocation}
            >
              <Text style={styles.buttonText}>
                {gettingLocation ? '📍 Getting Location...' : '📍 Use Current Location'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Delivery Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Amsterdam Central Market"
              value={deliveryLocation}
              onChangeText={setDeliveryLocation}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Delivery Date</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.inputText}>
                📅 {deliveryDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={deliveryDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Time Window</Text>
            <View style={styles.timeRow}>
              <TouchableOpacity
                style={[styles.input, { flex: 1 }]}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text style={styles.inputText}>
                  🕐 {deliveryStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
              <Text style={styles.toText}>to</Text>
              <TouchableOpacity
                style={[styles.input, { flex: 1 }]}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Text style={styles.inputText}>
                  🕐 {deliveryEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            </View>
            {showStartTimePicker && (
              <DateTimePicker
                value={deliveryStartTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleStartTimeChange}
              />
            )}
            {showEndTimePicker && (
              <DateTimePicker
                value={deliveryEndTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleEndTimeChange}
              />
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Driver Phone (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., +31 6 12345678"
              value={driverPhone}
              onChangeText={setDriverPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Special Instructions (Optional)</Text>
            <TextInput
              style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              placeholder="e.g., Early morning delivery preferred..."
              value={driverNotes}
              onChangeText={setDriverNotes}
              multiline
            />
          </View>

          <View style={styles.buttonRow}>
            <Button
              variant="outline"
              onPress={() => setStep(1)}
              style={{ flex: 1, marginRight: 8 }}
              disabled={loading}
            >
              ← Back
            </Button>
            <Button
              variant="primary"
              onPress={handleCreateOffer}
              style={{ flex: 1 }}
              disabled={loading}
            >
              {loading ? <ActivityIndicator size="small" color="white" /> : '✓ Create'}
            </Button>
          </View>
        </Card>
      )}
    </ResponsiveContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
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
  inputText: {
    color: '#212121',
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchButton: {
    width: 48,
  },
  vehicleCard: {
    marginVertical: 16,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 12,
  },
  vehicleDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 13,
    color: '#757575',
  },
  detailValue: {
    fontSize: 13,
    color: '#212121',
    fontWeight: '500',
  },
  smallText: {
    fontSize: 11,
    color: '#9e9e9e',
    fontStyle: 'italic',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toText: {
    fontSize: 12,
    color: '#9e9e9e',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
  },
  locationDisplay: {
    backgroundColor: '#e8f5e9',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  coordinateText: {
    fontSize: 12,
    color: '#757575',
  },
  placeholderText: {
    fontSize: 14,
    color: '#bdbdbd',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#bdbdbd',
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CargoOfferCreationScreen;
