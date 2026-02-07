import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Paper,
  Tab,
  Tabs,
  Chip,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend,
  ScatterChart,
  Scatter,
} from 'recharts';
import {
  PsychologyOutlined as AIIcon,
  TrendingUp as TrendIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Schedule as TimeIcon,
  LocalShipping as DeliveryIcon,
  Event as EventIcon,
  ShoppingCart as DemandIcon,
} from '@mui/icons-material';
import { useAppState } from '../../context/AppStateContext';

const PredictionDashboard = () => {
  const { orders, events, tickets } = useAppState();
  const [tabValue, setTabValue] = useState(0);
  const [predictionAccuracy] = useState(87); // Mock accuracy percentage

  // Generate mock prediction data
  const generatePredictions = () => {
    // Delivery time predictions
    const deliveryPredictions = [
      {
        orderId: 'ORD-001',
        predictedDelivery: '2024-02-10',
        confidence: 92,
        factors: ['Weather: Clear', 'Traffic: Low', 'Distance: Short'],
        risk: 'Low',
      },
      {
        orderId: 'ORD-002',
        predictedDelivery: '2024-02-12',
        confidence: 78,
        factors: ['Weather: Rainy', 'Traffic: High', 'Distance: Medium'],
        risk: 'Medium',
      },
      {
        orderId: 'ORD-003',
        predictedDelivery: '2024-02-15',
        confidence: 65,
        factors: ['Weather: Storm', 'Traffic: Very High', 'Distance: Long'],
        risk: 'High',
      },
    ];

    // Demand forecasting data
    const demandForecast = Array.from({ length: 30 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index);
      return {
        date: date.toISOString().split('T')[0],
        predicted: Math.floor(Math.random() * 50) + 20 + Math.sin(index / 7) * 10,
        confidence: Math.floor(Math.random() * 20) + 70,
        historical: index < 15 ? Math.floor(Math.random() * 45) + 18 : null,
      };
    });

    // Event success predictions
    const eventPredictions = [
      {
        eventName: 'Tech Conference 2024',
        successProbability: 95,
        expectedAttendance: 1250,
        revenueProjection: 85000,
        riskFactors: ['Low competition', 'High interest'],
      },
      {
        eventName: 'Music Festival Summer',
        successProbability: 82,
        expectedAttendance: 5000,
        revenueProjection: 125000,
        riskFactors: ['Weather dependent', 'Seasonal demand'],
      },
      {
        eventName: 'Workshop Series',
        successProbability: 78,
        expectedAttendance: 200,
        revenueProjection: 15000,
        riskFactors: ['Niche market', 'Competition'],
      },
    ];

    // Supply chain optimization
    const supplyChainInsights = [
      {
        route: 'NYC → LA',
        currentTime: '5 days',
        optimizedTime: '3.5 days',
        savings: '$1,200',
        improvement: 30,
      },
      {
        route: 'Chicago → Miami',
        currentTime: '4 days',
        optimizedTime: '3 days',
        savings: '$800',
        improvement: 25,
      },
    ];

    return {
      deliveryPredictions,
      demandForecast,
      eventPredictions,
      supplyChainInsights,
    };
  };

  const predictions = generatePredictions();

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low': return 'success';
      case 'Medium': return 'warning';
      case 'High': return 'error';
      default: return 'default';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'success';
    if (confidence >= 60) return 'warning';
    return 'error';
  };

  const PredictionCard = ({ title, children, icon, color = 'primary' }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ color: `${color}.main`, mr: 1 }}>
            {icon}
          </Box>
          <Typography variant="h6">{title}</Typography>
        </Box>
        {children}
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          🔮 AI Predictions & Forecasting
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Machine learning-powered predictions for delivery, demand, and business optimization
        </Typography>
      </Box>

      {/* AI Model Performance */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>🤖 AI Model Performance</AlertTitle>
        Current prediction accuracy: <strong>{predictionAccuracy}%</strong> • Last updated: 2 hours ago
        <LinearProgress 
          variant="determinate" 
          value={predictionAccuracy} 
          sx={{ mt: 1, height: 6, borderRadius: 3 }}
        />
      </Alert>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Delivery Predictions" />
          <Tab label="Demand Forecasting" />
          <Tab label="Event Success" />
          <Tab label="Supply Chain" />
        </Tabs>
      </Paper>

      {/* Delivery Predictions Tab */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <PredictionCard
              title="🚚 Delivery Time Predictions"
              icon={<DeliveryIcon />}
              color="primary"
            >
              <List>
                {predictions.deliveryPredictions.map((pred, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle1">{pred.orderId}</Typography>
                            <Box>
                              <Chip
                                label={`${pred.confidence}% confident`}
                                color={getConfidenceColor(pred.confidence)}
                                size="small"
                                sx={{ mr: 1 }}
                              />
                              <Chip
                                label={`${pred.risk} Risk`}
                                color={getRiskColor(pred.risk)}
                                size="small"
                              />
                            </Box>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              📅 Expected delivery: <strong>{new Date(pred.predictedDelivery).toLocaleDateString()}</strong>
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                              Factors: {pred.factors.join(' • ')}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < predictions.deliveryPredictions.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </PredictionCard>
          </Grid>
        </Grid>
      )}

      {/* Demand Forecasting Tab */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <PredictionCard
              title="📈 30-Day Demand Forecast"
              icon={<DemandIcon />}
              color="success"
            >
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={predictions.demandForecast.slice(0, 30)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value, name) => [
                      name === 'predicted' ? `${value} orders (predicted)` : `${value} orders (actual)`,
                      name === 'predicted' ? 'Prediction' : 'Historical'
                    ]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="historical" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Historical Data"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#82ca9d" 
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    name="AI Prediction"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </PredictionCard>
          </Grid>
        </Grid>
      )}

      {/* Event Success Predictions Tab */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          {predictions.eventPredictions.map((event, index) => (
            <Grid item xs={12} md={4} key={index}>
              <PredictionCard
                title={event.eventName}
                icon={<EventIcon />}
                color="secondary"
              >
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h3" color="secondary.main" gutterBottom>
                    {event.successProbability}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Success Probability
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    👥 Expected Attendance: <strong>{event.expectedAttendance.toLocaleString()}</strong>
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    💰 Revenue Projection: <strong>${event.revenueProjection.toLocaleString()}</strong>
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary">
                  Risk Factors:
                </Typography>
                <List dense>
                  {event.riskFactors.map((factor, i) => (
                    <ListItem key={i} sx={{ py: 0 }}>
                      <ListItemIcon sx={{ minWidth: 20 }}>
                        <WarningIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                      </ListItemIcon>
                      <ListItemText primary={factor} />
                    </ListItem>
                  ))}
                </List>
              </PredictionCard>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Supply Chain Optimization Tab */}
      {tabValue === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <PredictionCard
              title="⚡ Supply Chain Optimization Recommendations"
              icon={<TrendIcon />}
              color="warning"
            >
              <List>
                {predictions.supplyChainInsights.map((insight, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">{insight.route}</Typography>
                            <Chip
                              label={`${insight.improvement}% faster`}
                              color="success"
                              icon={<TrendIcon />}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2">
                              Current delivery time: <strong>{insight.currentTime}</strong> → 
                              Optimized: <strong>{insight.optimizedTime}</strong>
                            </Typography>
                            <Typography variant="body2" color="success.main">
                              💰 Potential savings: <strong>{insight.savings}</strong> per shipment
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < predictions.supplyChainInsights.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
              
              <Alert severity="success" sx={{ mt: 2 }}>
                <AlertTitle>🎯 Recommended Action</AlertTitle>
                Implement route optimization for NYC → LA route first. Expected ROI: 300% within 6 months.
              </Alert>
            </PredictionCard>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default PredictionDashboard;