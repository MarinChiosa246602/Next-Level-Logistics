import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TextInput, ActivityIndicator, TouchableOpacity, useWindowDimensions } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import { t } from '../constants/translations';
import { rdwService } from '../services/rdwService';

let BarCodeScanner = null;
let scannerAvailable = false;

try {
  BarCodeScanner = require('expo-barcode-scanner').BarCodeScanner;
  scannerAvailable = true;
} catch (e) {
  scannerAvailable = false;
}

const LicensePlateScreen = ({ lang = 'nl' }) => {
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleData, setVehicleData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);

  const handleSearch = async () => {
    if (!licensePlate.trim()) {
      setError(t('licensePlate.error_empty', lang, 'Please enter a license plate'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setVehicleData(null);

    try {
      const data = await rdwService.getVehicleData(licensePlate);
      console.log('bootCapacity value:', data.bootCapacity, 'type:', typeof data.bootCapacity);
      setVehicleData(data);
    } catch (err) {
      setError(err.message || t('licensePlate.error_not_found', lang, 'Vehicle not found'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleScannerToggle = async () => {
    if (!scannerAvailable) {
      Alert.alert(
        t('common.error', lang),
        'Barcode scanner is not available in this environment. Please enter the license plate manually.'
      );
      return;
    }

    if (!scannerActive) {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      if (status === 'granted') {
        setHasPermission(true);
        setScannerActive(true);
      } else {
        setHasPermission(false);
        Alert.alert(
          t('common.error', lang),
          t('licensePlate.camera_permission_denied', lang, 'Camera permission is required')
        );
      }
    } else {
      setScannerActive(false);
    }
  };

  const handleBarCodeScanned = ({ data }) => {
    setLicensePlate(data);
    setScannerActive(false);
  };

  const handleReset = () => {
    setLicensePlate('');
    setVehicleData(null);
    setError(null);
    setScannerActive(false);
  };

  const calculateBootVolumesInfo = (bootCapacity) => {
    console.log('calculateBootVolumesInfo called with:', bootCapacity, 'type:', typeof bootCapacity);

    if (!bootCapacity || bootCapacity === 'Not available' || bootCapacity === 'Not specified') {
      console.log('Returning null - bootCapacity is falsy or special string');
      return null;
    }

    const capacity = parseFloat(bootCapacity);
    console.log('Parsed capacity:', capacity, 'isNaN:', isNaN(capacity));

    if (isNaN(capacity)) {
      console.log('Parsed capacity is NaN, returning null');
      return null;
    }

    const capacityLiters = capacity * 1000;
    const boxVolume = 0.02;
    const cartonVolume = 0.003;
    const palletVolume = 1.0;

    const result = {
      liters: Math.round(capacityLiters),
      boxes: Math.floor(capacity / boxVolume),
      cartons: Math.floor(capacity / cartonVolume),
      pallets: Math.floor(capacity / palletVolume),
    };

    console.log('calculateBootVolumesInfo result:', result);
    return result;
  };

  if (scannerActive && scannerAvailable && BarCodeScanner) {
    return (
      <View style={styles.container}>
        <BarCodeScanner
          onBarCodeScanned={handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.scannerOverlay}>
          <TouchableOpacity
            style={styles.closeScannerButton}
            onPress={() => setScannerActive(false)}
          >
            <Text style={styles.closeScannerText}>✕ Close</Text>
          </TouchableOpacity>
          <View style={styles.scannerFrame}>
            <Text style={styles.scannerText}>Scan license plate barcode</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title={t('licensePlate.title', lang, 'Vehicle Boot Space')} />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Card style={styles.inputCard}>
            <Text style={styles.sectionTitle}>🚗 License Plate Lookup</Text>

            <View>
              <Text style={styles.label}>
                {t('licensePlate.plate_label', lang, 'Dutch License Plate')}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="ABC-123 or ABC123"
                value={licensePlate}
                onChangeText={setLicensePlate}
                placeholderTextColor={colors.gray400}
                editable={!isLoading}
                maxLength={10}
              />
            </View>

            <View style={styles.buttonGroup}>
              <Button
                onPress={handleSearch}
                disabled={isLoading || !licensePlate.trim()}
                loading={isLoading}
                fullWidth
                variant="primary"
              >
                🔍 Search
              </Button>

              {scannerAvailable && (
                <Button
                  onPress={handleScannerToggle}
                  disabled={isLoading}
                  variant="secondary"
                  fullWidth
                  style={styles.scanButton}
                >
                  📱 Scan
                </Button>
              )}
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            )}
          </Card>

          {vehicleData && (
            <Card style={styles.dataCard}>
              <Text style={styles.sectionTitle}>📊 Vehicle Details</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>License Plate:</Text>
                <Text style={styles.detailValue}>{vehicleData.licensePlate}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Brand:</Text>
                <Text style={styles.detailValue}>{vehicleData.brand}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Model:</Text>
                <Text style={styles.detailValue}>{vehicleData.model}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Year:</Text>
                <Text style={styles.detailValue}>{vehicleData.year || 'N/A'}</Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.subsectionTitle}>📦 Boot Space Information</Text>

              <View style={styles.bootInfoContainer}>
                <Text style={styles.bootCapacityLabel}>Total Cargo Volume (Available):</Text>
                <Text style={styles.bootCapacityValue}>
                  {(() => {
                    const volInfo = calculateBootVolumesInfo(vehicleData.cargoVolume);
                    console.log('Display - volInfo:', volInfo);
                    return `${volInfo?.liters || 'N/A'} L`;
                  })()}
                </Text>
                <Text style={styles.bootCapacitySubtext}>
                  ({vehicleData.cargoVolume ? vehicleData.cargoVolume.toFixed(2) : 'N/A'} m³ after 20% reduction)
                </Text>
              </View>

              {calculateBootVolumesInfo(vehicleData.cargoVolume) && (
                <View style={styles.volumesGrid}>
                  <View style={styles.volumeCard}>
                    <Text style={styles.volumeLabel}>📦 Boxes</Text>
                    <Text style={styles.volumeNumber}>
                      {calculateBootVolumesInfo(vehicleData.cargoVolume).boxes}
                    </Text>
                    <Text style={styles.volumeNote}>(0.02m³ each)</Text>
                  </View>

                  <View style={styles.volumeCard}>
                    <Text style={styles.volumeLabel}>📫 Cartons</Text>
                    <Text style={styles.volumeNumber}>
                      {calculateBootVolumesInfo(vehicleData.cargoVolume).cartons}
                    </Text>
                    <Text style={styles.volumeNote}>(0.003m³ each)</Text>
                  </View>

                  <View style={styles.volumeCard}>
                    <Text style={styles.volumeLabel}>📦 Pallets</Text>
                    <Text style={styles.volumeNumber}>
                      {calculateBootVolumesInfo(vehicleData.cargoVolume).pallets}
                    </Text>
                    <Text style={styles.volumeNote}>(1m³ each)</Text>
                  </View>
                </View>
              )}

              <View style={styles.divider} />

              <Text style={styles.subsectionTitle}>🔧 Technical Details</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fuel Type:</Text>
                <Text style={styles.detailValue}>{vehicleData.fuelType}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Category:</Text>
                <Text style={styles.detailValue}>{vehicleData.category}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Max Weight:</Text>
                <Text style={styles.detailValue}>
                  {vehicleData.maxWeight ? `${vehicleData.maxWeight} kg` : 'N/A'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Seats:</Text>
                <Text style={styles.detailValue}>{vehicleData.seats || 'N/A'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Doors:</Text>
                <Text style={styles.detailValue}>{vehicleData.doors || 'N/A'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Color:</Text>
                <Text style={styles.detailValue}>{vehicleData.color || 'N/A'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Axles:</Text>
                <Text style={styles.detailValue}>{vehicleData.axles || 'N/A'}</Text>
              </View>

              <Button
                onPress={handleReset}
                variant="secondary"
                fullWidth
                style={styles.resetButton}
              >
                🔄 Search Another Vehicle
              </Button>
            </Card>
          )}

          {!vehicleData && !error && (
            <Card style={styles.infoCard}>
              <Text style={styles.infoTitle}>ℹ️ How it works</Text>
              <Text style={styles.infoText}>
                Enter or scan a Dutch license plate to retrieve vehicle information from the RDW database, including boot space capacity to determine how many packages can fit.
              </Text>
              <Text style={styles.infoNote}>
                Data provided by: opendata.rdw.nl
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
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
  inputCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h6,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  subsectionTitle: {
    ...typography.body1,
    color: colors.text.primary,
    marginBottom: spacing.md,
    marginTop: spacing.md,
    fontWeight: '600',
  },
  label: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.sm,
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
    marginBottom: spacing.md,
  },
  buttonGroup: {
    gap: spacing.md,
  },
  scanButton: {
    marginTop: spacing.sm,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    marginTop: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontWeight: '500',
  },
  dataCard: {
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  detailLabel: {
    ...typography.body2,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  detailValue: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  bootInfoContainer: {
    backgroundColor: colors.primary + '15',
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  bootCapacityLabel: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  bootCapacityValue: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: '700',
  },
  bootCapacitySubtext: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  volumesGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  volumeCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.gray50,
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  volumeLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  volumeNumber: {
    ...typography.h5,
    color: colors.secondary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  volumeNote: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 11,
  },
  resetButton: {
    marginTop: spacing.lg,
  },
  infoCard: {
    backgroundColor: colors.primary + '08',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoTitle: {
    ...typography.h6,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.body2,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  infoNote: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  closeScannerButton: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.lg,
  },
  closeScannerText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  scannerFrame: {
    width: 300,
    height: 300,
    borderWidth: 3,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scannerText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default LicensePlateScreen;
