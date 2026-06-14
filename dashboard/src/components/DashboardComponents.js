import React, { useState, useEffect } from 'react';
import {
  Table, TableHead, TableBody, TableRow, TableCell,
  Button, Chip, Card, Typography, Box, Grid, Paper,
  MenuItem, Select, FormControl, InputLabel, Drawer,
  List, ListItem, ListItemIcon, ListItemText, Divider,
  CircularProgress, Tooltip, IconButton, Avatar, Skeleton,
  LinearProgress, TextField, Snackbar, Alert,
} from '@mui/material';
import {
  Download, FilterList, Visibility, Dashboard, History,
  LocalShipping, Settings, Logout, Refresh, CheckCircle,
  Cancel, Flag, TrendingUp, DirectionsCar, AccessTime,
  LocationOn, Speed, Route, CalendarToday, Person, Add, Close,
} from '@mui/icons-material';
import { api } from '../services/api';

const drawerWidth = 260;

// ─────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────
export const Sidebar = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard',      icon: <Dashboard /> },
    { id: 'history',   label: 'Record History', icon: <History /> },
    { id: 'transport', label: 'Transport Hub',  icon: <LocalShipping /> },
    { id: 'settings',  label: 'Settings',       icon: <Settings /> },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #0f1020 0%, #151728 100%)',
          border: 'none',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        },
      }}
    >
      <Box sx={{ p: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 38, height: 38, borderRadius: 2,
            background: 'linear-gradient(135deg, #6C63FF, #00E5CC)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem',
          }}>
            🚜
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#fff', lineHeight: 1.1 }}>
              Next-Level
            </Typography>
            <Typography variant="caption" sx={{ color: '#6C63FF', fontWeight: 600, letterSpacing: '0.05em' }}>
              LOGISTICS AI
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2 }} />

      <Box sx={{ p: 1.5, flexGrow: 1 }}>
        <Typography variant="caption" sx={{ color: '#4B5280', px: 1.5, letterSpacing: '0.1em', fontWeight: 700 }}>
          NAVIGATION
        </Typography>
        <List dense sx={{ mt: 0.5 }}>
          {navItems.map(item => (
            <ListItem
              button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              sx={{
                borderRadius: 2, mb: 0.5, transition: 'all 0.2s',
                background: activeTab === item.id
                  ? 'linear-gradient(90deg, rgba(108,99,255,0.25) 0%, rgba(108,99,255,0.08) 100%)'
                  : 'transparent',
                borderLeft: activeTab === item.id ? '3px solid #6C63FF' : '3px solid transparent',
                '&:hover': { background: 'rgba(108,99,255,0.12)' },
              }}
            >
              <ListItemIcon sx={{ color: activeTab === item.id ? '#6C63FF' : '#4B5280', minWidth: 38 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.88rem',
                  fontWeight: activeTab === item.id ? 700 : 500,
                  color: activeTab === item.id ? '#fff' : '#9CA3AF',
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2 }} />
      <Box sx={{ p: 1.5 }}>
        <ListItem button sx={{ borderRadius: 2, '&:hover': { background: 'rgba(255,77,109,0.1)' } }}>
          <ListItemIcon sx={{ color: '#FF4D6D', minWidth: 38 }}><Logout /></ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{ fontSize: '0.88rem', color: '#FF4D6D', fontWeight: 500 }}
          />
        </ListItem>
      </Box>
    </Drawer>
  );
};

// ─────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────
const StatCard = ({ label, value, icon, gradient, trend }) => (
  <Card sx={{
    p: 2.5, background: gradient, border: 'none', borderRadius: 3,
    position: 'relative', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  }}>
    <Box sx={{ position: 'relative', zIndex: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
        <Box sx={{ fontSize: '1.6rem' }}>{icon}</Box>
        {trend && (
          <Chip
            icon={<TrendingUp sx={{ fontSize: '0.8rem !important' }} />}
            label={trend}
            size="small"
            sx={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, fontSize: '0.72rem' }}
          />
        )}
      </Box>
      <Typography variant="h3" fontWeight={800} sx={{ color: '#fff', lineHeight: 1 }}>{value}</Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mt: 0.5, fontWeight: 500 }}>{label}</Typography>
    </Box>
    <Box sx={{
      position: 'absolute', right: -20, top: -20,
      width: 120, height: 120, borderRadius: '50%',
      background: 'rgba(255,255,255,0.06)',
    }} />
  </Card>
);

