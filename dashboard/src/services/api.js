const API_BASE_URL = 'http://localhost:8000/v1';

export const api = {
  async listRecords(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/records?${query}`);
    if (!response.ok) throw new Error('Failed to fetch records');
    return response.json();
  },

  async getRecord(recordId) {
    const response = await fetch(`${API_BASE_URL}/records/${recordId}`);
    if (!response.ok) throw new Error('Failed to fetch record');
    return response.json();
  },

  async updateStatus(recordId, status) {
    const response = await fetch(`${API_BASE_URL}/records/${recordId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update status');
    return response.json();
  },

  async exportCSV(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/records/export?${query}`);
    if (!response.ok) throw new Error('Export failed');
    return response.blob();
  }
};
