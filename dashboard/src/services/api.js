const API_BASE_URL = 'http://localhost:8000/v1';

export const api = {
  async listRecords(params = {}) {
    // Map dashboard filter names to backend parameter names
    const backendParams = {};

    if (params.status) backendParams.status = params.status;
    if (params.dateFrom) backendParams.from_date = params.dateFrom;
    if (params.dateTo) backendParams.to_date = params.dateTo;
    if (params.farm_id) backendParams.farm_id = params.farm_id;
    if (params.farmer_id) backendParams.farmer_id = params.farmer_id;

    // Add default limit
    backendParams.limit = params.limit || 100;
    backendParams.offset = params.offset || 0;

    const query = new URLSearchParams(backendParams).toString();
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
    const backendParams = {};

    if (params.status) backendParams.status = params.status;
    if (params.dateFrom) backendParams.from_date = params.dateFrom;
    if (params.dateTo) backendParams.to_date = params.dateTo;
    if (params.farm_id) backendParams.farm_id = params.farm_id;
    if (params.farmer_id) backendParams.farmer_id = params.farmer_id;

    const query = new URLSearchParams(backendParams).toString();
    const response = await fetch(`${API_BASE_URL}/records/export?${query}`);
    if (!response.ok) throw new Error('Export failed');
    return response.blob();
  }
};
