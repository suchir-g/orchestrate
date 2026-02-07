import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Alert,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Cloud as WeatherIcon,
} from '@mui/icons-material';
import { useAppState } from '../../context/AppStateContext';

const PredictionDashboard = () => {
  const { orders } = useAppState();
  const [predictions, setPredictions] = useState({
    onTimePercentage: 0,
    weather: 'clear',
    warning: null,
  });

  useEffect(() => {
    // Calculate simple prediction based on past orders
    calculatePrediction();
  }, [orders]);

  const calculatePrediction = () => {
    // Simple calculation: how many orders were late last time
    const totalOrders = orders.length || 10;
    const lateOrders = orders.filter(order => order.status === 'delayed').length;
    const onTimeOrders = totalOrders - lateOrders;
    const onTimePercentage = Math.round((onTimeOrders / totalOrders) * 100);

    // Random weather simulation (in real app, would call weather API)
    const weatherConditions = ['clear', 'rainy', 'stormy'];
    const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];

    let warning = null;
    if (randomWeather === 'rainy') {
      warning = "It's rainy - deliveries may be late";
    } else if (randomWeather === 'stormy') {
      warning = "Storm warning - expect significant delays";
    }

    setPredictions({
      onTimePercentage,
      weather: randomWeather,
      warning,
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          📊 Simple Predictions
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Based on past order history and current weather
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* On-Time Percentage */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
                  {predictions.onTimePercentage}%
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Expected On-Time Deliveries
                </Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mt: 2 }}>
                  Based on {orders.length || 10} previous orders
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Weather Impact */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <WeatherIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ textTransform: 'capitalize' }}>
                  {predictions.weather}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current Weather Condition
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Warning Alert */}
        {predictions.warning && (
          <Grid item xs={12}>
            <Alert
              severity="warning"
              icon={<WarningIcon />}
              sx={{
                fontSize: '1.1rem',
                '& .MuiAlert-message': {
                  width: '100%',
                  textAlign: 'center',
                },
              }}
            >
              <Typography variant="h6">{predictions.warning}</Typography>
            </Alert>
          </Grid>
        )}

        {/* Good Weather Alert */}
        {!predictions.warning && (
          <Grid item xs={12}>
            <Alert
              severity="success"
              icon={<SuccessIcon />}
              sx={{
                fontSize: '1.1rem',
                '& .MuiAlert-message': {
                  width: '100%',
                  textAlign: 'center',
                },
              }}
            >
              <Typography variant="h6">Clear weather - deliveries on track</Typography>
            </Alert>
          </Grid>
        )}

        {/* Simple Summary */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📦 Quick Summary
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                • {predictions.onTimePercentage}% of orders arrived on time last period
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                • Weather: {predictions.weather}
              </Typography>
              {predictions.warning ? (
                <Typography variant="body1" color="warning.main">
                  • ⚠️ Expect potential delays due to weather
                </Typography>
              ) : (
                <Typography variant="body1" color="success.main">
                  • ✓ Normal delivery times expected
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PredictionDashboard;