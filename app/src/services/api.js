const API_BASE_URL = 'http://localhost:8000/v1';

export const api = {
  async getLocations(farmId) {
    const response = await fetch(`${API_BASE_URL}/locations?farm_id=${farmId}`);
    if (!response.ok) throw new Error('Failed to fetch locations');
    return response.json();
  },

  async uploadPhoto(formData) {
    const response = await fetch(`${API_BASE_URL}/photos/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Photo upload failed');
    return response.json();
  },

  async getRecord(recordId) {
    const response = await fetch(`${API_BASE_URL}/records/${recordId}`);
    if (!response.ok) throw new Error('Failed to fetch record');
    return response.json();
  },

  async getHistory(farmerId) {
    const response = await fetch(`${API_BASE_URL}/records?farmer_id=${farmerId}&limit=10`);
    if (!response.ok) throw new Error('Failed to fetch history');
    return response.json();
  }
};
