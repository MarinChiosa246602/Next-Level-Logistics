import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, CssBaseline, Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Card, CardContent, Grid } from '@mui/material';
import { Dashboard, History, Settings, Logout, LocalShipping } from '@mui/icons-material';
import { api } from './services/api';
import { RecordTable, RecordDetail, StatsCards } from './components/DashboardComponents';

const drawerWidth = 240;

// Simple API client for cargo offers
const cargoApi = {
  async listOffers(filters = {}) {
    try {
      const response = await fetch('http://localhost:8000/v1/cargo-offers/', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to fetch offers');
      return await response.json();
    } catch (e) {
      console.error('Error fetching cargo offers:', e);
      return [];
    }
  }
};

function CargoStatsCards({ offers }) {
  const totalOffers = offers.length;
  const totalCapacity = offers.reduce((sum, o) => sum + parseFloat(o.cargo_volume_available || 0), 0);
  const activeBookings = offers.filter(o => o.status === 'active').length;

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Total Offers</Typography>
            <Typography variant="h4">{totalOffers}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Available Capacity</Typography>
            <Typography variant="h4">{totalCapacity.toFixed(1)}m³</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>Active</Typography>
            <Typography variant="h4">{activeBookings}</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

function CargoOffersTable({ offers }) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell><strong>Vehicle</strong></TableCell>
            <TableCell><strong>License Plate</strong></TableCell>
            <TableCell align="right"><strong>Total (m³)</strong></TableCell>
            <TableCell align="right"><strong>Available (m³)</strong></TableCell>
            <TableCell><strong>Destination</strong></TableCell>
            <TableCell><strong>Window</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {offers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                <Typography color="textSecondary">No cargo offers available</Typography>
              </TableCell>
            </TableRow>
          ) : (
            offers.map((offer) => (
              <TableRow key={offer.offer_id} hover>
                <TableCell>{offer.vehicle_brand} {offer.vehicle_model}</TableCell>
                <TableCell><strong>{offer.license_plate}</strong></TableCell>
                <TableCell align="right">{parseFloat(offer.cargo_volume_total).toFixed(2)}</TableCell>
                <TableCell align="right" sx={{ color: offer.cargo_volume_available > 0 ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>
                  {parseFloat(offer.cargo_volume_available).toFixed(2)}
                </TableCell>
                <TableCell>{offer.delivery_location_label}</TableCell>
                <TableCell>{new Date(offer.delivery_window_start).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Typography
                    variant="caption"
                    sx={{
                      backgroundColor: offer.status === 'active' ? '#c8e6c9' : '#ffccbc',
                      color: offer.status === 'active' ? '#2e7d32' : '#d84315',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}
                  >
                    {offer.status === 'active' ? '🟢 Active' : '✓ Completed'}
                  </Typography>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

const drawerWidth = 240;

function App() {
  const [records, setRecords] = useState([]);
  const [cargoOffers, setCargoOffers] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filters, setFilters] = useState({ status: '', search: '', dateFrom: '', dateTo: '' });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  async function fetchRecords() {
    setLoading(true);
    try {
      const data = await api.listRecords(filters);
      setRecords(data);
    } catch (e) {
      console.error('Failed to fetch records', e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCargoOffers() {
    try {
      const data = await cargoApi.listOffers();
      setCargoOffers(data);
    } catch (e) {
      console.error('Failed to fetch cargo offers', e);
    }
  }

  useEffect(() => {
    fetchRecords();
  }, [filters]);

  useEffect(() => {
    if (activeTab === 'cargo') {
      fetchCargoOffers();
    }
  }, [activeTab]);

  async function handleUpdateStatus(recordId, status) {
    try {
      await api.updateStatus(recordId, status);
      setSelectedRecord(null);
      fetchRecords();
    } catch (e) {
      alert('Failed to update status');
    }
  }

  async function handleDetail(recordId) {
    try {
      const record = await api.getRecord(recordId);
      setSelectedRecord(record);
    } catch (e) {
      alert('Failed to fetch record details');
    }
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar>
          <Typography variant="h6" fontWeight="bold">Logistics AI</Typography>
        </Toolbar>
        <List>
          <ListItem button onClick={() => setActiveTab('dashboard')} selected={activeTab === 'dashboard'}>
            <ListItemIcon><Dashboard /></ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItem>
          <ListItem button onClick={() => setActiveTab('cargo')} selected={activeTab === 'cargo'}>
            <ListItemIcon><LocalShipping /></ListItemIcon>
            <ListItemText primary="Cargo Marketplace" />
          </ListItem>
          <ListItem button onClick={() => setActiveTab('history')} selected={activeTab === 'history'}>
            <ListItemIcon><History /></ListItemIcon>
            <ListItemText primary="History" />
          </ListItem>
          <ListItem button onClick={() => setActiveTab('settings')}>
            <ListItemIcon><Settings /></ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItem>
          <ListItem button style={{ marginTop: 'auto', marginBottom: '20px' }}>
            <ListItemIcon><Logout /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
        <Container maxWidth="lg">
          <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold" color="textPrimary">
                {activeTab === 'dashboard' && 'Management Dashboard'}
                {activeTab === 'cargo' && '🚚 Cargo Marketplace'}
                {activeTab === 'history' && 'Record History'}
              </Typography>
              <Typography variant="h6" color="textSecondary">
                {activeTab === 'dashboard' && 'Review and validate harvest data from source farms.'}
                {activeTab === 'cargo' && 'View available cargo space and active shipments.'}
                {activeTab === 'history' && 'Historical records and completed shipments.'}
              </Typography>
            </Box>
          </Box>

          {activeTab === 'dashboard' && (
            <>
              <StatsCards records={records} />
              <Box display="flex" gap={4}>
                <Box flex={1}>
                  <RecordTable
                    records={records}
                    filters={filters}
                    setFilters={setFilters}
                    onDetail={handleDetail}
                    onStatusChange={handleUpdateStatus}
                  />
                </Box>
                {selectedRecord && (
                  <Box flex={1}>
                    <RecordDetail
                      record={selectedRecord}
                      onUpdateStatus={handleUpdateStatus}
                      onClose={() => setSelectedRecord(null)}
                    />
                  </Box>
                )}
              </Box>
            </>
          )}

          {activeTab === 'cargo' && (
            <>
              <CargoStatsCards offers={cargoOffers} />
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Active Cargo Offers</Typography>
                <CargoOffersTable offers={cargoOffers} />
              </Box>
            </>
          )}

          {activeTab === 'history' && (
            <RecordTable
              records={records}
              filters={filters}
              setFilters={setFilters}
              onDetail={handleDetail}
              onStatusChange={handleUpdateStatus}
            />
          )}

          {activeTab === 'settings' && (
            <Box p={4} sx={{ textAlign: 'center' }}>
              <Typography variant="h5">Settings Page</Typography>
              <Typography color="textSecondary">Configuration options will appear here.</Typography>
            </Box>
          )}
        </Container>
      </Box>
    </Box>
  );
}

export default App;
