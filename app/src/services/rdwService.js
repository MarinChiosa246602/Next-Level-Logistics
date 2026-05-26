const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.6:8000/v1';

export const rdwService = {
  formatLicensePlate(plate) {
    return plate.toUpperCase().replace(/[-\s.]/g, '');
  },

  async getVehicleData(licensePlate) {
    try {
      const formattedPlate = this.formatLicensePlate(licensePlate);

      console.log('Searching for vehicle:', formattedPlate);

      // Call backend endpoint which handles RDW API
      const url = `${API_BASE_URL}/vehicles/${encodeURIComponent(licensePlate)}`;

      console.log('Backend URL:', url);

      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP ${response.status}: Vehicle not found`);
      }

      const vehicleData = await response.json();

      console.log('Vehicle data retrieved:', vehicleData);

      return vehicleData;
    } catch (error) {
      console.error('Vehicle lookup error:', error.message);
      throw error;
    }
  },
};
