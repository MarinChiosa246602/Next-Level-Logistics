const API_BASE_URL = window.location.origin.includes(':3000')
  ? 'http://localhost:8000/v1'
  : `${window.location.origin}/v1`;

export const api = {
  /* ─── Records ─── */
  async listRecords(params = {}) {
    const backendParams = {};
    if (params.status)    backendParams.status    = params.status;
    if (params.dateFrom)  backendParams.from_date = params.dateFrom;
    if (params.dateTo)    backendParams.to_date   = params.dateTo;
    if (params.farm_id)   backendParams.farm_id   = params.farm_id;
    if (params.farmer_id) backendParams.farmer_id = params.farmer_id;
    backendParams.limit  = params.limit  || 100;
    backendParams.offset = params.offset || 0;

    const query    = new URLSearchParams(backendParams).toString();
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
    if (params.status)    backendParams.status    = params.status;
    if (params.dateFrom)  backendParams.from_date = params.dateFrom;
    if (params.dateTo)    backendParams.to_date   = params.dateTo;
    if (params.farm_id)   backendParams.farm_id   = params.farm_id;
    if (params.farmer_id) backendParams.farmer_id = params.farmer_id;

    const query    = new URLSearchParams(backendParams).toString();
    const response = await fetch(`${API_BASE_URL}/records/export?${query}`);
    if (!response.ok) throw new Error('Export failed');
    return response.blob();
  },

  /* ─── Farmers ─── */
  async listFarmers() {
    try {
      const response = await fetch(`${API_BASE_URL}/farmers?limit=100`);
      if (!response.ok) return [];
      return response.json();
    } catch {
      return [];
    }
  },

  /* ─── Cargo Offers (Travel Plans) ─── */
  async listCargoOffers(params = {}) {
    const backendParams = {};
    if (params.farmer_id) backendParams.farmer_id = params.farmer_id;
    backendParams.limit  = params.limit  || 100;
    backendParams.offset = params.offset || 0;

    // Fetch all statuses so the hub shows everything
    const allStatuses = ['active', 'completed', 'cancelled'];
    const results = await Promise.all(
      allStatuses.map(async s => {
        const q = new URLSearchParams({ ...backendParams, status: s }).toString();
        try {
          const r = await fetch(`${API_BASE_URL}/cargo-offers?${q}`);
          if (!r.ok) return [];
          return r.json();
        } catch {
          return [];
        }
      })
    );
    return results.flat();
  },

  async createCargoOffer(farmerId, offerData) {
    const response = await fetch(
      `${API_BASE_URL}/cargo-offers?farmer_id=${encodeURIComponent(farmerId)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offerData),
      }
    );
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to create offer: ${errText}`);
    }
    return response.json();
  },

  async getCargoOffer(offerId) {
    const response = await fetch(`${API_BASE_URL}/cargo-offers/${offerId}`);
    if (!response.ok) throw new Error('Failed to fetch cargo offer');
    return response.json();
  },

  async cancelCargoOffer(offerId) {
    const response = await fetch(`${API_BASE_URL}/cargo-offers/${offerId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to cancel offer');
    return response.json();
  },

  /* ─── Cargo Bookings ─── */
  async listCargoBookings() {
    try {
      const r = await fetch(`${API_BASE_URL}/cargo-offers/bookings?limit=200`);
      if (r.ok) return r.json();
      return [];
    } catch {
      return [];
    }
  },
};
