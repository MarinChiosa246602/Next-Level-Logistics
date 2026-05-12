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

  async submitRecord(payload) {
    const response = await fetch(`${API_BASE_URL}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Submission failed');
    return response.json();
  }
};
