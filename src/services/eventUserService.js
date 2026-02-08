/**
 * Event User Service
 * Manages the 'eventuser' collection - composite key (eventId + userId)
 * Stores user role in event and event-specific schedules
 */

import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

const COLLECTION = 'eventuser';

/**
 * Create composite ID from eventId and userId
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @returns {string} Composite ID
 */
const createCompositeId = (eventId, userId) => `${eventId}__${userId}`;

/**
 * Get event user role and details
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Event user data or null
 */
export const getEventUser = async (eventId, userId) => {
  try {
    if (!eventId || !userId) return null;

    const compositeId = createCompositeId(eventId, userId);
    const eventUserRef = doc(db, COLLECTION, compositeId);
    const eventUserDoc = await getDoc(eventUserRef);

    if (eventUserDoc.exists()) {
      return eventUserDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting event user:', error);
    return null;
  }
};

/**
 * Create or update event user role
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @param {string} role - User role (organizer, volunteer, sponsor, viewer)
 * @param {Object} schedule - User's event schedule (optional)
 * @returns {Promise<Object>} { success, error }
 */
export const setEventUserRole = async (eventId, userId, role, schedule = null) => {
  try {
    if (!eventId || !userId || !role) {
      return { success: false, error: 'EventId, userId, and role are required' };
    }

    const compositeId = createCompositeId(eventId, userId);
    const eventUserRef = doc(db, COLLECTION, compositeId);
    const existingData = await getDoc(eventUserRef);

    const dataToSet = {
      eventId,
      userId,
      role,
      schedule: schedule || existingData.data()?.schedule || null,
      ...(existingData.exists() && { updatedAt: new Date() }),
      ...(!existingData.exists() && { createdAt: new Date() }),
    };

    await setDoc(eventUserRef, dataToSet, { merge: true });

    return { success: true, error: null };
  } catch (error) {
    console.error('Error setting event user role:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update event user schedule
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @param {Object} schedule - Schedule details
 * @returns {Promise<Object>} { success, error }
 */
export const updateEventUserSchedule = async (eventId, userId, schedule) => {
  try {
    if (!eventId || !userId) {
      return { success: false, error: 'EventId and userId are required' };
    }

    const compositeId = createCompositeId(eventId, userId);
    const eventUserRef = doc(db, COLLECTION, compositeId);

    await updateDoc(eventUserRef, {
      schedule,
      updatedAt: new Date(),
    });

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating event user schedule:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all event users for a specific event
 * @param {string} eventId - Event ID
 * @returns {Promise<Array>} Array of event users
 */
export const getEventUsers = async (eventId) => {
  try {
    if (!eventId) return [];

    const eventUserCollection = collection(db, COLLECTION);
    const q = query(eventUserCollection, where('eventId', '==', eventId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      compositeId: doc.id,
    }));
  } catch (error) {
    console.error('Error getting event users:', error);
    return [];
  }
};

/**
 * Get all events for a specific user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of events user is part of
 */
export const getUserEvents = async (userId) => {
  try {
    if (!userId) return [];

    const eventUserCollection = collection(db, COLLECTION);
    const q = query(eventUserCollection, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      compositeId: doc.id,
    }));
  } catch (error) {
    console.error('Error getting user events:', error);
    return [];
  }
};

/**
 * Remove user from event
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} { success, error }
 */
export const removeEventUser = async (eventId, userId) => {
  try {
    if (!eventId || !userId) {
      return { success: false, error: 'EventId and userId are required' };
    }

    const compositeId = createCompositeId(eventId, userId);
    const eventUserRef = doc(db, COLLECTION, compositeId);

    await deleteDoc(eventUserRef);

    return { success: true, error: null };
  } catch (error) {
    console.error('Error removing event user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get event users by role
 * @param {string} eventId - Event ID
 * @param {string} role - User role to filter by
 * @returns {Promise<Array>} Array of event users with specific role
 */
export const getEventUsersByRole = async (eventId, role) => {
  try {
    if (!eventId || !role) return [];

    const allEventUsers = await getEventUsers(eventId);
    return allEventUsers.filter(eu => eu.role === role);
  } catch (error) {
    console.error('Error getting event users by role:', error);
    return [];
  }
};

/**
 * Update event user details
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} { success, error }
 */
export const updateEventUser = async (eventId, userId, updates) => {
  try {
    if (!eventId || !userId) {
      return { success: false, error: 'EventId and userId are required' };
    }

    const compositeId = createCompositeId(eventId, userId);
    const eventUserRef = doc(db, COLLECTION, compositeId);

    await updateDoc(eventUserRef, {
      ...updates,
      updatedAt: new Date(),
    });

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating event user:', error);
    return { success: false, error: error.message };
  }
};
