const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/v1';

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

  async uploadPhoto(formData) {
    // For now, we'll simulate photo upload by returning a mock URL
    // In production, this would upload to a storage service like MinIO
    return {
      file_url: `https://example.com/photos/${Date.now()}.jpg`,
      success: true
    };
  },

  async analyzePhoto(fileUrl) {
    // For now, return mock AI analysis
    // In production, this would call the backend AI processing
    return {
      product_type: "Tomatoes",
      estimated_quantity: 25,
      quantity_unit: "kg",
      condition_rating: "good",
      confidence: {
        overall: 0.85,
        product_type: 0.9,
        quantity: 0.8,
        condition: 0.85
      }
    };
  },

  async uploadPhoto(formData) {
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (!response.ok) throw new Error('Photo upload failed');
    return response.json();
  },

  async analyzePhoto(imageUrl) {
    const response = await fetch(`${API_BASE_URL}/analyze-photo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl }),
    });
    if (!response.ok) throw new Error('AI analysis failed');
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
