import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../components/Header';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import ResponsiveContainer from '../components/ResponsiveContainer';
import cargoOfferService from '../services/cargoOfferService';
import googleMapsService from '../services/googleMapsService';
import { locationService } from '../services/locationService';
import { colors, spacing } from '../theme';

const AvailableCargoScreen = ({ navigation, route }) => {
  const farmerId = route?.params?.farmerId;
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      if (farmerId) {
        loadOffers();
      }
    }, [farmerId])
  );

  const loadOffers = async () => {
    try {
      setLoading(true);

      // Try to get user's current location
      try {
        const location = await locationService.getCurrentLocation();
        setUserLocation(location);
      } catch (error) {
        console.warn('Could not get user location:', error);
      }

      const data = await cargoOfferService.getAvailableOffers({
        excludeFarmerId: farmerId,
        limit: 50
      });

      // Sort offers by distance from user if location available
      if (userLocation && data) {
        const offersWithDistance = data.map(offer => ({
          ...offer,
          distanceFromUser: userLocation ? locationService.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            offer.delivery_lat,
            offer.delivery_lng
          ) : null
        })).sort((a, b) => {
          if (a.distanceFromUser && b.distanceFromUser) {
            return a.distanceFromUser - b.distanceFromUser;
          }
          return 0;
        });
        setOffers(offersWithDistance);
      } else {
        setOffers(data || []);
      }
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOffers();
    setRefreshing(false);
  };

  const handleViewOffer = (offer) => {
    navigation.navigate('CargoRouteMap', {
      offer,
      farmerId,
      isOwnOffer: false
    });
  };

  const renderOfferCard = (offer) => {
    const distance = googleMapsService.calculateDistance(
      50.0,
      5.0,
      offer.delivery_lat,
      offer.delivery_lng
    );

    return (
      <Card key={offer.offer_id} style={styles.offerCard}>
        <TouchableOpacity
          onPress={() => handleViewOffer(offer)}
          activeOpacity={0.7}
        >
          <View style={styles.offerHeader}>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>👤 Farmer Offer</Text>
              <View style={styles.ratingContainer}>
                <Text style={styles.rating}>⭐ 4.8</Text>
                <Text style={styles.reviewCount}>(12 reviews)</Text>
              </View>
            </View>
            <Badge status="active">Available</Badge>
          </View>

          <View style={styles.vehicleSection}>
            <Text style={styles.vehicleTitle}>
              {offer.vehicle_brand} {offer.vehicle_model}
            </Text>
            <Text style={styles.vehicleYear}>📅 {offer.vehicle_year || 'Year N/A'}</Text>
          </View>

          <View style={styles.routeSection}>
            <Text style={styles.routeLabel}>📍 Route</Text>
            <View style={styles.routePoints}>
              <Text style={styles.routePoint}>
                From: {offer.license_plate}
              </Text>
              <Text style={styles.arrow}>↓</Text>
              <Text style={styles.routePoint}>
                To: {offer.delivery_location_label}
              </Text>
            </View>
            <Text style={styles.distance}>
              🛣️ ~{distance.toFixed(1)} km
            </Text>
          </View>

          <View style={styles.capacitySection}>
            <View style={styles.capacityItem}>
              <Text style={styles.capacityLabel}>Available</Text>
              <Text style={styles.capacityValue}>
                {(offer.cargo_volume_available || 0).toFixed(1)}m³
              </Text>
            </View>
            <View style={styles.capacityItem}>
              <Text style={styles.capacityLabel}>Total</Text>
              <Text style={styles.capacityValue}>
                {(offer.cargo_volume_total || 0).toFixed(1)}m³
              </Text>
            </View>
            <View style={styles.capacityItem}>
              <Text style={styles.capacityLabel}>Window</Text>
              <Text style={styles.capacityValue}>
                {new Date(offer.delivery_window_start).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={styles.footerRow}>
            <Button
              variant="outline"
              size="sm"
              onPress={() => handleViewOffer(offer)}
              style={{ flex: 1, marginRight: 8 }}
            >
              View Route
            </Button>
            <Button
              variant="primary"
              size="sm"
              onPress={() => navigation.navigate('CargoBooking', { offer, farmerId })}
              style={{ flex: 1 }}
            >
              ✓ Book Now
            </Button>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <ResponsiveContainer>
      <Header
        title="🚚 Available Cargo"
        subtitle="Browse cargo space from other farmers"
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : offers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Available Cargo</Text>
          <Text style={styles.emptyText}>
            No cargo offers are currently available. Try again later.
          </Text>
        </View>
      ) : (
        <FlatList
          scrollEnabled={true}
          data={offers}
          renderItem={({ item }) => renderOfferCard(item)}
          keyExtractor={item => item.offer_id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </ResponsiveContainer>
  );
};

const styles = StyleSheet.create({
  offerCard: {
    marginBottom: 12,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  reviewCount: {
    fontSize: 12,
    color: '#9e9e9e',
  },
  vehicleSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomColor: '#f0f0f0',
    borderBottomWidth: 1,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  vehicleYear: {
    fontSize: 13,
    color: '#757575',
  },
  routeSection: {
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  routeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9e9e9e',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  routePoints: {
    gap: 6,
    marginBottom: 8,
  },
  routePoint: {
    fontSize: 13,
    color: '#212121',
  },
  arrow: {
    fontSize: 14,
    color: colors.primary,
    alignSelf: 'center',
  },
  distance: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  capacitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopColor: '#f0f0f0',
    borderTopWidth: 1,
    borderBottomColor: '#f0f0f0',
    borderBottomWidth: 1,
    marginVertical: 12,
  },
  capacityItem: {
    flex: 1,
    alignItems: 'center',
  },
  capacityLabel: {
    fontSize: 10,
    color: '#9e9e9e',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  capacityValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  footerRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  centerContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
});

export default AvailableCargoScreen;
