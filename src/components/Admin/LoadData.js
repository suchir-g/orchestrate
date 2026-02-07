import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { loadDummyData } from '../../scripts/loadDummyData';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const LoadData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);

  const handleLoadData = async () => {
    if (!user) {
      toast.error('Please sign in to load dummy data');
      setStatus({ type: 'error', message: 'You must be signed in to load dummy data' });
      return;
    }

    setLoading(true);
    setStatus(null);
    setLogs([]);

    // Override console.log to capture logs
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
      originalLog(...args);
      setLogs(prev => [...prev, { type: 'info', message: args.join(' ') }]);
    };

    console.error = (...args) => {
      originalError(...args);
      setLogs(prev => [...prev, { type: 'error', message: args.join(' ') }]);
    };

    try {
      await loadDummyData(user.uid);
      setStatus({ type: 'success', message: 'Dummy data loaded successfully! All data is scoped to your account.' });
      toast.success('Dummy data loaded successfully!');
    } catch (error) {
      setStatus({ type: 'error', message: `Error: ${error.message}` });
      toast.error(`Failed to load dummy data: ${error.message}`);
    } finally {
      setLoading(false);
      // Restore original console methods
      console.log = originalLog;
      console.error = originalError;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          🔧 Load Dummy Data
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Populate your account with sample events, orders, and tickets (user-scoped)
        </Typography>
        {user && (
          <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
            Signed in as: {user.email}
          </Typography>
        )}
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            What will be loaded:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <InfoIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="5 Sample Events"
                secondary="Tech conferences, music festivals, workshops, etc."
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <InfoIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="4 Sample Orders"
                secondary="Various order statuses: Pending, Shipped, Delivered"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <InfoIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="3 Sample Blockchain Tickets"
                secondary="NFT tickets for different events"
              />
            </ListItem>
          </List>

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
              onClick={handleLoadData}
              disabled={loading || !user}
              fullWidth
            >
              {loading ? 'Loading Data...' : !user ? 'Sign In Required' : 'Load Dummy Data'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {status && (
        <Alert severity={status.type} sx={{ mb: 3 }}>
          {status.message}
        </Alert>
      )}

      {logs.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 Log Output
            </Typography>
            <Box
              sx={{
                bgcolor: 'background.default',
                p: 2,
                borderRadius: 1,
                maxHeight: 400,
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.875rem'
              }}
            >
              {logs.map((log, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    mb: 1,
                    color: log.type === 'error' ? 'error.main' : 'text.primary'
                  }}
                >
                  {log.type === 'error' ? (
                    <ErrorIcon sx={{ fontSize: 16, mr: 1, mt: 0.2 }} />
                  ) : (
                    <SuccessIcon sx={{ fontSize: 16, mr: 1, mt: 0.2, color: 'success.main' }} />
                  )}
                  <Typography variant="body2" component="pre" sx={{ margin: 0 }}>
                    {log.message}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {!user ? (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <strong>Authentication Required:</strong> Please sign in to load dummy data.
          All data will be scoped to your account and only visible to you.
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mt: 3 }}>
          <strong>Note:</strong> Dummy data will be scoped to your account ({user.email}).
          All events, orders, and tickets will only be visible to you.
        </Alert>
      )}
    </Container>
  );
};

export default LoadData;
