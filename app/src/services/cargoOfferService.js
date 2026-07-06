import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const cargoOfferService = {
  createCargoOffer: async (farmerId, offerData) => {
    try {
      const response = await api.post('/cargo-offers', offerData, {
        params: { farmer_id: farmerId }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating cargo offer:', error);
      throw error;
    }
  },

  getAvailableOffers: async (filters = {}) => {
    try {
      const response = await api.get('/cargo-offers', {
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

  getOfferDetails: async (offerId) => {
    try {
      const response = await api.get(`/cargo-offers/${offerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching offer details:', error);
      throw error;
    }
  },

  getOfferRoute: async (offerId) => {
    try {
      const response = await api.get(`/cargo-offers/${offerId}/route`);
      return response.data;
    } catch (error) {
      console.error('Error fetching offer route:', error);
      return null;
    }
  },

  updateOffer: async (offerId, updates) => {
    try {
      const response = await api.patch(`/cargo-offers/${offerId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating offer:', error);
      throw error;
    }
  },

  cancelOffer: async (offerId) => {
    try {
      const response = await api.delete(`/cargo-offers/${offerId}`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling offer:', error);
      throw error;
    }
  },

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

  getBookingDetails: async (bookingId) => {
    try {
      const response = await api.get(`/cargo-offers/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking details:', error);
      throw error;
    }
  },

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

  cancelBooking: async (bookingId) => {
    try {
      const response = await api.delete(`/cargo-offers/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  },

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

  getDriverStats: async (farmerId) => {
    try {
      const response = await api.get(`/cargo-offers/farmers/${farmerId}/rating`);
      return response.data;
    } catch (error) {
      console.error('Error fetching driver stats:', error);
      return null;
    }
  },
};

export default cargoOfferService;
