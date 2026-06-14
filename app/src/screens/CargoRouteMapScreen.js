import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import ResponsiveContainer from '../components/ResponsiveContainer';
import cargoOfferService from '../services/cargoOfferService';
import googleMapsService from '../services/googleMapsService';
import { colors, spacing } from '../theme';

const CargoRouteMapScreen = ({ navigation, route }) => {
  const { offer, farmerId, isOwnOffer } = route.params;
  const [route_data, setRouteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverStats, setDriverStats] = useState(null);

  useEffect(() => {
    loadRouteAndStats();
  }, [offer?.offer_id]);

  const loadRouteAndStats = async () => {
    try {
      setLoading(true);

      if (offer?.offer_id) {
        console.log('Fetching route for offer:', offer.offer_id);
        console.log('Offer data:', {
          delivery_lat: offer.delivery_lat,
          delivery_lng: offer.delivery_lng,
          pickup_lat: offer.pickup_lat,
          pickup_lng: offer.pickup_lng,
        });

        const routeData = await cargoOfferService.getOfferRoute(offer.offer_id);

        if (!routeData) {
          console.error('Route data is null');
          Alert.alert('Error', 'Could not load route information. Please try again.');
        } else {
          setRouteData(routeData);
        }

        if (!isOwnOffer && offer?.farmer_id) {
          const stats = await cargoOfferService.getDriverStats(offer.farmer_id);
          setDriverStats(stats);
        }
      }
    } catch (error) {
      console.error('Error loading route:', error);
      Alert.alert('Error', 'Failed to load route information');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateWaze = () => {
    if (!offer) return;
    const wazeUrl = googleMapsService.getWazeUrl(
      offer.pickup_lat || 50.0,
      offer.pickup_lng || 5.0,
      offer.delivery_lat,
      offer.delivery_lng,
      offer.delivery_location_label
    );
    Linking.openURL(wazeUrl).catch(() => {
      Alert.alert('Error', 'Waze is not installed. Trying Google Maps...');
      const mapsUrl = googleMapsService.getGoogleMapsUrl(
        offer.pickup_lat || 50.0,
        offer.pickup_lng || 5.0,
        offer.delivery_lat,
        offer.delivery_lng,
        offer.delivery_location_label
      );
      Linking.openURL(mapsUrl);
    });
  };

  const handleNavigateGoogleMaps = () => {
    if (!offer) return;
    const mapsUrl = googleMapsService.getGoogleMapsUrl(
      offer.pickup_lat || 50.0,
      offer.pickup_lng || 5.0,
      offer.delivery_lat,
      offer.delivery_lng,
      offer.delivery_location_label
    );
    Linking.openURL(mapsUrl);
  };

  const handleCallDriver = () => {
    if (offer?.driver_contact_phone) {
      Linking.openURL(`tel:${offer.driver_contact_phone}`);
    } else {
      Alert.alert('Contact', 'Driver contact not available');
    }
  };

  const handleBookCargo = () => {
    navigation.navigate('CargoBooking', {
      offer,
      farmerId
    });
  };

  if (!offer) {
    return (
      <ResponsiveContainer>
        <Text style={styles.errorText}>No offer data available</Text>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer scrollable>
      <Header title="🗺️ Route Details" subtitle={offer.delivery_location_label} />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          {!isOwnOffer && driverStats && (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Driver Information</Text>
              <View style={styles.driverCard}>
                <View style={styles.driverHeader}>
                  <Text style={styles.driverName}>👤 Farmer</Text>
                  <View style={styles.rating}>
                    <Text style={styles.ratingValue}>
                      ⭐ {driverStats.average_rating || 'N/A'}
                    </Text>
                    <Text style={styles.ratingCount}>
                      ({driverStats.total_ratings} reviews)
                    </Text>
                  </View>
                </View>
                {offer.driver_contact_phone && (
                  <TouchableOpacity
                    style={styles.contactButton}
                    onPress={handleCallDriver}
                  >
                    <Text style={styles.contactButtonText}>
                      📞 {offer.driver_contact_phone}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          )}

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Vehicle Details</Text>
            <View style={styles.vehicleInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Brand / Model</Text>
                <Text style={styles.infoValue}>
                  {offer.vehicle_brand} {offer.vehicle_model}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Year</Text>
                <Text style={styles.infoValue}>{offer.vehicle_year || 'N/A'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>License Plate</Text>
                <Text style={styles.infoValue}>{offer.license_plate}</Text>
              </View>
              <View style={[styles.infoRow, { marginTop: 12, paddingTop: 12, borderTopColor: '#f0f0f0', borderTopWidth: 1 }]}>
                <Text style={styles.infoLabel}>Total Capacity</Text>
                <Text style={[styles.infoValue, { color: colors.primary, fontWeight: '600' }]}>
                  {(offer.cargo_volume_total || 0).toFixed(2)}m³
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Available</Text>
                <Text style={[styles.infoValue, { color: colors.primary, fontWeight: '600' }]}>
                  {(offer.cargo_volume_available || 0).toFixed(2)}m³
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Route Information</Text>
            {route_data ? (
              <View style={styles.routeInfo}>
                <View style={styles.routeItem}>
                  <Text style={styles.routeItemLabel}>📍 Distance</Text>
                  <Text style={styles.routeItemValue}>
                    {route_data.distance_km} km
                  </Text>
                </View>
                <View style={styles.routeItem}>
                  <Text style={styles.routeItemLabel}>⏱️ Duration</Text>
                  <Text style={styles.routeItemValue}>
                    {route_data.duration_minutes}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.noRoute}>Route data not available</Text>
            )}
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Delivery Window</Text>
            <View style={styles.windowInfo}>
              <View style={styles.windowItem}>
                <Text style={styles.windowLabel}>📅 Date</Text>
                <Text style={styles.windowValue}>
                  {new Date(offer.delivery_window_start).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.windowItem}>
                <Text style={styles.windowLabel}>🕐 Time</Text>
                <Text style={styles.windowValue}>
                  {new Date(offer.delivery_window_start).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })} - {new Date(offer.delivery_window_end).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
              <View style={styles.windowItem}>
                <Text style={styles.windowLabel}>📍 Destination</Text>
                <Text style={styles.windowValue}>
                  {offer.delivery_location_label}
                </Text>
              </View>
            </View>
            {offer.driver_notes && (
              <View style={[styles.windowItem, { marginTop: 12 }]}>
                <Text style={styles.windowLabel}>💬 Special Instructions</Text>
                <Text style={styles.windowValue}>{offer.driver_notes}</Text>
              </View>
            )}
          </Card>

          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Navigate</Text>
            <View style={styles.navButtonGroup}>
              <Button
                variant="outline"
                onPress={handleNavigateWaze}
                style={styles.navButton}
              >
                🧭 Waze
              </Button>
              <Button
                variant="outline"
                onPress={handleNavigateGoogleMaps}
                style={styles.navButton}
              >
                🗺️ Google Maps
              </Button>
            </View>
          </Card>

          <Card style={[styles.card, styles.lastCard]}>
            {!isOwnOffer ? (
              <View style={styles.buttonGroup}>
                <Button
                  variant="primary"
                  onPress={handleBookCargo}
                  style={{ marginBottom: 8 }}
                >
                  ✓ Book Cargo Space
                </Button>
                {offer.driver_contact_phone && (
                  <Button
                    variant="outline"
                    onPress={handleCallDriver}
                  >
                    📞 Call Driver
                  </Button>
                )}
              </View>
            ) : (
              <Button
                variant="primary"
                onPress={() => navigation.goBack()}
              >
                ← Back to My Offers
              </Button>
            )}
          </Card>
        </>
      )}
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
  centerContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  driverCard: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  driverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  rating: {
    alignItems: 'flex-end',
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  ratingCount: {
    fontSize: 11,
    color: '#9e9e9e',
  },
  contactButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  vehicleInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: '#757575',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#212121',
  },
  routeInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  routeItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  routeItemLabel: {
    fontSize: 11,
    color: '#9e9e9e',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  routeItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  noRoute: {
    fontSize: 13,
    color: '#9e9e9e',
    textAlign: 'center',
    paddingVertical: 12,
  },
  windowInfo: {
    gap: 12,
  },
  windowItem: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  windowLabel: {
    fontSize: 11,
    color: '#9e9e9e',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  windowValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#212121',
  },
  navButtonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    flex: 1,
  },
  buttonGroup: {
    gap: 8,
  },
});

export default CargoRouteMapScreen;
