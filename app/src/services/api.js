import { sampleLocations, productTypes, sampleFarms } from './sampleData';

const sampleFarmers = [
  {
    farmer_id: '00000000-0000-0000-0000-000000000000',
    farm_id: '00000000-0000-0000-0000-000000000000',
    name: 'Demo Farmer'
  }
];

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const fetchWithTimeout = (url, options = {}, timeout = 10000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
};

export const api = {
  async getFarmer(farmerId) {
    try {
      const url = `${API_BASE_URL}/farmer/${farmerId}`;
      console.log('Fetching from:', url);
      const response = await fetchWithTimeout(url, {}, 10000);
      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: Farmer not found. ${errText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching farmer:', error.message);
      throw error;
    }
  },

  async getLocations(farmId) {
    try {
      if (!farmId) {
        throw new Error('farmId is required');
      }
      const url = `${API_BASE_URL}/locations?farm_id=${farmId}`;
      console.log('Fetching locations from:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch locations`);
      }
      const data = await response.json();
      console.log('Locations API response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching locations:', error.message);
      // Fallback to sample data
      const fallbackLocations = sampleLocations.filter(loc => loc.farm_id === farmId);
      const fallbackData = {
        locations: fallbackLocations.length > 0 ? fallbackLocations : sampleLocations
      };
      console.log('Using fallback locations:', fallbackData);
      return fallbackData;
    }
  },

  async submitRecord(payload) {
    const response = await fetch(`${API_BASE_URL}/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Record submission failed (HTTP ${response.status}): ${errText}`);
    }
    return response.json();
  },

  async uploadPhoto(formData) {
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Photo upload failed (HTTP ${response.status}): ${errText}`);
    }
    return response.json();
  },

  async analyzePhoto(imageUrl, filePath = null) {
    const response = await fetch(`${API_BASE_URL}/analyze-photo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        file_path: filePath
      }),
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`AI analysis failed (HTTP ${response.status}): ${errText}`);
    }
    return response.json();
  },

  async getRecord(recordId) {
    const response = await fetch(`${API_BASE_URL}/records/${recordId}`);
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Failed to fetch record (HTTP ${response.status}): ${errText}`);
    }
    return response.json();
  },

  async getHistory(farmerId) {
    const response = await fetch(`${API_BASE_URL}/records?farmer_id=${farmerId}&limit=10`);
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Failed to fetch history (HTTP ${response.status}): ${errText}`);
    }
    return response.json();
  }
};
