/**
 * Custom Hook for Dashboard Data
 * Orchestrates data fetching, metrics calculation, and state management for dashboard
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppState } from '../context/AppStateContext';
import { useBlockchain } from '../context/BlockchainContext';
import { getDashboardAnalytics } from '../services/apiService';
import { getRecentActivities } from '../services/activityService';
import {
  calculateQuickStats,
  getHistoricalSnapshot,
  saveHistoricalSnapshot,
  generateDynamicAlerts,
} from '../utils/analyticsHelpers';
import {
  Event as EventIcon,
  ShoppingCart as OrderIcon,
  LocalShipping as ShippingIcon,
  Token as TokenIcon,
} from '@mui/icons-material';

/**
 * Hook for fetching and managing dashboard data
 * @returns {Object} Dashboard data, loading states, errors, and refresh function
 */
const useDashboardData = () => {
  const { user } = useAuth();
  const { events, orders, tickets } = useAppState();
  const blockchain = useBlockchain();

  // Data state
  const [recentActivities, setRecentActivities] = useState([]);
  const [quickStats, setQuickStats] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [apiMetrics, setApiMetrics] = useState(null);

  // Loading states
  const [loading, setLoading] = useState({
    activities: true,
    metrics: true,
    alerts: true,
    overall: true,
  });

  // Error states
  const [error, setError] = useState({
    activities: null,
    metrics: null,
    alerts: null,
  });

  /**
   * Fetch activities from localStorage
   */
  const fetchActivities = useCallback(() => {
    if (!user) {
      setRecentActivities([]);
      setLoading((prev) => ({ ...prev, activities: false }));
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, activities: true }));
      setError((prev) => ({ ...prev, activities: null }));

      const activities = getRecentActivities(user.uid, 10);

      // Map activities to include icon components
      const activitiesWithIcons = activities.map((activity) => ({
        ...activity,
        icon: getIconForType(activity.type),
        color: getColorForType(activity.type),
      }));

      setRecentActivities(activitiesWithIcons);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError((prev) => ({ ...prev, activities: 'Failed to load activities' }));
      setRecentActivities([]);
    } finally {
      setLoading((prev) => ({ ...prev, activities: false }));
    }
  }, [user]);

  /**
   * Fetch metrics from API
   */
  const fetchMetrics = useCallback(async () => {
    if (!user) {
      setQuickStats([]);
      setLoading((prev) => ({ ...prev, metrics: false }));
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, metrics: true }));
      setError((prev) => ({ ...prev, metrics: null }));

      // Fetch from backend API
      const { data: apiData, error: apiError } = await getDashboardAnalytics('30d');

      if (apiError) {
        // If API fails, calculate from local data
        console.warn('API fetch failed, using local data:', apiError);
        calculateLocalMetrics();
      } else {
        // Use API data
        setApiMetrics(apiData);

        // Get historical snapshot for comparison
        const historicalSnapshot = getHistoricalSnapshot(user.uid, 7);

        // Calculate quick stats with percentage changes
        const currentData = {
          events,
          orders,
          tickets,
        };

        const stats = calculateQuickStats(currentData, historicalSnapshot);

        // Add icons to stats
        const statsWithIcons = stats.map((stat) => ({
          ...stat,
          icon: getIconForStatTitle(stat.title),
          color: getColorForStatTitle(stat.title),
        }));

        setQuickStats(statsWithIcons);

        // Save current snapshot for future comparison
        saveHistoricalSnapshot(user.uid, {
          totalEvents: events.length,
          totalOrders: orders.filter((o) =>
            ['Pending', 'Confirmed', 'Processing'].includes(o.status)
          ).length,
          totalTickets: tickets.length,
          shippedOrders: orders.filter((o) => o.status === 'Shipped').length,
        });
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError((prev) => ({ ...prev, metrics: 'Failed to load metrics' }));
      // Fallback to local calculation
      calculateLocalMetrics();
    } finally {
      setLoading((prev) => ({ ...prev, metrics: false }));
    }
  }, [user, events, orders, tickets]);

  /**
   * Calculate metrics from local data (fallback)
   */
  const calculateLocalMetrics = useCallback(() => {
    if (!user) return;

    try {
      const historicalSnapshot = getHistoricalSnapshot(user.uid, 7);

      const currentData = {
        events,
        orders,
        tickets,
      };

      const stats = calculateQuickStats(currentData, historicalSnapshot);

      const statsWithIcons = stats.map((stat) => ({
        ...stat,
        icon: getIconForStatTitle(stat.title),
        color: getColorForStatTitle(stat.title),
      }));

      setQuickStats(statsWithIcons);

      // Save snapshot
      saveHistoricalSnapshot(user.uid, {
        totalEvents: events.length,
        totalOrders: orders.filter((o) =>
          ['Pending', 'Confirmed', 'Processing'].includes(o.status)
        ).length,
        totalTickets: tickets.length,
        shippedOrders: orders.filter((o) => o.status === 'Shipped').length,
      });
    } catch (err) {
      console.error('Error calculating local metrics:', err);
    }
  }, [user, events, orders, tickets]);

  /**
   * Generate alerts
   */
  const fetchAlerts = useCallback(() => {
    try {
      setLoading((prev) => ({ ...prev, alerts: true }));
      setError((prev) => ({ ...prev, alerts: null }));

      const metrics = {
        totalEvents: events.length,
        totalOrders: orders.length,
        activeOrders: orders.filter((o) =>
          ['Pending', 'Confirmed', 'Processing'].includes(o.status)
        ).length,
        shippedOrders: orders.filter((o) => o.status === 'Shipped').length,
        delayedShipments: apiMetrics?.delayedShipments || 0,
        lowInventoryEvents: apiMetrics?.lowInventoryEvents || 0,
      };

      const predictions = apiMetrics?.predictions || null;

      const generatedAlerts = generateDynamicAlerts(metrics, blockchain, predictions);

      setAlerts(generatedAlerts);
    } catch (err) {
      console.error('Error generating alerts:', err);
      setError((prev) => ({ ...prev, alerts: 'Failed to generate alerts' }));
      setAlerts([]);
    } finally {
      setLoading((prev) => ({ ...prev, alerts: false }));
    }
  }, [events, orders, blockchain, apiMetrics]);

  /**
   * Refresh all dashboard data
   */
  const refreshData = useCallback(() => {
    console.log('🔄 Refreshing dashboard data...');
    fetchActivities();
    fetchMetrics();
  }, [fetchActivities, fetchMetrics]);

  // Fetch activities on mount and when user changes
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Fetch metrics on mount and when data changes
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Generate alerts when metrics or blockchain status changes
  useEffect(() => {
    if (!loading.metrics) {
      fetchAlerts();
    }
  }, [loading.metrics, fetchAlerts]);

  // Update overall loading state
  useEffect(() => {
    const isLoading = loading.activities || loading.metrics || loading.alerts;
    setLoading((prev) => ({ ...prev, overall: isLoading }));
  }, [loading.activities, loading.metrics, loading.alerts]);

  return {
    // Data
    recentActivities,
    quickStats,
    alerts,

    // States
    loading,
    error,

    // Actions
    refreshData,
  };
};

/**
 * Helper: Get icon component for activity type
 */
const getIconForType = (type) => {
  const iconMap = {
    order: <OrderIcon />,
    ticket: <TokenIcon />,
    event: <EventIcon />,
    shipment: <ShippingIcon />,
  };
  return iconMap[type] || <EventIcon />;
};

/**
 * Helper: Get color for activity type
 */
const getColorForType = (type) => {
  const colorMap = {
    order: 'primary',
    ticket: 'secondary',
    event: 'info',
    shipment: 'success',
  };
  return colorMap[type] || 'default';
};

/**
 * Helper: Get icon component for stat title
 */
const getIconForStatTitle = (title) => {
  const iconMap = {
    'Total Events': <EventIcon />,
    'Active Orders': <OrderIcon />,
    'Blockchain Tickets': <TokenIcon />,
    'In Transit': <ShippingIcon />,
  };
  return iconMap[title] || <EventIcon />;
};

/**
 * Helper: Get color for stat title
 */
const getColorForStatTitle = (title) => {
  const colorMap = {
    'Total Events': 'primary',
    'Active Orders': 'success',
    'Blockchain Tickets': 'secondary',
    'In Transit': 'warning',
  };
  return colorMap[title] || 'primary';
};

export default useDashboardData;
