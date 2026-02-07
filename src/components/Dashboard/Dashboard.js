import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
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
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Event as EventIcon,
  ShoppingCart as OrderIcon,
  Token as TokenIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Notifications as NotificationIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material';
import { useBlockchain } from '../../context/BlockchainContext';
import useDashboardData from '../../hooks/useDashboardData';
import { getTimeDifference } from '../../utils/helpers';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isConnected, account } = useBlockchain();

  // Get dynamic dashboard data from custom hook
  const {
    recentActivities,
    quickStats,
    alerts,
    loading,
    error,
    refreshData,
  } = useDashboardData();

  // Show toast notification on metrics error
  useEffect(() => {
    if (error.metrics) {
      toast.error('Failed to load dashboard metrics. Using local data.');
    }
  }, [error.metrics]);

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
        {loading.metrics ? (
          // Show skeleton loading for quick stats
          [1, 2, 3, 4].map((index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" height={40} sx={{ my: 1 }} />
                  <Skeleton variant="text" width="30%" />
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : error.metrics ? (
          // Show error state
          <Grid item xs={12}>
            <Alert severity="warning">
              Unable to load metrics. Please try refreshing the page.
            </Alert>
          </Grid>
        ) : (
          // Show actual stats
          quickStats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <StatCard stat={stat} />
            </Grid>
          ))
        )}
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
              {loading.activities ? (
                // Show skeleton loading for activities
                <List>
                  {[1, 2, 3, 4].map((index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          <Skeleton variant="circular" width={40} height={40} />
                        </ListItemIcon>
                        <ListItemText
                          primary={<Skeleton variant="text" width="60%" />}
                          secondary={
                            <>
                              <Skeleton variant="text" width="80%" />
                              <Skeleton variant="text" width="30%" />
                            </>
                          }
                        />
                      </ListItem>
                      {index < 3 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              ) : error.activities ? (
                // Show error state
                <Alert severity="warning" sx={{ m: 2 }}>
                  {error.activities}
                </Alert>
              ) : recentActivities.length === 0 ? (
                // Show empty state
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No recent activities to display
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    Activities will appear here as you create events, orders, and tickets
                  </Typography>
                </Box>
              ) : (
                // Show actual activities
                <List>
                  {recentActivities.map((activity, index) => (
                    <React.Fragment key={activity.id || index}>
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
                                {getTimeDifference(activity.timestamp)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < recentActivities.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              )}
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
              {loading.alerts ? (
                // Show skeleton loading for alerts
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[1, 2, 3].map((index) => (
                    <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                      <Skeleton variant="text" width="40%" />
                      <Skeleton variant="text" width="90%" />
                      <Skeleton variant="rectangular" width={100} height={30} sx={{ mt: 1 }} />
                    </Paper>
                  ))}
                </Box>
              ) : alerts.length === 0 ? (
                // Show empty state
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography color="text.secondary" variant="body2">
                    No alerts at this time
                  </Typography>
                </Box>
              ) : (
                // Show actual alerts
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
              )}
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