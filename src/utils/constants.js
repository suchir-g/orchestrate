// Application constants

export const APP_CONFIG = {
  APP_NAME: 'Orchestrate',
  VERSION: '1.0.0',
  DESCRIPTION: 'Event Tracking & Logistics Platform with Blockchain Integration',
};

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// Blockchain Configuration
export const BLOCKCHAIN_CONFIG = {
  SUPPORTED_NETWORKS: {
    1: 'Ethereum Mainnet',
    5: 'Goerli Testnet',
    137: 'Polygon',
    31337: 'Localhost'
  },
  DEFAULT_NETWORK: 5, // Goerli
  CONTRACT_ADDRESSES: {
    TICKET_NFT: process.env.REACT_APP_TICKET_CONTRACT_ADDRESS,
    TOKEN: process.env.REACT_APP_TOKEN_CONTRACT_ADDRESS,
  },
};

// Event Types
export const EVENT_TYPES = [
  'Conference',
  'Workshop', 
  'Concert',
  'Sports',
  'Exhibition',
  'Festival',
  'Seminar',
  'Trade Show',
  'Networking',
  'Other'
];

// Order Status
export const ORDER_STATUS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned'
};

// Event Status
export const EVENT_STATUS = {
  PLANNING: 'Planning',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  POSTPONED: 'Postponed'
};

// Ticket Status
export const TICKET_STATUS = {
  MINTING: 'Minting',
  MINTED: 'Minted',
  TRANSFERRED: 'Transferred',
  USED: 'Used',
  EXPIRED: 'Expired'
};

// Priority Levels
export const PRIORITY_LEVELS = {
  LOW: 'Low',
  NORMAL: 'Normal',
  HIGH: 'High',
  URGENT: 'Urgent'
};

// Shipment Status
export const SHIPMENT_STATUS = {
  PREPARING: 'Preparing',
  PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'In Transit',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  DELAYED: 'Delayed',
  RETURNED: 'Returned'
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  ISO: 'yyyy-MM-dd',
  ISO_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
};

// Chart Colors
export const CHART_COLORS = [
  '#2196f3', // Blue
  '#4caf50', // Green
  '#ff9800', // Orange
  '#f44336', // Red
  '#9c27b0', // Purple
  '#00bcd4', // Cyan
  '#ffeb3b', // Yellow
  '#795548', // Brown
  '#607d8b', // Blue Grey
  '#e91e63'  // Pink
];

// Local Storage Keys
export const STORAGE_KEYS = {
  WALLET_CONNECTED: 'isConnected',
  USER_PREFERENCES: 'userPreferences',
  RECENT_EVENTS: 'recentEvents',
  RECENT_ORDERS: 'recentOrders',
  THEME_MODE: 'themeMode',
  LANGUAGE: 'language'
};

// Navigation Routes
export const ROUTES = {
  HOME: '/',
  EVENTS: '/events',
  ORDERS: '/orders',
  SHIPMENTS: '/shipments',
  TICKETS: '/tickets',
  ANALYTICS: '/analytics',
  PREDICTIONS: '/predictions',
  PROFILE: '/profile',
  SETTINGS: '/settings'
};

// File Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ACCEPTED_FORMATS: {
    IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENTS: ['application/pdf', 'text/csv', 'application/vnd.ms-excel'],
    ALL: ['image/*', '.pdf', '.csv', '.xlsx']
  }
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50],
  MAX_PAGE_SIZE: 100
};

// Notifications
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Analytics Time Ranges
export const TIME_RANGES = {
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
  '1y': '1 year',
  'all': 'All time'
};

// Feature Flags
export const FEATURES = {
  BLOCKCHAIN_ENABLED: process.env.REACT_APP_ENABLE_BLOCKCHAIN !== 'false',
  PREDICTIONS_ENABLED: process.env.REACT_APP_ENABLE_PREDICTIONS !== 'false',
  ANALYTICS_ENABLED: true,
  NOTIFICATIONS_ENABLED: true,
  DARK_MODE_ENABLED: true
};