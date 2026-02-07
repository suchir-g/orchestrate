/**
 * Activity Tracking Service
 * Tracks Firestore document changes and generates activity feed
 */

import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { formatActivityText } from '../utils/analyticsHelpers';
import { getTimeDifference } from '../utils/helpers';

const ACTIVITY_STORAGE_KEY_PREFIX = 'activities_';
const MAX_ACTIVITIES = 50; // Maximum activities to store
const ACTIVITY_RETENTION_DAYS = 7; // Keep activities for 7 days

/**
 * Initialize activity tracking for authenticated user
 * Sets up Firebase listeners for specified collections
 * @param {string} userId - User ID
 * @param {Array<string>} collections - Collections to track (e.g., ['events', 'orders', 'tickets'])
 * @returns {Function} Unsubscribe function to stop all listeners
 */
export const initializeActivityTracking = (userId, collections = ['events', 'orders', 'tickets']) => {
  console.log('🔔 Initializing activity tracking for user:', userId);

  const unsubscribers = [];

  collections.forEach((collectionName) => {
    try {
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, where('createdBy', '==', userId));

      // Set up real-time listener with docChanges
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            // Only track 'added' and 'modified' changes, not initial load
            if (change.type === 'added' && !snapshot.metadata.hasPendingWrites) {
              const activity = createActivityFromChange(change, collectionName, userId);
              if (activity) {
                addActivity(activity);
                console.log(`✅ Activity tracked: ${activity.type} - ${activity.title}`);
              }
            } else if (change.type === 'modified') {
              const activity = createActivityFromChange(change, collectionName, userId, 'updated');
              if (activity) {
                addActivity(activity);
                console.log(`📝 Activity tracked: ${activity.type} - ${activity.title}`);
              }
            }
          });
        },
        (error) => {
          console.error(`Error listening to ${collectionName}:`, error);
        }
      );

      unsubscribers.push(unsubscribe);
    } catch (error) {
      console.error(`Failed to set up listener for ${collectionName}:`, error);
    }
  });

  // Cleanup old activities on initialization
  cleanupOldActivities(userId);

  // Return combined unsubscribe function
  return () => {
    console.log('🔕 Stopping activity tracking');
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
};

/**
 * Create activity object from Firestore document change
 * @param {Object} change - Firestore document change
 * @param {string} collectionName - Collection name
 * @param {string} userId - User ID
 * @param {string} actionOverride - Optional action override
 * @returns {Object|null} Activity object or null
 */
export const createActivityFromChange = (change, collectionName, userId, actionOverride = null) => {
  try {
    const doc = change.doc;
    const docData = doc.data();

    // Determine action type
    let action = actionOverride;
    if (!action) {
      if (change.type === 'added') action = 'created';
      else if (change.type === 'modified') action = 'updated';
      else if (change.type === 'removed') action = 'deleted';
    }

    // Map collection name to activity type
    const typeMap = {
      events: 'event',
      orders: 'order',
      tickets: 'ticket',
      shipments: 'shipment',
    };

    const type = typeMap[collectionName] || collectionName;

    // Generate title and description
    const { title, description } = formatActivityText(type, action, docData);

    // Create activity object
    return {
      id: `${doc.id}_${Date.now()}`,
      type,
      action,
      title,
      description,
      timestamp: new Date().toISOString(),
      userId,
      documentId: doc.id,
      documentData: {
        name: docData.name,
        status: docData.status,
        orderId: docData.orderId,
        eventName: docData.eventName,
      },
    };
  } catch (error) {
    console.error('Error creating activity from change:', error);
    return null;
  }
};

/**
 * Get recent activities from localStorage
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of activities to return
 * @returns {Array} Array of activity objects
 */
export const getRecentActivities = (userId, limit = 10) => {
  try {
    const storageKey = `${ACTIVITY_STORAGE_KEY_PREFIX}${userId}`;
    const stored = localStorage.getItem(storageKey);

    if (!stored) {
      return [];
    }

    const activities = JSON.parse(stored);

    // Filter out old activities
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ACTIVITY_RETENTION_DAYS);

    const filtered = activities.filter((activity) => {
      const activityDate = new Date(activity.timestamp);
      return activityDate >= cutoffDate;
    });

    // Sort by timestamp descending (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Return limited number
    return filtered.slice(0, limit);
  } catch (error) {
    console.error('Error retrieving activities:', error);
    return [];
  }
};

/**
 * Add new activity to localStorage
 * @param {Object} activity - Activity object to add
 */
export const addActivity = (activity) => {
  try {
    const { userId } = activity;
    if (!userId) {
      console.warn('Activity missing userId, cannot store');
      return;
    }

    const storageKey = `${ACTIVITY_STORAGE_KEY_PREFIX}${userId}`;
    const stored = localStorage.getItem(storageKey);

    let activities = stored ? JSON.parse(stored) : [];

    // Add new activity to beginning
    activities.unshift(activity);

    // Limit total number of stored activities
    if (activities.length > MAX_ACTIVITIES) {
      activities = activities.slice(0, MAX_ACTIVITIES);
    }

    // Save back to localStorage
    localStorage.setItem(storageKey, JSON.stringify(activities));
  } catch (error) {
    console.error('Error adding activity:', error);
    // Don't throw - this is not critical
  }
};

/**
 * Cleanup old activities from localStorage
 * @param {string} userId - User ID
 * @param {number} daysToKeep - Number of days to keep (default 7)
 */
export const cleanupOldActivities = (userId, daysToKeep = ACTIVITY_RETENTION_DAYS) => {
  try {
    const storageKey = `${ACTIVITY_STORAGE_KEY_PREFIX}${userId}`;
    const stored = localStorage.getItem(storageKey);

    if (!stored) {
      return;
    }

    const activities = JSON.parse(stored);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Filter out old activities
    const filtered = activities.filter((activity) => {
      const activityDate = new Date(activity.timestamp);
      return activityDate >= cutoffDate;
    });

    // Save filtered activities back
    localStorage.setItem(storageKey, JSON.stringify(filtered));

    const removedCount = activities.length - filtered.length;
    if (removedCount > 0) {
      console.log(`🗑️ Cleaned up ${removedCount} old activities`);
    }
  } catch (error) {
    console.error('Error cleaning up activities:', error);
  }
};

/**
 * Clear all activities for a user
 * @param {string} userId - User ID
 */
export const clearActivities = (userId) => {
  try {
    const storageKey = `${ACTIVITY_STORAGE_KEY_PREFIX}${userId}`;
    localStorage.removeItem(storageKey);
    console.log('🗑️ Cleared all activities for user');
  } catch (error) {
    console.error('Error clearing activities:', error);
  }
};

/**
 * Get activity statistics
 * @param {string} userId - User ID
 * @returns {Object} Statistics object
 */
export const getActivityStats = (userId) => {
  try {
    const activities = getRecentActivities(userId, MAX_ACTIVITIES);

    const stats = {
      total: activities.length,
      byType: {},
      byAction: {},
      last24Hours: 0,
      lastWeek: activities.length,
    };

    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

    activities.forEach((activity) => {
      // Count by type
      stats.byType[activity.type] = (stats.byType[activity.type] || 0) + 1;

      // Count by action
      stats.byAction[activity.action] = (stats.byAction[activity.action] || 0) + 1;

      // Count last 24 hours
      if (new Date(activity.timestamp) >= oneDayAgo) {
        stats.last24Hours++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting activity stats:', error);
    return {
      total: 0,
      byType: {},
      byAction: {},
      last24Hours: 0,
      lastWeek: 0,
    };
  }
};
