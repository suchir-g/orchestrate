// Helper utility functions

// Format date to readable string
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  return new Date(date).toLocaleDateString('en-US', defaultOptions);
};

// Format currency
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Generate random ID
export const generateId = (prefix = 'id') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

// Format blockchain address
export const formatAddress = (address, start = 6, end = 4) => {
  if (!address) return '';
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

// Calculate time difference
export const getTimeDifference = (date1, date2 = new Date()) => {
  const diff = Math.abs(new Date(date2) - new Date(date1));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Generate QR data
export const generateQRData = (data) => {
  return JSON.stringify(data);
};

// Local storage helpers
export const storage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

// Status color mappings
export const getStatusColor = (status, type = 'general') => {
  const statusColors = {
    general: {
      'pending': 'warning',
      'confirmed': 'primary',
      'processing': 'info',
      'completed': 'success',
      'delivered': 'success',
      'cancelled': 'error',
      'failed': 'error',
    },
    blockchain: {
      'minting': 'warning',
      'minted': 'success',
      'transferred': 'info',
      'burned': 'error',
    },
    shipping: {
      'preparing': 'info',
      'shipped': 'primary',
      'in-transit': 'warning',
      'delivered': 'success',
      'delayed': 'error',
    }
  };
  
  return statusColors[type]?.[status?.toLowerCase()] || 'default';
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};

// Get icon name for activity type
export const getActivityIcon = (type) => {
  const icons = {
    order: 'OrderIcon',
    ticket: 'TokenIcon',
    event: 'EventIcon',
    shipment: 'ShippingIcon',
  };
  return icons[type] || 'NotificationIcon';
};

// Get color for activity type
export const getActivityColor = (type) => {
  const colors = {
    order: 'primary',
    ticket: 'secondary',
    event: 'info',
    shipment: 'success',
  };
  return colors[type] || 'default';
};

// Alias for getTimeDifference with more semantic name
export const getRelativeTime = getTimeDifference;