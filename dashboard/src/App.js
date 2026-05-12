import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, CssBaseline } from '@mui/material';
import { api } from './services/api';
import { RecordTable, RecordDetail, StatsCards } from './components/DashboardComponents';

function App() {
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filters, setFilters] = useState({ status: '' });
  const [loading, setLoading] = useState(true);

  async function fetchRecords() {
    setLoading(true);
    try {
      const data = await api.listRecords(filters);
      // In a real app, we'd enrich these with more data if needed,
      // but the list endpoint already provides basics.
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
    <Container maxWidth="lg" style={{ marginTop: '40px', marginBottom: '40px' }}>
      <CssBaseline />
      <Box mb={4}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          Logistics Management Dashboard
        </Typography>
        <Typography variant="h6" color="textSecondary">
          Review and validate harvest data from source farms.
        </Typography>
      </Box>

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
    </Container>
  );
}

export default App;
