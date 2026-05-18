import React from 'react';
import {
  Table, TableHead, TableBody, TableRow, TableCell,
  Button, Chip, Badge, Card, Typography,
  MenuItem, Select, FormControl, InputLabel,
  Box, Container, Grid, Paper
} from '@mui/material';
import { Download, FilterList, Visibility } from '@mui/icons-material';
import { api } from '../services/api';

export const RecordTable = ({ records, onDetail, onStatusChange, filters, setFilters }) => {
  const handleExport = async () => {
    try {
      const blob = await api.exportCSV(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `records_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Failed to export CSV: ' + error.message);
    }
  };

  return (
    <Paper style={{ width: '100%', overflow: 'hidden', padding: '20px' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">Logistics Records</Typography>
        <Button
          variant="contained"
          startIcon={<Download />}
          color="primary"
          onClick={handleExport}
        >
          Export CSV
        </Button>
      </Box>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            label="Status"
          >
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="confirmed">Confirmed</MenuItem>
            <MenuItem value="flagged">Flagged</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          startIcon={<FilterList />}
          onClick={() => setFilters({ ...filters, status: '' })}
        >
          Clear Filters
        </Button>
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Farmer ID</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Confidence</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((row) => (
            <TableRow key={row.record_id} hover>
              <TableCell>{new Date(row.submitted_at).toLocaleDateString()}</TableCell>
              <TableCell>{row.farmer_id.slice(0, 8)}...</TableCell>
              <TableCell>
                <Chip
                  label={row.status}
                  color={row.status === 'confirmed' ? 'success' : row.status === 'flagged' ? 'warning' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Badge badgeContent={row.confidence || 'N/A'} color="primary" />
              </TableCell>
              <TableCell align="right">
                <Button size="small" startIcon={<Visibility />} onClick={() => onDetail(row.record_id)}>
                  Review
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export const RecordDetail = ({ record, onUpdateStatus, onClose }) => {
  if (!record) return null;

  return (
    <Paper style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <Typography variant="h6" gutterBottom>Record Detail: {record.record_id.slice(0, 8)}</Typography>

      {record.photo_url && (
        <img src={record.photo_url} alt="Record" style={{ width: '100%', borderRadius: '8px', marginBottom: '20px' }} />
      )}

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="subtitle2">Product</Typography>
          <Typography variant="body1">{record.product.type} ({record.product.category})</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle2">Quantity</Typography>
          <Typography variant="body1">{record.quantity.estimated} {record.quantity.unit}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle2">Condition</Typography>
          <Typography variant="body1">{record.condition.rating}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle2">Overall Confidence</Typography>
          <Typography variant="body1" color={record.extraction.confidence.overall < 0.6 ? 'error' : 'textPrimary'}>
            {(record.extraction.confidence.overall * 100).toFixed(1)}%
          </Typography>
        </Grid>
      </Grid>

      <Box display="flex" gap={2} mt={4} justifyContent="flex-end">
        <Button variant="outlined" onClick={onClose}>Close</Button>
        <Button variant="contained" color="error" onClick={() => onUpdateStatus(record.record_id, 'rejected')}>Reject</Button>
        <Button variant="contained" color="warning" onClick={() => onUpdateStatus(record.record_id, 'flagged')}>Flag</Button>
        <Button variant="contained" color="success" onClick={() => onUpdateStatus(record.record_id, 'confirmed')}>Confirm</Button>
      </Box>
    </Paper>
  );
};

export const StatsCards = ({ records }) => {
  const total = records.length;
  const confirmed = records.filter(r => r.status === 'confirmed').length;
  const flagged = records.filter(r => r.status === 'flagged').length;

  return (
    <Grid container spacing={3} mb={4}>
      <Grid item xs={12} sm={4}>
        <Card style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f5f5f5' }}>
          <Typography variant="h6">Total Records</Typography>
          <Typography variant="h4">{total}</Typography>
        </Card>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Card style={{ padding: '20px', textAlign: 'center', backgroundColor: '#e8f5e9' }}>
          <Typography variant="h6">Confirmed</Typography>
          <Typography variant="h4" color="success.main">{confirmed}</Typography>
        </Card>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Card style={{ padding: '20px', textAlign: 'center', backgroundColor: '#fffde7' }}>
          <Typography variant="h6">Flagged for Review</Typography>
          <Typography variant="h4" color="warning.main">{flagged}</Typography>
        </Card>
      </Grid>
    </Grid>
  );
};
