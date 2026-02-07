/**
 * Analytics Helper Functions
 * Utilities for dashboard analytics, calculations, and data management
 */

/**
 * Calculate percentage change between two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {Object} { value: string, type: string }
 */
export const calculatePercentageChange = (current, previous) => {
  if (previous === 0) {
    if (current === 0) {
      return { value: '0%', type: 'neutral' };
    }
    return { value: '+100%', type: 'positive' };
  }

  const change = ((current - previous) / previous) * 100;
  const rounded = Math.round(change);

  if (rounded > 0) {
    return { value: `+${rounded}%`, type: 'positive' };
  } else if (rounded < 0) {
    return { value: `${rounded}%`, type: 'negative' };
  } else {
    return { value: '0%', type: 'neutral' };
  }
};

/**
 * Get historical snapshot from localStorage
 * @param {string} userId - User ID
 * @param {number} daysAgo - Number of days ago (default 7)
 * @returns {Object|null} Snapshot object or null
 */
export const getHistoricalSnapshot = (userId, daysAgo = 7) => {
  try {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysAgo);
    const dateKey = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD

    const snapshotKey = `dashboard_snapshot_${userId}_${dateKey}`;
    const snapshot = localStorage.getItem(snapshotKey);

    if (!snapshot) {
      return null;
    }

    return JSON.parse(snapshot);
  } catch (error) {
    console.error('Error retrieving historical snapshot:', error);
    return null;
  }
};

/**
 * Save current metrics snapshot to localStorage
 * @param {string} userId - User ID
 * @param {Object} metrics - Metrics to save
 */
export const saveHistoricalSnapshot = (userId, metrics) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const snapshotKey = `dashboard_snapshot_${userId}_${today}`;

    const snapshot = {
      date: today,
      totalEvents: metrics.totalEvents || 0,
      totalOrders: metrics.totalOrders || 0,
      totalTickets: metrics.totalTickets || 0,
      activeOrders: metrics.activeOrders || 0,
      shippedOrders: metrics.shippedOrders || 0,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(snapshotKey, JSON.stringify(snapshot));

    // Cleanup old snapshots after saving
    cleanupOldSnapshots(userId);
  } catch (error) {
    console.warn('Error saving historical snapshot:', error);
    // Don't throw - this is not critical functionality
  }
};

/**
 * Cleanup old snapshots from localStorage (keep last 30 days)
 * @param {string} userId - User ID
 * @param {number} daysToKeep - Number of days to keep (default 30)
 */
export const cleanupOldSnapshots = (userId, daysToKeep = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Get all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key && key.startsWith(`dashboard_snapshot_${userId}_`)) {
        // Extract date from key
        const dateStr = key.split('_').pop(); // Gets the YYYY-MM-DD part
        const snapshotDate = new Date(dateStr);

        // Remove if older than cutoff
        if (snapshotDate < cutoffDate) {
          localStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    console.warn('Error cleaning up old snapshots:', error);
  }
};

/**
 * Generate dynamic alerts from metrics
 * @param {Object} metrics - Dashboard metrics
 * @param {Object} blockchain - Blockchain context { isConnected, account }
 * @param {Object} predictions - Predictions data (optional)
 * @returns {Array} Array of alert objects
 */
export const generateDynamicAlerts = (metrics, blockchain, predictions = null) => {
  const alerts = [];

  // Alert 1: Check for delayed shipments
  if (metrics.delayedShipments && metrics.delayedShipments > 0) {
    alerts.push({
      type: 'warning',
      title: 'Delayed Shipments',
      message: `${metrics.delayedShipments} shipment${metrics.delayedShipments > 1 ? 's are' : ' is'} experiencing delays`,
      action: 'View Details',
      path: '/shipments',
    });
  }

  // Alert 2: Blockchain wallet status
  alerts.push({
    type: blockchain.isConnected ? 'success' : 'info',
    title: 'Blockchain Network',
    message: blockchain.isConnected
      ? `Connected to ${blockchain.account?.slice(0, 6)}...${blockchain.account?.slice(-4)}`
      : 'Wallet not connected',
    action: blockchain.isConnected ? null : 'Connect Wallet',
    path: null,
  });

  // Alert 3: AI Predictions (if available)
  if (predictions && predictions.accuracy) {
    alerts.push({
      type: 'success',
      title: 'AI Predictions',
      message: `Delivery time predictions are ${predictions.accuracy}% accurate this week`,
      action: 'View Analytics',
      path: '/analytics',
    });
  } else {
    // Default message if no predictions available
    alerts.push({
      type: 'info',
      title: 'AI Predictions',
      message: 'Prediction analytics are available for your events',
      action: 'View Analytics',
      path: '/analytics',
    });
  }

  // Alert 4: High order volume (if threshold exceeded)
  if (metrics.activeOrders && metrics.activeOrders > 10) {
    alerts.push({
      type: 'warning',
      title: 'High Order Volume',
      message: `You have ${metrics.activeOrders} active orders requiring attention`,
      action: 'Manage Orders',
      path: '/orders',
    });
  }

  // Alert 5: Low ticket inventory (if applicable)
  if (metrics.lowInventoryEvents && metrics.lowInventoryEvents > 0) {
    alerts.push({
      type: 'warning',
      title: 'Low Ticket Inventory',
      message: `${metrics.lowInventoryEvents} event${metrics.lowInventoryEvents > 1 ? 's have' : ' has'} low ticket availability`,
      action: 'View Events',
      path: '/events',
    });
  }

  return alerts;
};

