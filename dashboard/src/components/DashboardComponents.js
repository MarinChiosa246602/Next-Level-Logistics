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

export const CargoStatsCards = ({ cargoData }) => {
  const totalOffers = cargoData.offers ? cargoData.offers.length : 0;
  const totalCapacity = cargoData.offers
    ? cargoData.offers.reduce((sum, offer) => sum + (offer.cargo_volume_available || 0), 0)
    : 0;
  const activeBookings = cargoData.bookings ? cargoData.bookings.length : 0;

  return (
    <Grid container spacing={3} mb={4}>
      <Grid item xs={12} sm={4}>
        <Card style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f3e5f5' }}>
          <Typography variant="h6">Active Offers</Typography>
          <Typography variant="h4">{totalOffers}</Typography>
        </Card>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Card style={{ padding: '20px', textAlign: 'center', backgroundColor: '#e1f5fe' }}>
          <Typography variant="h6">Total Capacity (m³)</Typography>
          <Typography variant="h4" color="primary.main">{totalCapacity.toFixed(1)}</Typography>
        </Card>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Card style={{ padding: '20px', textAlign: 'center', backgroundColor: '#fff3e0' }}>
          <Typography variant="h6">Active Bookings</Typography>
          <Typography variant="h4" color="warning.main">{activeBookings}</Typography>
        </Card>
      </Grid>
    </Grid>
  );
};

export const CargoOffersTable = ({ offers = [], onDetail }) => {
  return (
    <Paper style={{ width: '100%', overflow: 'hidden', padding: '20px' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">Active Cargo Offers</Typography>
      </Box>

      <Table>
        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
          <TableRow>
            <TableCell>Driver</TableCell>
            <TableCell>Vehicle</TableCell>
            <TableCell>Available (m³)</TableCell>
            <TableCell>Delivery Window</TableCell>
            <TableCell>Bookings</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {offers && offers.length > 0 ? (
            offers.map((offer) => (
              <TableRow key={offer.offer_id} hover>
                <TableCell>{offer.farmer_id}</TableCell>
                <TableCell>{offer.vehicle_brand} {offer.vehicle_model}</TableCell>
                <TableCell>{offer.cargo_volume_available}</TableCell>
                <TableCell>
                  {offer.delivery_window_start ? new Date(offer.delivery_window_start).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell>
                  <Badge badgeContent={0} color="primary">
                    <Typography variant="body2">View</Typography>
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => onDetail && onDetail(offer.offer_id)}
                  >
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Typography color="textSecondary">No active cargo offers</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
};
