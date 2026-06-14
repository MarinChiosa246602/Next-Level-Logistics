import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CssBaseline, Box, ThemeProvider, createTheme, Snackbar, Alert, IconButton, Tooltip, Badge } from '@mui/material';
import { Refresh, FiberManualRecord } from '@mui/icons-material';
import { api } from './services/api';
import {
  Sidebar,
  RecordTable,
  RecordDetailPanel,
  StatsCards,
  TransportHub,
} from './components/DashboardComponents';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary:   { main: '#6C63FF' },
    secondary: { main: '#00E5CC' },
    background: { default: '#0D0F1A', paper: '#151728' },
    success: { main: '#00C896' },
    warning: { main: '#FFB547' },
    error:   { main: '#FF4D6D' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: 'rgba(21,23,40,0.95)',
          border: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 700, color: '#9CA3AF', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.04em' },
      },
    },
  },
});

// Auto-refresh interval in milliseconds (10 seconds)
const AUTO_REFRESH_MS = 10000;

function App() {
  const [records, setRecords]               = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filters, setFilters]               = useState({ status: '', dateFrom: '', dateTo: '' });
  const [loading, setLoading]               = useState(true);
  const [activeTab, setActiveTab]           = useState('dashboard');
  const [cargoData, setCargoData]           = useState({ offers: [], bookings: [] });
  const [cargoLoading, setCargoLoading]     = useState(false);
  const [apiError, setApiError]             = useState(null);
  const [lastUpdated, setLastUpdated]       = useState(null);
  const [newCount, setNewCount]             = useState(0);      // records added since last render
  const prevCountRef                        = useRef(0);
  const [toast, setToast]                   = useState(null);

  /* ─── Records ─── */
  const fetchRecords = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const data = await api.listRecords(filters);

      // Ensure we always have an array
      const arr = Array.isArray(data) ? data : (data?.records ?? data?.items ?? []);

      // Detect new submissions since last fetch
      if (prevCountRef.current > 0 && arr.length > prevCountRef.current) {
        const added = arr.length - prevCountRef.current;
        setNewCount(added);
        setToast({ severity: 'success', message: `${added} new submission${added > 1 ? 's' : ''} received!` });
      }
      prevCountRef.current = arr.length;

      setRecords(arr);
      setLastUpdated(new Date());
      setApiError(null);
    } catch (e) {
      console.error('Failed to fetch records', e);
      setApiError('Could not reach the API — make sure the backend server is running.');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [filters]);

  // Initial load + re-fetch when filters change
  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // Auto-refresh every 10 seconds (quiet — no spinner)
  useEffect(() => {
    const id = setInterval(() => fetchRecords(true), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchRecords]);

  /* ─── Cargo / Transport ─── */
  const fetchCargoData = useCallback(async () => {
    setCargoLoading(true);
    try {
      const [offers, bookings] = await Promise.all([
        api.listCargoOffers(),
        api.listCargoBookings(),
      ]);
      setCargoData({
        offers:   Array.isArray(offers)   ? offers   : [],
        bookings: Array.isArray(bookings) ? bookings : [],
      });
    } catch (e) {
      console.error('Failed to fetch cargo data', e);
      setCargoData({ offers: [], bookings: [] });
    } finally {
      setCargoLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'transport') fetchCargoData();
  }, [activeTab, fetchCargoData]);

  /* ─── Actions ─── */
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

  async function handleCancelOffer(offerId) {
    try {
      await api.cancelCargoOffer(offerId);
      fetchCargoData();
    } catch (e) {
      alert('Failed to cancel offer');
    }
  }

  /* ─── Live indicator dot ─── */
  const LiveDot = () => (
    <Box
      sx={{
        display: 'flex', alignItems: 'center', gap: 0.75,
        position: 'fixed', bottom: 20, right: 24,
        background: 'rgba(21,23,40,0.9)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 99, px: 1.5, py: 0.5,
        zIndex: 2000,
        backdropFilter: 'blur(8px)',
      }}
    >
      <Box
        sx={{
          width: 8, height: 8, borderRadius: '50%',
          background: apiError ? '#FF4D6D' : '#00C896',
          boxShadow: apiError
            ? '0 0 6px #FF4D6D'
            : '0 0 6px #00C896',
          animation: apiError ? 'none' : 'pulse 2s infinite',
          '@keyframes pulse': {
            '0%,100%': { opacity: 1 },
            '50%': { opacity: 0.4 },
          },
        }}
      />
      <Box sx={{ fontSize: '0.7rem', color: apiError ? '#FF4D6D' : '#9CA3AF', fontWeight: 600 }}>
        {apiError ? 'API offline' : `Live · ${lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '…'}`}
      </Box>
      <Tooltip title="Refresh now">
        <IconButton
          size="small"
          onClick={() => fetchRecords()}
          sx={{ color: '#6C63FF', p: 0.25, '&:hover': { color: '#fff' } }}
        >
          <Refresh sx={{ fontSize: '0.9rem' }} />
        </IconButton>
      </Tooltip>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', background: theme.palette.background.default }}>
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 4 },
            minHeight: '100vh',
            overflowX: 'hidden',
          }}
        >
          {/* API error banner */}
          {apiError && (
            <Box
              sx={{
                mb: 3, p: 2, borderRadius: 2,
                background: 'rgba(255,77,109,0.08)',
                border: '1px solid rgba(255,77,109,0.3)',
                color: '#FF4D6D',
                fontSize: '0.875rem',
                display: 'flex', alignItems: 'center', gap: 1,
              }}
            >
              ⚠️ {apiError}
            </Box>
          )}

          {/* ── Dashboard tab ── */}
          {activeTab === 'dashboard' && (
            <>
              <StatsCards records={records} />
              <Box display="flex" gap={3} flexWrap="wrap">
                <Box flex="1 1 520px" minWidth={0}>
                  <RecordTable
                    records={records}
                    loading={loading}
                    filters={filters}
                    setFilters={setFilters}
                    onDetail={handleDetail}
                    onStatusChange={handleUpdateStatus}
                  />
                </Box>
                {selectedRecord && (
                  <Box flex="0 0 380px">
                    <RecordDetailPanel
                      record={selectedRecord}
                      onUpdateStatus={handleUpdateStatus}
                      onClose={() => setSelectedRecord(null)}
                    />
                  </Box>
                )}
              </Box>
            </>
          )}

          {/* ── History tab ── */}
          {activeTab === 'history' && (
            <RecordTable
              records={records}
              loading={loading}
              filters={filters}
              setFilters={setFilters}
              onDetail={handleDetail}
              onStatusChange={handleUpdateStatus}
            />
          )}

          {/* ── Transport Hub tab ── */}
          {activeTab === 'transport' && (
            <TransportHub
              cargoData={cargoData}
              loading={cargoLoading}
              onRefresh={fetchCargoData}
              onCancelOffer={handleCancelOffer}
            />
          )}

          {/* ── Settings tab ── */}
          {activeTab === 'settings' && (
            <Box
              sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', minHeight: '60vh', gap: 2,
              }}
            >
              <Box sx={{ fontSize: 64 }}>⚙️</Box>
              <Box sx={{ color: 'text.secondary', fontSize: '1rem' }}>
                Settings — coming soon
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Live status pill — always visible bottom-right */}
      <LiveDot />

      {/* New submission toast */}
      <Snackbar
        open={!!toast}
        autoHideDuration={5000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {toast && (
          <Alert
            severity={toast.severity}
            onClose={() => setToast(null)}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            {toast.message}
          </Alert>
        )}
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;
