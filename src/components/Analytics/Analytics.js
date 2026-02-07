import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  Tab,
  Tabs,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp as TrendingIcon,
  Event as EventIcon,
  ShoppingCart as OrderIcon,
  LocalShipping as ShippingIcon,
  Token as TokenIcon,
  Cloud as WeatherIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  TrendingUp as TrendUpIcon,
  TrendingDown as TrendDownIcon,
} from '@mui/icons-material';
import { useAppState } from '../../context/AppStateContext';

const Analytics = () => {
  const { events, orders, tickets } = useAppState();
  const [tabValue, setTabValue] = useState(0);
  const [predictions, setPredictions] = useState({
    onTimePercentage: 0,
    weather: 'clear',
    warning: null,
    supplierStats: []
  });

  // Calculate predictions and supplier stats
  useEffect(() => {
    calculatePredictions();
  }, [orders]);

  const calculatePredictions = () => {
    // Calculate overall on-time percentage
    const totalOrders = orders.length || 10;
    const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;
    const shippedOrders = orders.filter(o => o.status === 'Shipped').length;
    const lateOrders = orders.filter(o => o.status === 'Delayed' || o.status === 'delayed').length;
    const onTimeOrders = deliveredOrders + shippedOrders - lateOrders;
    const onTimePercentage = Math.round((onTimeOrders / totalOrders) * 100);

    // Calculate supplier-specific statistics
    const supplierMap = {};
    orders.forEach(order => {
      const supplier = order.supplier || 'Unknown';
      if (!supplierMap[supplier]) {
        supplierMap[supplier] = {
          name: supplier,
          total: 0,
          delivered: 0,
          late: 0,
          onTime: 0,
          avgDeliveryDays: []
        };
      }

      supplierMap[supplier].total += 1;

      if (order.status === 'Delivered') {
        supplierMap[supplier].delivered += 1;

        // Calculate delivery time if we have both dates
        if (order.actualDelivery && order.estimatedDelivery) {
          const actual = new Date(order.actualDelivery);
          const estimated = new Date(order.estimatedDelivery);
          const diffDays = Math.round((actual - estimated) / (1000 * 60 * 60 * 24));
          supplierMap[supplier].avgDeliveryDays.push(diffDays);

          if (diffDays > 0) {
            supplierMap[supplier].late += 1;
          } else {
            supplierMap[supplier].onTime += 1;
          }
        }
      } else if (order.status === 'Delayed' || order.status === 'delayed') {
        supplierMap[supplier].late += 1;
      }
    });

    // Convert to array and calculate percentages
    const supplierStats = Object.values(supplierMap).map(supplier => {
      const onTimeRate = supplier.delivered > 0
        ? Math.round((supplier.onTime / supplier.delivered) * 100)
        : 0;
      const avgDelay = supplier.avgDeliveryDays.length > 0
        ? Math.round(supplier.avgDeliveryDays.reduce((a, b) => a + b, 0) / supplier.avgDeliveryDays.length)
        : 0;

      return {
        ...supplier,
        onTimeRate,
        avgDelay,
        reliability: onTimeRate >= 90 ? 'excellent' : onTimeRate >= 75 ? 'good' : onTimeRate >= 50 ? 'fair' : 'poor'
      };
    }).sort((a, b) => b.onTimeRate - a.onTimeRate);

    // Random weather simulation (in real app, would call weather API)
    const weatherConditions = ['clear', 'rainy', 'stormy'];
    const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];

    let warning = null;
    if (randomWeather === 'rainy') {
      warning = "It's rainy - deliveries may be delayed";
    } else if (randomWeather === 'stormy') {
      warning = "Storm warning - expect significant delays";
    }

    setPredictions({
      onTimePercentage,
      weather: randomWeather,
      warning,
      supplierStats
    });
  };

  // Generate mock analytics data
  const generateAnalyticsData = () => {
    // Monthly data for the last 6 months
    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map((month, index) => ({
      month,
      events: Math.floor(Math.random() * 20) + 5,
      orders: Math.floor(Math.random() * 100) + 30,
      revenue: Math.floor(Math.random() * 50000) + 20000,
      tickets: Math.floor(Math.random() * 500) + 100,
    }));

    // Status distribution
    const orderStatusData = [
      { name: 'Delivered', value: 45, color: '#4caf50' },
      { name: 'Shipped', value: 25, color: '#ff9800' },
      { name: 'Processing', value: 20, color: '#2196f3' },
      { name: 'Pending', value: 10, color: '#9e9e9e' },
    ];

    const eventStatusData = [
      { name: 'Completed', value: 40, color: '#4caf50' },
      { name: 'In Progress', value: 30, color: '#ff9800' },
      { name: 'Confirmed', value: 20, color: '#2196f3' },
      { name: 'Planning', value: 10, color: '#9e9e9e' },
    ];

    // Daily activity data
    const dailyActivity = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        orders: Math.floor(Math.random() * 30) + 10,
        events: Math.floor(Math.random() * 8) + 2,
        tickets: Math.floor(Math.random() * 50) + 20,
      };
    });

    return {
      monthlyData,
      orderStatusData,
      eventStatusData,
      dailyActivity,
    };
  };

  const analyticsData = generateAnalyticsData();

  const MetricCard = ({ title, value, subtitle, icon, color = 'primary' }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ color: `${color}.main` }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
          <Box sx={{ color: `${color}.main`, opacity: 0.7 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          📊 Analytics Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Comprehensive insights into your events, orders, and blockchain tickets
        </Typography>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Events"
            value={events.length}
            subtitle="+2 this month"
            icon={<EventIcon sx={{ fontSize: 40 }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Orders"
            value={orders.length}
            subtitle="+5 this week"
            icon={<OrderIcon sx={{ fontSize: 40 }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Blockchain Tickets"
            value={tickets.length}
            subtitle="All verified"
            icon={<TokenIcon sx={{ fontSize: 40 }} />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Revenue"
            value="$45.2K"
            subtitle="+12% this month"
            icon={<TrendingIcon sx={{ fontSize: 40 }} />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Overview" />
          <Tab label="Orders" />
          <Tab label="Events" />
          <Tab label="Revenue" />
          <Tab label="Predictions & Insights" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📈 Daily Activity
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.dailyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="orders"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                    />
                    <Area
                      type="monotone"
                      dataKey="events"
                      stackId="1"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                    />
                    <Area
                      type="monotone"
                      dataKey="tickets"
                      stackId="1"
                      stroke="#ffc658"
                      fill="#ffc658"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🎯 Order Status Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analyticsData.orderStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {analyticsData.orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📦 Order Trends (6 Months)
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analyticsData.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="#8884d8"
                      strokeWidth={3}
                      dot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🎪 Event Creation Trends
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="events" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📊 Event Status Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analyticsData.eventStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {analyticsData.eventStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  💰 Revenue Analysis
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={analyticsData.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 4 && (
        <Grid container spacing={3}>
          {/* Overall Prediction Card */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Expected On-Time Delivery Rate
                  </Typography>
                  <Typography variant="h1" sx={{ fontWeight: 'bold', mb: 2, fontSize: '4rem' }}>
                    {predictions.onTimePercentage}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Based on {orders.length} orders
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Weather Impact Card */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <WeatherIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h5" gutterBottom sx={{ textTransform: 'capitalize' }}>
                    {predictions.weather}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Current Weather Condition
                  </Typography>
                  {predictions.warning && (
                    <Chip
                      icon={<WarningIcon />}
                      label="May Affect Deliveries"
                      color="warning"
                      sx={{ mt: 2 }}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Weather Alert */}
          {predictions.warning && (
            <Grid item xs={12}>
              <Alert
                severity="warning"
                icon={<WarningIcon />}
                sx={{ fontSize: '1rem' }}
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
                sx={{ fontSize: '1rem' }}
              >
                <Typography variant="h6">Clear weather - deliveries on track</Typography>
              </Alert>
            </Grid>
          )}

          {/* Data Sources Explanation */}
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'rgba(0, 212, 255, 0.05)', border: '1px solid rgba(0, 212, 255, 0.2)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <InfoIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">
                    📊 How These Predictions Are Calculated
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      On-Time Rate
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Calculated from historical delivery data: (Delivered + Shipped - Late) / Total Orders
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Weather Impact
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Simulated weather conditions (in production: real-time weather API integration)
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Supplier Analysis
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Individual supplier performance based on actual vs. estimated delivery dates
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Supplier Performance Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🚚 Supplier Performance Breakdown
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Different suppliers have different delivery patterns. Use this data to make informed decisions.
                </Typography>

                {predictions.supplierStats.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Supplier</strong></TableCell>
                          <TableCell align="center"><strong>Total Orders</strong></TableCell>
                          <TableCell align="center"><strong>On-Time Rate</strong></TableCell>
                          <TableCell align="center"><strong>Avg Delay (days)</strong></TableCell>
                          <TableCell align="center"><strong>Reliability</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {predictions.supplierStats.map((supplier, index) => (
                          <TableRow key={index} hover>
                            <TableCell>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {supplier.name}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              {supplier.total}
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  {supplier.onTimeRate}%
                                </Typography>
                                {supplier.onTimeRate >= 75 ? (
                                  <TrendUpIcon sx={{ color: 'success.main', fontSize: 20 }} />
                                ) : (
                                  <TrendDownIcon sx={{ color: 'error.main', fontSize: 20 }} />
                                )}
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={supplier.onTimeRate}
                                sx={{
                                  mt: 1,
                                  height: 6,
                                  borderRadius: 3,
                                  bgcolor: 'rgba(255,255,255,0.1)',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: supplier.onTimeRate >= 90 ? 'success.main' :
                                            supplier.onTimeRate >= 75 ? 'warning.main' : 'error.main'
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Typography
                                variant="body2"
                                sx={{
                                  color: supplier.avgDelay > 0 ? 'error.main' :
                                         supplier.avgDelay < 0 ? 'success.main' : 'text.secondary',
                                  fontWeight: 600
                                }}
                              >
                                {supplier.avgDelay > 0 ? `+${supplier.avgDelay}` : supplier.avgDelay}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={supplier.reliability}
                                size="small"
                                sx={{
                                  textTransform: 'capitalize',
                                  fontWeight: 600,
                                  bgcolor: supplier.reliability === 'excellent' ? 'rgba(76, 175, 80, 0.15)' :
                                          supplier.reliability === 'good' ? 'rgba(255, 152, 0, 0.15)' :
                                          supplier.reliability === 'fair' ? 'rgba(255, 193, 7, 0.15)' :
                                          'rgba(244, 67, 54, 0.15)',
                                  color: supplier.reliability === 'excellent' ? '#4caf50' :
                                         supplier.reliability === 'good' ? '#ff9800' :
                                         supplier.reliability === 'fair' ? '#ffc107' :
                                         '#f44336',
                                  border: supplier.reliability === 'excellent' ? '1px solid rgba(76, 175, 80, 0.3)' :
                                          supplier.reliability === 'good' ? '1px solid rgba(255, 152, 0, 0.3)' :
                                          supplier.reliability === 'fair' ? '1px solid rgba(255, 193, 7, 0.3)' :
                                          '1px solid rgba(244, 67, 54, 0.3)'
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">
                    No supplier data available yet. Create orders with supplier information to see performance analytics.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Key Insights Summary */}
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  💡 Key Insights
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 2 }}>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        • Overall {predictions.onTimePercentage}% on-time delivery rate
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {predictions.onTimePercentage >= 90 ? 'Excellent performance across the board' :
                         predictions.onTimePercentage >= 75 ? 'Good performance with room for improvement' :
                         'Consider reviewing supplier relationships'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 2 }}>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        • Weather: {predictions.weather}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {predictions.warning ?
                          'Weather may impact delivery schedules' :
                          'Weather conditions are favorable for deliveries'}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 2 }}>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        • {predictions.supplierStats.length} active suppliers tracked
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {predictions.supplierStats.length > 0 ?
                          `Best performer: ${predictions.supplierStats[0]?.name || 'N/A'}` :
                          'No supplier data available yet'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default Analytics;