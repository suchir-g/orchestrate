import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { BlockchainProvider } from './context/BlockchainContext';
import { AppStateProvider } from './context/AppStateContext';
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Common/Navbar';
import Dashboard from './components/Dashboard/Dashboard';
import EventTracking from './components/EventTracking/EventTracking';
import OrderTracking from './components/Logistics/OrderTracking';
import ShipmentTracking from './components/Logistics/ShipmentTracking';
import TicketManager from './components/Blockchain/TicketManager';
import Analytics from './components/Analytics/Analytics';
import PredictionDashboard from './components/Analytics/PredictionDashboard';
import LoadData from './components/Admin/LoadData';
import EventTimeline from './components/Timeline/EventTimeline';
import AccountPage from './components/Account/AccountPage';
// Hackathon features
import ScheduleBuilder from './components/Scheduling/ScheduleBuilder';
import EventDetail from './components/EventDetail/EventDetail';
// New access control components
import { ProtectedRoute } from './components/Common/ProtectedRoute';
import SponsorDashboard from './components/Sponsor/SponsorDashboard';
import UserManagement from './components/Admin/RoleManagement/UserManagement';

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
              <div className="App">
                <Navbar />
                <main className="app-main">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/events" element={<EventTracking />} />
                    <Route path="/orders" element={<OrderTracking />} />
                    <Route path="/shipments" element={<ShipmentTracking />} />
                    <Route path="/tickets" element={<TicketManager />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/predictions" element={<PredictionDashboard />} />
                    <Route path="/timeline" element={<EventTimeline />} />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/admin/load-data" element={<LoadData />} />
                    
                    {/* Hackathon features */}
                    <Route path="/event/:eventId" element={<EventDetail />} />
                    <Route path="/schedule/:eventId" element={
                      <ProtectedRoute requiredRole="admin" eventId={null}>
                        <ScheduleBuilder />
                      </ProtectedRoute>
                    } />

                    {/* Sponsor Dashboard - accessible to sponsors */}
                    <Route path="/sponsor/:eventId" element={
                      <ProtectedRoute requiredRole="sponsor" eventId={null}>
                        <SponsorDashboard />
                      </ProtectedRoute>
                    } />

                    {/* Admin Role Management - accessible to admins only */}
                    <Route path="/admin/:eventId/roles" element={
                      <ProtectedRoute requiredRole="admin" eventId={null}>
                        <UserManagement />
                      </ProtectedRoute>
                    } />
                  </Routes>
                </main>
                <Toaster position="top-right" />
              </div>
            </Router>
          </AppStateProvider>
        </AuthProvider>
      </BlockchainProvider>
    </ThemeProvider>
  );
}

export default App;
