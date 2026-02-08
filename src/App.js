import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { BlockchainProvider } from './context/BlockchainContext';
import { AppStateProvider } from './context/AppStateContext';
import { AuthProvider } from './context/AuthContext';

// Migrations and fixes (expose to window for console access)
import './utils/migrations';
import './utils/quickFix';

// Components
import Sidebar from './components/Common/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import EventTracking from './components/EventTracking/EventTracking';
import OrderTracking from './components/Logistics/OrderTracking';
import ShipmentTracking from './components/Logistics/ShipmentTracking';
import AdminTicketManager from './components/Tickets/AdminTicketManager';
import PublicTicketClaim from './components/Tickets/PublicTicketClaim';
import Analytics from './components/Analytics/Analytics';
import LoadData from './components/Admin/LoadData';
import EventTimeline from './components/Timeline/EventTimeline';
import AccountPage from './components/Account/AccountPage';
import MessageCenter from './components/MessageCenter/MessageCenter';
// Hackathon features
import ScheduleBuilder from './components/Scheduling/ScheduleBuilder';
import EventDetail from './components/EventDetail/EventDetail';

import './App.css';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00d4ff',
      light: '#5dfdff',
      dark: '#00a3cc',
      contrastText: '#0a0a0a',
    },
    secondary: {
      main: '#ff6b9d',
      light: '#ff9dc7',
      dark: '#cc4670',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.005em',
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.02em',
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 20px',
          fontSize: '0.95rem',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BlockchainProvider>
        <AuthProvider>
          <AppStateProvider>
            <Router>
              <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                <Sidebar />
                <Box
                  component="main"
                  sx={{
                    flexGrow: 1,
                    width: { xs: '100%', sm: 'calc(100% - 240px)' },
                    overflow: 'auto',
                  }}
                >
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/events" element={<EventTracking />} />
                    <Route path="/orders" element={<OrderTracking />} />
                    <Route path="/shipments" element={<ShipmentTracking />} />
                    <Route path="/tickets" element={<AdminTicketManager />} />
                    <Route path="/claim-ticket/:eventId" element={<PublicTicketClaim />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/timeline" element={<EventTimeline />} />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/messages" element={<MessageCenter />} />
                    <Route path="/admin/load-data" element={<LoadData />} />
                    {/* Hackathon features */}
                    <Route path="/event/:eventId" element={<EventDetail />} />
                    <Route path="/schedule/:eventId" element={<ScheduleBuilder />} />
                  </Routes>
                </Box>
                <Toaster position="top-right" />
              </Box>
            </Router>
          </AppStateProvider>
        </AuthProvider>
      </BlockchainProvider>
    </ThemeProvider>
  );
}

export default App;
