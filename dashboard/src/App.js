import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, CssBaseline, Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import { Dashboard, History, Settings, Logout } from '@mui/icons-material';
import { api } from './services/api';
import { RecordTable, RecordDetail, StatsCards } from './components/DashboardComponents';

const drawerWidth = 240;

function App() {
  const [records, setRecords] = useState([]);
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

  useEffect(() => {
    fetchRecords();
  }, [filters]);

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
                {activeTab === 'dashboard' ? 'Management Dashboard' : 'Record History'}
              </Typography>
              <Typography variant="h6" color="textSecondary">
                Review and validate harvest data from source farms.
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
