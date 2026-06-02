import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import ResponsiveContainer from '../components/ResponsiveContainer';
import cargoOfferService from '../services/cargoOfferService';
import { theme } from '../theme/colors';

const MyCargoOffersScreen = ({ navigation, route }) => {
  const [activeOffers, setActiveOffers] = useState([]);
  const [pastOffers, setPastOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [farmerId, setFarmerId] = useState(null);
  const [selectedTab, setSelectedTab] = useState('active');

  const farmerId_fromRoute = route?.params?.farmerId;

  useFocusEffect(
    React.useCallback(() => {
      if (farmerId_fromRoute) {
        setFarmerId(farmerId_fromRoute);
        loadOffers(farmerId_fromRoute);
      }
    }, [farmerId_fromRoute])
  );

  const loadOffers = async (farmerID) => {
    try {
      setLoading(true);
      const active = await cargoOfferService.getMyOffers(farmerID, { status: 'active' });
      const past = await cargoOfferService.getMyOffers(farmerID, { status: 'completed' });

      setActiveOffers(active || []);
      setPastOffers(past || []);
    } catch (error) {
      console.error('Error loading offers:', error);
      Alert.alert('Error', 'Failed to load your cargo offers');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (farmerId) {
      await loadOffers(farmerId);
    }
    setRefreshing(false);
  };

  const handleCreateOffer = () => {
    navigation.navigate('CargoOfferCreation', { farmerId });
  };

  const handleViewRoute = (offer) => {
    navigation.navigate('CargoRouteMap', {
      offer,
      farmerId,
      isOwnOffer: true
    });
  };

  const handleCancelOffer = async (offerId) => {
    Alert.alert(
      'Cancel Offer',
      'Are you sure you want to cancel this cargo offer?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await cargoOfferService.cancelOffer(offerId);
              Alert.alert('Success', 'Cargo offer cancelled');
              await onRefresh();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel offer');
            }
          }
        }
      ]
    );
  };

  const renderOfferCard = (offer) => (
    <Card key={offer.offer_id} style={styles.offerCard}>
      <View style={styles.offerHeader}>
        <View style={styles.offerInfo}>
          <Text style={styles.vehicleTitle}>
            {offer.vehicle_brand} {offer.vehicle_model}
          </Text>
          <Text style={styles.deliveryLabel}>
            → {offer.delivery_location_label}
          </Text>
        </View>
        <Badge status={offer.status}>
          {offer.status === 'active' ? '🟢 Active' : '✓ Completed'}
        </Badge>
      </View>

      <View style={styles.capacitySection}>
        <View style={styles.capacityItem}>
          <Text style={styles.capacityLabel}>Total Capacity</Text>
          <Text style={styles.capacityValue}>{offer.cargo_volume_total}m³</Text>
        </View>
        <View style={styles.capacityItem}>
          <Text style={styles.capacityLabel}>Available</Text>
          <Text style={styles.capacityValue}>{offer.cargo_volume_available}m³</Text>
        </View>
        <View style={styles.capacityItem}>
          <Text style={styles.capacityLabel}>Booked</Text>
          <Text style={styles.capacityValue}>
            {(offer.cargo_volume_total - offer.cargo_volume_available).toFixed(2)}m³
          </Text>
        </View>
      </View>

      <View style={styles.windowSection}>
        <Text style={styles.windowLabel}>Delivery Window</Text>
        <Text style={styles.windowTime}>
          {new Date(offer.delivery_window_start).toLocaleDateString()} •{' '}
          {new Date(offer.delivery_window_start).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })} - {new Date(offer.delivery_window_end).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>

      {offer.status === 'active' && (
        <View style={styles.actionButtons}>
          <Button
            variant="outline"
            size="sm"
            onPress={() => handleViewRoute(offer)}
            style={styles.actionButton}
          >
            📍 View Route
          </Button>
          <Button
            variant="error"
            size="sm"
            onPress={() => handleCancelOffer(offer.offer_id)}
            style={styles.actionButton}
          >
            ✕ Cancel
          </Button>
        </View>
      )}
    </Card>
  );

  const offers = selectedTab === 'active' ? activeOffers : pastOffers;
  const isEmpty = offers.length === 0;

  return (
    <ResponsiveContainer scrollable>
      <Header
        title="🚚 Cargo Marketplace"
        subtitle="Manage your cargo space offers"
      />

      <View style={styles.createButtonContainer}>
        <Button
          variant="primary"
          onPress={handleCreateOffer}
          style={styles.createButton}
        >
          ➕ Create New Offer
        </Button>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'active' && styles.tabActive
          ]}
          onPress={() => setSelectedTab('active')}
        >
          <Text style={[
            styles.tabText,
            selectedTab === 'active' && styles.tabTextActive
          ]}>
            Active Offers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'past' && styles.tabActive
          ]}
          onPress={() => setSelectedTab('past')}
        >
          <Text style={[
            styles.tabText,
            selectedTab === 'past' && styles.tabTextActive
          ]}>
            Past Offers
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : isEmpty ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No {selectedTab} offers</Text>
          <Text style={styles.emptyText}>
            {selectedTab === 'active'
              ? 'Create your first cargo offer to start sharing space'
              : 'Your completed offers will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          scrollEnabled={false}
          data={offers}
          renderItem={({ item }) => renderOfferCard(item)}
          keyExtractor={item => item.offer_id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
            />
          }
        />
      )}
    </ResponsiveContainer>
  );
};

const styles = StyleSheet.create({
  createButtonContainer: {
    paddingVertical: 12,
  },
  createButton: {
    width: '100%',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomColor: '#e0e0e0',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.primary,
  },
  tabText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  tabTextActive: {
    color: theme.primary,
    fontWeight: '600',
  },
  offerCard: {
    marginBottom: 12,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  offerInfo: {
    flex: 1,
    marginRight: 8,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  deliveryLabel: {
    fontSize: 14,
    color: '#757575',
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
    fontSize: 11,
    color: '#9e9e9e',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  capacityValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
  },
  windowSection: {
    marginBottom: 12,
  },
  windowLabel: {
    fontSize: 12,
    color: '#9e9e9e',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  windowTime: {
    fontSize: 13,
    color: '#212121',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
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

export default MyCargoOffersScreen;