/**
 * Format activity title and description from document data
 * @param {string} type - Activity type (order, ticket, event, shipment)
 * @param {string} action - Action performed (created, updated, deleted)
 * @param {Object} docData - Document data
 * @returns {Object} { title, description }
 */
export const formatActivityText = (type, action, docData) => {
  const actionPastTense = {
    created: 'created',
    updated: 'updated',
    deleted: 'deleted',
    added: 'added',
    removed: 'removed',
  };

  const typeLabels = {
    order: 'Order',
    ticket: 'Ticket',
    event: 'Event',
    shipment: 'Shipment',
  };

  const typeLabel = typeLabels[type] || 'Item';
  const actionText = actionPastTense[action] || action;

  let title = '';
  let description = '';

  switch (type) {
    case 'order':
      title = `${typeLabel} ${actionText}`;
      description = docData.orderId
        ? `Order #${docData.orderId}${docData.customerName ? ` from ${docData.customerName}` : ''}`
        : `New order ${actionText}`;
      break;

    case 'ticket':
      title = `Blockchain ticket ${actionText}`;
      description = docData.eventName
        ? `${docData.eventName} ticket ${actionText}`
        : `New blockchain ticket ${actionText}`;
      break;

    case 'event':
      title = `${typeLabel} ${actionText}`;
      description = docData.name
        ? `${docData.name}${docData.status ? ` - ${docData.status}` : ''}`
        : `New event ${actionText}`;
      break;

    case 'shipment':
      title = `Shipment ${actionText}`;
      description = docData.status
        ? `Shipment ${docData.status.toLowerCase()}${docData.location ? ` to ${docData.location}` : ''}`
        : `Shipment tracking ${actionText}`;
      break;

    default:
      title = `${typeLabel} ${actionText}`;
      description = `A ${type} was ${actionText}`;
  }

  return { title, description };
};

/**
 * Calculate quick stats from current data with historical comparison
 * @param {Object} currentData - Current metrics { events, orders, tickets }
 * @param {Object} historicalSnapshot - Historical snapshot for comparison
 * @returns {Array} Array of stat objects for dashboard
 */
export const calculateQuickStats = (currentData, historicalSnapshot) => {
  const { events, orders, tickets } = currentData;

  // Calculate current values
  const totalEvents = events.length || 0;
  const activeOrders = orders.filter(o =>
    ['Pending', 'Confirmed', 'Processing'].includes(o.status)
  ).length || 0;
  const totalTickets = tickets.length || 0;
  const shippedOrders = orders.filter(o => o.status === 'Shipped').length || 0;

  // Calculate percentage changes if historical data available
  const getChange = (current, historical) => {
    if (!historicalSnapshot || historical === undefined) {
      return { value: 'N/A', type: 'neutral' };
    }
    return calculatePercentageChange(current, historical);
  };

  const eventsChange = getChange(
    totalEvents,
    historicalSnapshot?.totalEvents
  );
  const ordersChange = getChange(
    activeOrders,
    historicalSnapshot?.activeOrders
  );
  const ticketsChange = getChange(
    totalTickets,
    historicalSnapshot?.totalTickets
  );
  const shippedChange = getChange(
    shippedOrders,
    historicalSnapshot?.shippedOrders
  );

  return [
    {
      title: 'Total Events',
      value: totalEvents,
      change: eventsChange.value,
      changeType: eventsChange.type,
      path: '/events',
    },
    {
      title: 'Active Orders',
      value: activeOrders,
      change: ordersChange.value,
      changeType: ordersChange.type,
      path: '/orders',
    },
    {
      title: 'Blockchain Tickets',
      value: totalTickets,
      change: ticketsChange.value,
      changeType: ticketsChange.type,
      path: '/tickets',
    },
    {
      title: 'In Transit',
      value: shippedOrders,
      change: shippedChange.value,
      changeType: shippedChange.type,
      path: '/shipments',
    },
  ];
};
