import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Event as EventIcon,
  ShoppingCart as OrderIcon,
  LocalShipping as ShippingIcon,
  Token as TokenIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Schedule as ClockIcon,
  Notifications as NotificationIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material';
import { useAppState } from '../../context/AppStateContext';
import { useBlockchain } from '../../context/BlockchainContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { events, orders, tickets } = useAppState();
  const { isConnected, account } = useBlockchain();

  // Mock recent activities
  const recentActivities = [
    {
      type: 'order',
      title: 'New order received',
      description: 'Order #ORD-789123 from John Doe',
      timestamp: '5 minutes ago',
      icon: <OrderIcon />,
      color: 'primary',
    },
    {
      type: 'ticket',
      title: 'Blockchain ticket minted',
      description: 'Tech Conference 2024 ticket created',
      timestamp: '15 minutes ago',
      icon: <TokenIcon />,
      color: 'secondary',
    },
    {
      type: 'shipment',
      title: 'Shipment delivered',
      description: 'Package delivered to customer in NYC',
      timestamp: '1 hour ago',
      icon: <CheckIcon />,
      color: 'success',
    },
    {
      type: 'event',
      title: 'Event status updated',
      description: 'Summer Festival moved to confirmed',
      timestamp: '2 hours ago',
      icon: <EventIcon />,
      color: 'info',
    },
  ];

  const quickStats = [
    {
      title: 'Total Events',
      value: events.length,
      change: '+12%',
      changeType: 'positive',
      icon: <EventIcon />,
      color: 'primary',
      path: '/events',
    },
    {
      title: 'Active Orders',
      value: orders.filter(o => ['Pending', 'Confirmed', 'Processing'].includes(o.status)).length,
      change: '+5%',
      changeType: 'positive',
      icon: <OrderIcon />,
      color: 'success',
      path: '/orders',
    },
    {
      title: 'Blockchain Tickets',
      value: tickets.length,
      change: '+8%',
      changeType: 'positive',
      icon: <TokenIcon />,
      color: 'secondary',
      path: '/tickets',
    },
    {
      title: 'In Transit',
      value: orders.filter(o => o.status === 'Shipped').length,
      change: '-2%',
      changeType: 'negative',
      icon: <ShippingIcon />,
      color: 'warning',
      path: '/shipments',
    },
  ];

  const alerts = [
    {
      type: 'warning',
      title: 'Delayed Shipments',
      message: '3 shipments are experiencing delays due to weather conditions',
      action: 'View Details',
      path: '/shipments',
    },
    {
      type: 'info',
      title: 'Blockchain Network',
      message: isConnected ? `Connected to ${account?.slice(0, 6)}...${account?.slice(-4)}` : 'Wallet not connected',
      action: isConnected ? null : 'Connect Wallet',
      path: null,
    },
    {
      type: 'success',
      title: 'AI Predictions',
      message: 'Delivery time predictions are 87% accurate this week',
      action: 'View Analytics',
      path: '/predictions',
    },
  ];

  const StatCard = ({ stat }) => (
    <Card 
      sx={{ 
        height: '100%',
        cursor: 'pointer',
        '&:hover': { 
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
        transition: 'all 0.3s ease-in-out'
      }}
      onClick={() => navigate(stat.path)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="subtitle2">
              {stat.title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ color: `${stat.color}.main`, mb: 1 }}>
              {stat.value}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendIcon 
                sx={{ 
                  fontSize: 16, 
                  mr: 0.5,
                  color: stat.changeType === 'positive' ? 'success.main' : 'error.main',
                  transform: stat.changeType === 'negative' ? 'rotate(180deg)' : 'none'
                }} 
              />
              <Typography 
                variant="body2" 
                sx={{ 
                  color: stat.changeType === 'positive' ? 'success.main' : 'error.main',
                  fontWeight: 'medium'
                }}
              >
                {stat.change}
              </Typography>
            </Box>
          </Box>
          <Avatar sx={{ bgcolor: `${stat.color}.main`, width: 56, height: 56 }}>
            {stat.icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          🎯 Welcome to Orchestrate
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Your comprehensive platform for event tracking, logistics management, and blockchain integration
        </Typography>
        {isConnected && (
          <Chip 
            label={`Connected: ${account?.slice(0, 6)}...${account?.slice(-4)}`}
            color="success"
            icon={<CheckIcon />}
            sx={{ mt: 1 }}
          />
        )}
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard stat={stat} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Activities */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2">
                  📋 Recent Activities
                </Typography>
                <Button 
                  variant="text" 
                  endIcon={<LaunchIcon />}
                  onClick={() => navigate('/analytics')}
                >
                  View All
                </Button>
              </Box>
              <List>
                {recentActivities.map((activity, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: `${activity.color}.main`, width: 40, height: 40 }}>
                          {activity.icon}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {activity.description}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                              {activity.timestamp}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Alerts & Notifications */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2">
                  🔔 Alerts & Updates
                </Typography>
                <IconButton size="small">
                  <NotificationIcon />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {alerts.map((alert, index) => (
                  <Paper 
                    key={index}
                    variant="outlined" 
                    sx={{ 
                      p: 2,
                      bgcolor: alert.type === 'warning' ? 'warning.light' : 
                              alert.type === 'success' ? 'success.light' : 'info.light',
                      color: alert.type === 'warning' ? 'warning.contrastText' : 
                             alert.type === 'success' ? 'success.contrastText' : 'info.contrastText',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      {alert.type === 'warning' && <WarningIcon sx={{ mr: 1, mt: 0.1 }} />}
                      {alert.type === 'success' && <CheckIcon sx={{ mr: 1, mt: 0.1 }} />}
                      {alert.type === 'info' && <NotificationIcon sx={{ mr: 1, mt: 0.1 }} />}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          {alert.title}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {alert.message}
                        </Typography>
                        {alert.action && (
                          <Button 
                            size="small" 
                            variant="contained"
                            onClick={() => alert.path && navigate(alert.path)}
                            sx={{ 
                              bgcolor: 'rgba(255,255,255,0.2)',
                              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                            }}
                          >
                            {alert.action}
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mt: 4, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Typography variant="h6" gutterBottom>
          ⚡ Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<EventIcon />}
              onClick={() => navigate('/events')}
              sx={{ bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
            >
              Create Event
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<OrderIcon />}
              onClick={() => navigate('/orders')}
              sx={{ bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
            >
              Track Orders
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<TokenIcon />}
              onClick={() => navigate('/tickets')}
              sx={{ bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
            >
              Mint Tickets
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<AnalyticsIcon />}
              onClick={() => navigate('/analytics')}
              sx={{ bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
            >
              View Analytics
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Dashboard;