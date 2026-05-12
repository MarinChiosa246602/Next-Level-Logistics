const API_BASE_URL = 'http://localhost:8000/v1';

export const api = {
  async getLocations(farmId) {
    const response = await fetch(`${API_BASE_URL}/locations?farm_id=${farmId}`);
    if (!response.ok) throw new Error('Failed to fetch locations');
    return response.json();
  },

  async submitRecord(payload) {
    const response = await fetch(`${API_BASE_URL}/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Record submission failed');
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