export const StatsCards = ({ records }) => {
  const total     = records.length;
  const confirmed = records.filter(r => r.status === 'confirmed').length;
  const pending   = records.filter(r => r.status === 'pending').length;
  const flagged   = records.filter(r => r.status === 'flagged').length;
  const avgConf   = records.length
    ? (records.reduce((s, r) => s + (r.confidence || 0), 0) / records.length * 100).toFixed(0)
    : 0;

  const cards = [
    { label: 'Total Records',    value: total,          icon: '📦', gradient: 'linear-gradient(135deg, #1a1a3e 0%, #2d1b6e 100%)' },
    { label: 'Confirmed',        value: confirmed,      icon: '✅', gradient: 'linear-gradient(135deg, #0a2e1f 0%, #0d5c35 100%)', trend: total ? `${Math.round(confirmed / total * 100)}%` : '–' },
    { label: 'Pending Review',   value: pending,        icon: '⏳', gradient: 'linear-gradient(135deg, #2e1f00 0%, #5c3d00 100%)' },
    { label: 'Flagged',          value: flagged,        icon: '🚩', gradient: 'linear-gradient(135deg, #2e0010 0%, #6e001a 100%)' },
    { label: 'Avg. Confidence',  value: `${avgConf}%`, icon: '🎯', gradient: 'linear-gradient(135deg, #001a2e 0%, #003d6e 100%)' },
  ];

  return (
    <>
      <Box sx={{ mb: 1 }}>
        <Typography variant="h4" sx={{ color: '#fff', mb: 0.5 }}>Management Hub</Typography>
        <Typography variant="body2" sx={{ color: '#6B7280' }}>
          Real-time overview of harvest records and transport submissions
        </Typography>
      </Box>
      <Grid container spacing={2} sx={{ mb: 4, mt: 0.5 }}>
        {cards.map(card => (
          <Grid item xs={12} sm={6} md={2.4} key={card.label}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>
    </>
  );
};

// ─────────────────────────────────────────────
// STATUS CHIP
// ─────────────────────────────────────────────
const StatusChip = ({ status }) => {
  const map = {
    confirmed: { color: '#00C896', bg: 'rgba(0,200,150,0.12)',   label: 'Confirmed' },
    pending:   { color: '#FFB547', bg: 'rgba(255,181,71,0.12)',  label: 'Pending' },
    flagged:   { color: '#FF8C42', bg: 'rgba(255,140,66,0.12)',  label: 'Flagged' },
    rejected:  { color: '#FF4D6D', bg: 'rgba(255,77,109,0.12)', label: 'Rejected' },
    active:    { color: '#6C63FF', bg: 'rgba(108,99,255,0.12)', label: 'Active' },
    completed: { color: '#00C896', bg: 'rgba(0,200,150,0.12)',   label: 'Completed' },
    cancelled: { color: '#FF4D6D', bg: 'rgba(255,77,109,0.12)', label: 'Cancelled' },
  };
  const s = map[status] || { color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)', label: status };
  return (
    <Chip label={s.label} size="small"
      sx={{ color: s.color, background: s.bg, fontWeight: 700, border: `1px solid ${s.color}30` }} />
  );
};

// ─────────────────────────────────────────────
// CONFIDENCE BAR
// ─────────────────────────────────────────────
const ConfBar = ({ value }) => {
  const pct   = value != null ? Math.round(value * 100) : null;
  const color = pct >= 80 ? '#00C896' : pct >= 60 ? '#FFB547' : '#FF4D6D';
  if (pct == null) return <Typography variant="body2" sx={{ color: '#4B5280' }}>—</Typography>;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <LinearProgress variant="determinate" value={pct} sx={{
        flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)',
        '& .MuiLinearProgress-bar': { background: color, borderRadius: 3 },
      }} />
      <Typography variant="caption" sx={{ color, fontWeight: 700, minWidth: 34 }}>{pct}%</Typography>
    </Box>
  );
};

// ─────────────────────────────────────────────
// RECORD TABLE
// ─────────────────────────────────────────────
export const RecordTable = ({ records, loading, onDetail, onStatusChange, filters, setFilters }) => {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const blob = await api.exportCSV(filters);
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      const date = new Date().toISOString().slice(0, 10);
      const suffix = filters.status ? `_${filters.status}` : '';
      a.download = `records${suffix}_${date}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      setExportError('Export failed: ' + e.message);
    } finally {
      setExporting(false);
    }
  };


  return (
    <>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
          <Typography variant="h6">Harvest Records</Typography>
          <Button
            variant="contained" size="small"
            startIcon={exporting ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <Download sx={{ fontSize: '0.9rem' }} />}
            onClick={handleExport}
            disabled={exporting}
            sx={{ background: 'linear-gradient(90deg,#6C63FF,#00E5CC)', borderRadius: 2, textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
          >
            {exporting ? 'Exporting…' : 'Export CSV'}
          </Button>
        </Box>

        <Box display="flex" gap={1.5} mb={2.5} flexWrap="wrap">
          <FormControl variant="outlined" size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select value={filters.status || ''} onChange={e => setFilters({ ...filters, status: e.target.value })} label="Status">
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="flagged">Flagged</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined" size="small"
            startIcon={<FilterList />}
            onClick={() => setFilters({ status: '', dateFrom: '', dateTo: '' })}
            sx={{ borderRadius: 2, textTransform: 'none', color: '#9CA3AF', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            Clear
          </Button>
        </Box>

        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Confidence</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton animation="wave" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : records.map(row => (
                    <TableRow key={row.record_id} hover sx={{
                      cursor: 'pointer',
                      '&:hover': { background: 'rgba(108,99,255,0.05)' },
                      '& td': { borderColor: 'rgba(255,255,255,0.04)' },
                    }}>
                      <TableCell sx={{ color: '#9CA3AF', fontSize: '0.82rem' }}>
                        {new Date(row.submitted_at).toLocaleDateString('nl-NL')}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} sx={{ color: '#E5E7EB' }}>{row.product_type || '—'}</Typography>
                        <Typography variant="caption" sx={{ color: '#6B7280' }}>{String(row.farmer_id || '').slice(0, 8)}…</Typography>
                      </TableCell>
                      <TableCell sx={{ color: '#D1D5DB', fontSize: '0.82rem' }}>
                        {row.quantity != null ? `${row.quantity} ${row.quantity_unit || ''}` : '—'}
                      </TableCell>
                      <TableCell sx={{ color: '#9CA3AF', fontSize: '0.82rem' }}>{row.location || '—'}</TableCell>
                      <TableCell><StatusChip status={row.status} /></TableCell>
                      <TableCell sx={{ minWidth: 120 }}><ConfBar value={row.confidence} /></TableCell>
                      <TableCell align="right">
                        <Tooltip title="Review record">
                          <IconButton size="small" onClick={() => onDetail(row.record_id)}
                            sx={{ color: '#6C63FF', '&:hover': { background: 'rgba(108,99,255,0.1)' } }}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
              }
              {!loading && records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#4B5280' }}>
                    No records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      <Snackbar
        open={Boolean(exportError)}
        autoHideDuration={5000}
        onClose={() => setExportError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setExportError(null)} sx={{ borderRadius: 2 }}>
          {exportError}
        </Alert>
      </Snackbar>
    </>
  );
};

// ─────────────────────────────────────────────
// RECORD DETAIL PANEL
// ─────────────────────────────────────────────
export const RecordDetailPanel = ({ record, onUpdateStatus, onClose }) => {
  if (!record) return null;

  const confPct = record.extraction?.confidence?.overall != null
    ? (record.extraction.confidence.overall * 100).toFixed(1)
    : null;

  const fields = [
    { label: 'Product',   value: `${record.product?.type || '—'} (${record.product?.category || '—'})` },
    { label: 'Quantity',  value: `${record.quantity?.estimated ?? '—'} ${record.quantity?.unit || ''}` },
    { label: 'Condition', value: record.condition?.rating || '—' },
    { label: 'Location',  value: record.provenance?.location_label || '—' },
    { label: 'Lot #',     value: record.traceability?.lot_number || '—' },
    { label: 'Expiry',    value: record.traceability?.expiry_date ? new Date(record.traceability.expiry_date).toLocaleDateString() : '—' },
    { label: 'Method',    value: record.extraction?.method || '—' },
    { label: 'Confidence', value: confPct ? `${confPct}%` : '—' },
  ];

  return (
    <Paper sx={{
      p: 3, borderRadius: 3,
      background: 'rgba(21,23,40,0.98)',
      border: '1px solid rgba(108,99,255,0.2)',
      position: 'sticky', top: 24,
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Record Detail</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: '#6B7280' }}><Cancel fontSize="small" /></IconButton>
      </Box>
      <Typography variant="caption" sx={{ color: '#4B5280', fontFamily: 'monospace' }}>{record.record_id}</Typography>
      {record.photo_url && (
        <Box component="img" src={record.photo_url} alt="Record"
          sx={{ width: '100%', borderRadius: 2, mt: 2, mb: 2, maxHeight: 200, objectFit: 'cover' }} />
      )}
      <Grid container spacing={1.5} sx={{ mt: 1 }}>
        {fields.map(f => (
          <Grid item xs={6} key={f.label}>
            <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mb: 0.3 }}>{f.label}</Typography>
            <Typography variant="body2" fontWeight={600} sx={{ color: '#E5E7EB' }}>{f.value}</Typography>
          </Grid>
        ))}
      </Grid>
      <Divider sx={{ my: 2.5, borderColor: 'rgba(255,255,255,0.06)' }} />
      <Box display="flex" gap={1} justifyContent="flex-end" flexWrap="wrap">
        <Button size="small" variant="outlined"
          startIcon={<Cancel sx={{ fontSize: '0.85rem' }} />}
          onClick={() => onUpdateStatus(record.record_id, 'rejected')}
          sx={{ color: '#FF4D6D', borderColor: 'rgba(255,77,109,0.4)', borderRadius: 2, textTransform: 'none' }}>
          Reject
        </Button>
        <Button size="small" variant="outlined"
          startIcon={<Flag sx={{ fontSize: '0.85rem' }} />}
          onClick={() => onUpdateStatus(record.record_id, 'flagged')}
          sx={{ color: '#FFB547', borderColor: 'rgba(255,181,71,0.4)', borderRadius: 2, textTransform: 'none' }}>
          Flag
        </Button>
        <Button size="small" variant="contained"
          startIcon={<CheckCircle sx={{ fontSize: '0.85rem' }} />}
          onClick={() => onUpdateStatus(record.record_id, 'confirmed')}
          sx={{ background: 'linear-gradient(90deg,#00C896,#00E5CC)', borderRadius: 2, textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
          Confirm
        </Button>
      </Box>
    </Paper>
  );
};

// ─────────────────────────────────────────────
// TRANSPORT STAT CARDS
// ─────────────────────────────────────────────
const TransportStatsCards = ({ cargoData }) => {
  const offers   = cargoData.offers   || [];
  const bookings = cargoData.bookings || [];
  const active    = offers.filter(o => o.status === 'active').length;
  const capacity  = offers.reduce((s, o) => s + parseFloat(o.cargo_volume_available || 0), 0);
  const booked    = bookings.filter(b => ['pending', 'confirmed'].includes(b.status)).length;
  const delivered = bookings.filter(b => b.status === 'delivered').length;

  const cards = [
    { label: 'Active Travel Plans',    value: active,             icon: '🚛', gradient: 'linear-gradient(135deg, #1a0f3e 0%, #3d1b8e 100%)' },
    { label: 'Available Capacity (m³)', value: capacity.toFixed(1), icon: '📐', gradient: 'linear-gradient(135deg, #001a3e 0%, #00428e 100%)' },
    { label: 'Active Bookings',        value: booked,             icon: '📋', gradient: 'linear-gradient(135deg, #1a2e00 0%, #3d6e00 100%)' },
    { label: 'Deliveries Completed',   value: delivered,          icon: '🏁', gradient: 'linear-gradient(135deg, #002e1a 0%, #006e3d 100%)' },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {cards.map(card => (
        <Grid item xs={12} sm={6} md={3} key={card.label}>
          <StatCard {...card} />
        </Grid>
      ))}
    </Grid>
  );
};

// ─────────────────────────────────────────────
// TRANSPORT OFFER CARD
// ─────────────────────────────────────────────
const TransportOfferCard = ({ offer, onCancel }) => {
  const startDate = offer.delivery_window_start ? new Date(offer.delivery_window_start) : null;
  const endDate   = offer.delivery_window_end   ? new Date(offer.delivery_window_end)   : null;
  const usedPct   = offer.cargo_volume_total > 0
    ? Math.round((1 - offer.cargo_volume_available / offer.cargo_volume_total) * 100)
    : 0;

  return (
    <Card sx={{
      p: 2.5, borderRadius: 2.5,
      background: 'rgba(21,23,40,0.95)',
      border: '1px solid rgba(255,255,255,0.06)',
      transition: 'all 0.2s',
      '&:hover': { border: '1px solid rgba(108,99,255,0.3)', transform: 'translateY(-2px)', boxShadow: '0 12px 40px rgba(108,99,255,0.15)' },
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar sx={{ width: 42, height: 42, background: 'linear-gradient(135deg,#6C63FF,#00E5CC)', fontSize: '1.1rem' }}>
            🚛
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#E5E7EB' }}>
              {offer.vehicle_brand} {offer.vehicle_model}{offer.vehicle_year ? ` (${offer.vehicle_year})` : ''}
            </Typography>
            <Typography variant="caption" sx={{ color: '#4B5280', fontFamily: 'monospace' }}>
              {offer.license_plate}
            </Typography>
          </Box>
        </Box>
        <StatusChip status={offer.status} />
      </Box>

      <Grid container spacing={1.5} mb={2}>
        <Grid item xs={6}>
          <Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
            <Speed sx={{ fontSize: '0.85rem', color: '#6C63FF' }} />
            <Typography variant="caption" sx={{ color: '#6B7280' }}>Available</Typography>
          </Box>
          <Typography variant="body2" fontWeight={700} sx={{ color: '#E5E7EB' }}>
            {offer.cargo_volume_available} / {offer.cargo_volume_total} m³
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
            <LocationOn sx={{ fontSize: '0.85rem', color: '#00E5CC' }} />
            <Typography variant="caption" sx={{ color: '#6B7280' }}>Destination</Typography>
          </Box>
          <Typography variant="body2" fontWeight={700} sx={{ color: '#E5E7EB' }} noWrap>
            {offer.delivery_location_label || '—'}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
            <CalendarToday sx={{ fontSize: '0.85rem', color: '#FFB547' }} />
            <Typography variant="caption" sx={{ color: '#6B7280' }}>Window</Typography>
          </Box>
          <Typography variant="body2" fontWeight={700} sx={{ color: '#E5E7EB' }}>
            {startDate ? startDate.toLocaleDateString('nl-NL') : '—'}
            {endDate   ? ` → ${endDate.toLocaleDateString('nl-NL')}` : ''}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
            <Person sx={{ fontSize: '0.85rem', color: '#00C896' }} />
            <Typography variant="caption" sx={{ color: '#6B7280' }}>Driver Contact</Typography>
          </Box>
          <Typography variant="body2" fontWeight={700} sx={{ color: '#E5E7EB' }}>
            {offer.driver_contact_phone || '—'}
          </Typography>
        </Grid>
      </Grid>

      <Box mb={2}>
        <Box display="flex" justifyContent="space-between" mb={0.5}>
          <Typography variant="caption" sx={{ color: '#6B7280' }}>Capacity used</Typography>
          <Typography variant="caption" sx={{ color: '#6C63FF', fontWeight: 700 }}>{usedPct}%</Typography>
        </Box>
        <LinearProgress variant="determinate" value={usedPct} sx={{
          height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)',
          '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg,#6C63FF,#00E5CC)', borderRadius: 3 },
        }} />
      </Box>

      {offer.driver_notes && (
        <Box sx={{ p: 1.5, borderRadius: 1.5, mb: 2, background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.12)' }}>
          <Typography variant="caption" sx={{ color: '#9CA3AF', fontStyle: 'italic' }}>
            "{offer.driver_notes}"
          </Typography>
        </Box>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" sx={{ color: '#4B5280' }}>
          <AccessTime sx={{ fontSize: '0.75rem', mr: 0.5, verticalAlign: 'middle' }} />
          {offer.created_at ? new Date(offer.created_at).toLocaleDateString('nl-NL') : '—'}
        </Typography>
        {offer.status === 'active' && onCancel && (
          <Button size="small" variant="outlined"
            startIcon={<Cancel sx={{ fontSize: '0.8rem' }} />}
            onClick={() => onCancel(offer.offer_id)}
            sx={{ color: '#FF4D6D', borderColor: 'rgba(255,77,109,0.3)', borderRadius: 2, textTransform: 'none', fontSize: '0.75rem',
              '&:hover': { borderColor: '#FF4D6D', background: 'rgba(255,77,109,0.05)' } }}>
            Cancel
          </Button>
        )}
      </Box>
    </Card>
  );
};

// ─────────────────────────────────────────────
// BOOKING ROW
// ─────────────────────────────────────────────
const BookingRow = ({ booking }) => (
  <TableRow hover sx={{ '&:hover': { background: 'rgba(108,99,255,0.05)' }, '& td': { borderColor: 'rgba(255,255,255,0.04)' } }}>
    <TableCell sx={{ color: '#9CA3AF', fontSize: '0.82rem', fontFamily: 'monospace' }}>
      {String(booking.booking_id || '').slice(0, 8)}…
    </TableCell>
    <TableCell sx={{ color: '#D1D5DB', fontSize: '0.82rem' }}>{booking.cargo_volume_booked} m³</TableCell>
    <TableCell><StatusChip status={booking.status} /></TableCell>
    <TableCell sx={{ color: '#9CA3AF', fontSize: '0.82rem' }}>
      {booking.created_at ? new Date(booking.created_at).toLocaleDateString('nl-NL') : '—'}
    </TableCell>
    <TableCell sx={{ color: '#9CA3AF', fontSize: '0.82rem' }}>{booking.pickup_notes || '—'}</TableCell>
  </TableRow>
);

// ─────────────────────────────────────────────
// NEW TRANSPORT REQUEST DRAWER
// ─────────────────────────────────────────────
export const NewTransportRequestDrawer = ({ open, onClose, onSuccess }) => {
  const today = new Date().toISOString().slice(0, 10);

  const emptyForm = {
    farmer_id: '',
    license_plate: '',
    vehicle_brand: '',
    vehicle_model: '',
    vehicle_year: '',
    cargo_volume_total: '',
    pickup_lat: '',
    pickup_lng: '',
    delivery_location_label: '',
    delivery_lat: '',
    delivery_lng: '',
    delivery_date: today,
    delivery_window_start_time: '08:00',
    delivery_window_end_time: '17:00',
    driver_contact_phone: '',
    driver_notes: '',
  };

  const [form, setForm]           = useState(emptyForm);
  const [farmers, setFarmers]     = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]         = useState(null);

  useEffect(() => {
    if (open) {
      api.listFarmers().then(setFarmers).catch(() => setFarmers([]));
    }
  }, [open]);

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.farmer_id)               return setToast({ severity: 'error', message: 'Select a farmer' });
    if (!form.license_plate.trim())    return setToast({ severity: 'error', message: 'License plate is required' });
    if (!form.cargo_volume_total)      return setToast({ severity: 'error', message: 'Cargo volume is required' });
    if (!form.delivery_location_label) return setToast({ severity: 'error', message: 'Delivery location is required' });
    if (!form.delivery_lat || !form.delivery_lng)
      return setToast({ severity: 'error', message: 'Delivery coordinates (lat / lng) are required' });

    setSubmitting(true);
    try {
      const windowStart = new Date(`${form.delivery_date}T${form.delivery_window_start_time}:00`).toISOString();
      const windowEnd   = new Date(`${form.delivery_date}T${form.delivery_window_end_time}:00`).toISOString();

      await api.createCargoOffer(form.farmer_id, {
        license_plate:           form.license_plate.trim().toUpperCase(),
        vehicle_brand:           form.vehicle_brand.trim()  || 'Unknown',
        vehicle_model:           form.vehicle_model.trim()  || 'Unknown',
        vehicle_year:            form.vehicle_year.trim()   || null,
        cargo_volume_total:      parseFloat(form.cargo_volume_total),
        pickup_lat:              form.pickup_lat  ? parseFloat(form.pickup_lat)  : null,
        pickup_lng:              form.pickup_lng  ? parseFloat(form.pickup_lng)  : null,
        delivery_location_label: form.delivery_location_label.trim(),
        delivery_lat:            parseFloat(form.delivery_lat),
        delivery_lng:            parseFloat(form.delivery_lng),
        delivery_window_start:   windowStart,
        delivery_window_end:     windowEnd,
        driver_contact_phone:    form.driver_contact_phone.trim() || null,
        driver_notes:            form.driver_notes.trim()         || null,
      });

      setToast({ severity: 'success', message: 'Transport request submitted!' });
      setForm(emptyForm);
      setTimeout(() => { if (onSuccess) onSuccess(); onClose(); }, 1200);
    } catch (e) {
      setToast({ severity: 'error', message: e.message || 'Submission failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      color: '#E5E7EB',
      '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
      '&:hover fieldset': { borderColor: 'rgba(108,99,255,0.4)' },
      '&.Mui-focused fieldset': { borderColor: '#6C63FF' },
    },
    '& .MuiInputLabel-root': { color: '#6B7280' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#6C63FF' },
    '& .MuiSelect-icon': { color: '#6B7280' },
  };

  const SectionLabel = ({ children }) => (
    <Typography variant="caption"
      sx={{ color: '#4B5280', letterSpacing: '0.1em', fontWeight: 700, display: 'block', mt: 2.5, mb: 1 }}>
      {children}
    </Typography>
  );

  return (
    <React.Fragment>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 480 },
            background: '#0f1020',
            borderLeft: '1px solid rgba(108,99,255,0.2)',
            p: 0,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Header */}
        <Box sx={{
          p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'linear-gradient(90deg, rgba(108,99,255,0.15) 0%, transparent 100%)',
        }}>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ color: '#fff' }}>New Transport Request</Typography>
            <Typography variant="caption" sx={{ color: '#6B7280' }}>Submit a new cargo travel plan</Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: '#6B7280', '&:hover': { color: '#fff' } }}>
            <Close />
          </IconButton>
        </Box>

        {/* Form body */}
        <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
          <SectionLabel>FARMER</SectionLabel>
          <FormControl fullWidth size="small" sx={fieldSx}>
            <InputLabel>Select Farmer *</InputLabel>
            <Select
              value={form.farmer_id}
              onChange={set('farmer_id')}
              label="Select Farmer *"
              MenuProps={{ PaperProps: { sx: { background: '#151728', color: '#E5E7EB' } } }}
            >
              {farmers.length === 0
                ? <MenuItem disabled>Loading farmers…</MenuItem>
                : farmers.map(f => (
                    <MenuItem key={f.farmer_id} value={f.farmer_id}>
                      {f.name} — {String(f.farmer_id).slice(0, 8)}…
                    </MenuItem>
                  ))
              }
            </Select>
          </FormControl>

          <SectionLabel>VEHICLE</SectionLabel>
          <Grid container spacing={1.5}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="License Plate *"
                value={form.license_plate} onChange={set('license_plate')}
                placeholder="e.g. AB-12-CD"
                inputProps={{ style: { textTransform: 'uppercase' } }} sx={fieldSx} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Brand"
                value={form.vehicle_brand} onChange={set('vehicle_brand')}
                placeholder="e.g. Mercedes" sx={fieldSx} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Model"
                value={form.vehicle_model} onChange={set('vehicle_model')}
                placeholder="e.g. Sprinter" sx={fieldSx} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Year"
                value={form.vehicle_year} onChange={set('vehicle_year')}
                placeholder="e.g. 2021" sx={fieldSx} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Cargo Volume (m³) *"
                value={form.cargo_volume_total} onChange={set('cargo_volume_total')}
                type="number" inputProps={{ min: 0, step: 0.5 }} sx={fieldSx} />
            </Grid>
          </Grid>

          <SectionLabel>PICKUP LOCATION (optional)</SectionLabel>
          <Grid container spacing={1.5}>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Pickup Lat"
                value={form.pickup_lat} onChange={set('pickup_lat')}
                placeholder="52.37" type="number" sx={fieldSx} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Pickup Lng"
                value={form.pickup_lng} onChange={set('pickup_lng')}
                placeholder="4.90" type="number" sx={fieldSx} />
            </Grid>
          </Grid>

          <SectionLabel>DELIVERY</SectionLabel>
          <Grid container spacing={1.5}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Delivery Location *"
                value={form.delivery_location_label} onChange={set('delivery_location_label')}
                placeholder="e.g. Amsterdam Central Market" sx={fieldSx} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Delivery Lat *"
                value={form.delivery_lat} onChange={set('delivery_lat')}
                placeholder="52.37" type="number" sx={fieldSx} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Delivery Lng *"
                value={form.delivery_lng} onChange={set('delivery_lng')}
                placeholder="4.90" type="number" sx={fieldSx} />
            </Grid>
          </Grid>

          <SectionLabel>DELIVERY TIME WINDOW</SectionLabel>
          <Grid container spacing={1.5}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Date *"
                value={form.delivery_date} onChange={set('delivery_date')}
                type="date" InputLabelProps={{ shrink: true }} sx={fieldSx} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="From"
                value={form.delivery_window_start_time} onChange={set('delivery_window_start_time')}
                type="time" InputLabelProps={{ shrink: true }} sx={fieldSx} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="To"
                value={form.delivery_window_end_time} onChange={set('delivery_window_end_time')}
                type="time" InputLabelProps={{ shrink: true }} sx={fieldSx} />
            </Grid>
          </Grid>

          <SectionLabel>DRIVER INFO (optional)</SectionLabel>
          <Grid container spacing={1.5}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Driver Phone"
                value={form.driver_contact_phone} onChange={set('driver_contact_phone')}
                placeholder="+31 6 12345678" sx={fieldSx} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Special Instructions"
                value={form.driver_notes} onChange={set('driver_notes')}
                placeholder="e.g. Early morning preferred…"
                multiline rows={3} sx={fieldSx} />
            </Grid>
          </Grid>
        </Box>

        {/* Footer */}
        <Box sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 1.5 }}>
          <Button fullWidth variant="outlined" onClick={onClose}
            sx={{ color: '#6B7280', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 2, textTransform: 'none' }}>
            Cancel
          </Button>
          <Button fullWidth variant="contained" onClick={handleSubmit} disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : <CheckCircle />}
            sx={{ background: 'linear-gradient(90deg,#6C63FF,#00E5CC)', borderRadius: 2, textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
            {submitting ? 'Submitting…' : 'Submit Request'}
          </Button>
        </Box>
      </Drawer>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert severity={toast.severity} onClose={() => setToast(null)} sx={{ borderRadius: 2 }}>
            {toast.message}
          </Alert>
        ) : <Box />}
      </Snackbar>
    </React.Fragment>
  );
};

// ─────────────────────────────────────────────
// TRANSPORT HUB
// ─────────────────────────────────────────────
export const TransportHub = ({ cargoData, loading, onRefresh, onCancelOffer }) => {
  const [tab, setTab]               = useState('offers');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const offers   = cargoData.offers   || [];
  const bookings = cargoData.bookings || [];

  return (
    <React.Fragment>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h4" sx={{ color: '#fff', mb: 0.5 }}>Transport Hub</Typography>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>
            All travel plan submissions and cargo bookings from farmers
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="contained" size="small"
            startIcon={<Add />}
            onClick={() => setDrawerOpen(true)}
            sx={{ background: 'linear-gradient(90deg,#6C63FF,#00E5CC)', borderRadius: 2, textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}
          >
            New Request
          </Button>
          <Button
            variant="outlined" size="small"
            startIcon={loading ? <CircularProgress size={14} /> : <Refresh />}
            onClick={onRefresh}
            disabled={loading}
            sx={{ color: '#6C63FF', borderColor: 'rgba(108,99,255,0.4)', borderRadius: 2, textTransform: 'none',
              '&:hover': { borderColor: '#6C63FF', background: 'rgba(108,99,255,0.08)' } }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <TransportStatsCards cargoData={cargoData} />

      {/* Sub-tabs */}
      <Box display="flex" gap={1} mb={3}>
        {[
          { id: 'offers',   label: `Travel Plans (${offers.length})`,  icon: <Route sx={{ fontSize: '1rem' }} /> },
          { id: 'bookings', label: `Bookings (${bookings.length})`,     icon: <DirectionsCar sx={{ fontSize: '1rem' }} /> },
        ].map(t => (
          <Button key={t.id} startIcon={t.icon} onClick={() => setTab(t.id)}
            sx={{
              borderRadius: 2, textTransform: 'none', fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? '#6C63FF' : '#6B7280',
              background: tab === t.id ? 'rgba(108,99,255,0.12)' : 'transparent',
              border: `1px solid ${tab === t.id ? 'rgba(108,99,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
              px: 2,
            }}>
            {t.label}
          </Button>
        ))}
      </Box>

      {/* Travel Plans */}
      {tab === 'offers' && (
        loading
          ? (
            <Grid container spacing={2}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Skeleton variant="rounded" height={280} sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 2 }} />
                </Grid>
              ))}
            </Grid>
          )
          : offers.length === 0
          ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10, gap: 2 }}>
              <Box sx={{ fontSize: 56 }}>🚛</Box>
              <Typography sx={{ color: '#4B5280' }}>No travel plans submitted yet</Typography>
              <Button
                variant="contained" startIcon={<Add />}
                onClick={() => setDrawerOpen(true)}
                sx={{ background: 'linear-gradient(90deg,#6C63FF,#00E5CC)', borderRadius: 2, textTransform: 'none', fontWeight: 700, boxShadow: 'none', mt: 1 }}>
                Submit First Request
              </Button>
            </Box>
          )
          : (
            <Grid container spacing={2}>
              {offers.map(offer => (
                <Grid item xs={12} sm={6} md={4} key={offer.offer_id}>
                  <TransportOfferCard offer={offer} onCancel={onCancelOffer} />
                </Grid>
              ))}
            </Grid>
          )
      )}

      {/* Bookings */}
      {tab === 'bookings' && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" mb={2.5}>Cargo Bookings</Typography>
          {loading
            ? <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />
            : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Booking ID</TableCell>
                    <TableCell>Volume (m³)</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.length === 0
                    ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 6, color: '#4B5280' }}>No bookings yet</TableCell>
                      </TableRow>
                    )
                    : bookings.map(b => <BookingRow key={b.booking_id} booking={b} />)
                  }
                </TableBody>
              </Table>
            )
          }
        </Paper>
      )}

      <NewTransportRequestDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={onRefresh}
      />
    </React.Fragment>
  );
};
