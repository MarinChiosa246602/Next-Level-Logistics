import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const cargoOfferService = {
  // Create a new cargo offer
  createCargoOffer: async (farmerId, offerData) => {
    try {
      const response = await api.post('/cargo-offers/', offerData, {
        params: { farmer_id: farmerId }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating cargo offer:', error);
      throw error;
    }
  },

  // Get all active cargo offers (public listing)
  getAvailableOffers: async (filters = {}) => {
    try {
      const response = await api.get('/cargo-offers/', {
        params: {
          status: filters.status || 'active',
          farmer_id: filters.excludeFarmerId,
          limit: filters.limit || 50,
          offset: filters.offset || 0,
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching available offers:', error);
      throw error;
    }
  },

  // Get current user's cargo offers
  getMyOffers: async (farmerId, filters = {}) => {
    try {
      const response = await api.get('/cargo-offers/my-offers', {
        params: {
          farmer_id: farmerId,
          status: filters.status,
          limit: filters.limit || 50,
          offset: filters.offset || 0,
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching my offers:', error);
      throw error;
    }
  },

  // Get cargo offer details
  getOfferDetails: async (offerId) => {
    try {
      const response = await api.get(`/cargo-offers/${offerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching offer details:', error);
      throw error;
    }
  },

  // Get route for a cargo offer
  getOfferRoute: async (offerId) => {
    try {
      const response = await api.get(`/cargo-offers/${offerId}/route`);
      return response.data;
    } catch (error) {
      console.error('Error fetching offer route:', error);
      throw error;
    }
  },

  // Update cargo offer
  updateOffer: async (offerId, updates) => {
    try {
      const response = await api.patch(`/cargo-offers/${offerId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating offer:', error);
      throw error;
    }
  },

  // Cancel cargo offer
  cancelOffer: async (offerId) => {
    try {
      const response = await api.delete(`/cargo-offers/${offerId}`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling offer:', error);
      throw error;
    }
  },

  // BOOKING OPERATIONS
  // Create a booking for cargo space
  createBooking: async (farmerId, bookingData) => {
    try {
      const response = await api.post('/cargo-offers/bookings', bookingData, {
        params: { farmer_id: farmerId }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  // Get booking details
  getBookingDetails: async (bookingId) => {
    try {
      const response = await api.get(`/cargo-offers/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking details:', error);
      throw error;
    }
  },

  // Update booking status
  updateBookingStatus: async (bookingId, status) => {
    try {
      const response = await api.patch(`/cargo-offers/bookings/${bookingId}`, {
        status
      });
      return response.data;
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  },

  // Cancel booking
  cancelBooking: async (bookingId) => {
    try {
      const response = await api.delete(`/cargo-offers/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  },

  // RATING OPERATIONS
  // Create a driver rating
  rateDriver: async (farmerId, ratingData) => {
    try {
      const response = await api.post('/cargo-offers/driver-ratings', ratingData, {
        params: { reviewer_farmer_id: farmerId }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating driver rating:', error);
      throw error;
    }
  },

  // Get driver statistics and ratings
  getDriverStats: async (farmerId) => {
    try {
      const response = await api.get(`/cargo-offers/farmers/${farmerId}/rating`);
      return response.data;
    } catch (error) {
      console.error('Error fetching driver stats:', error);
      throw error;
    }
  },
};

export default cargoOfferService;
