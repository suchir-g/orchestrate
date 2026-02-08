/**
 * Database Structure Documentation
 * 
 * NEW STRUCTURE:
 * 
 * 1. accounts collection
 *    - Document ID: userId (Firebase Auth UID)
 *    - Fields:
 *      - userId: string (Firebase Auth UID)
 *      - email: string (unique)
 *      - displayName: string
 *      - photoURL: string (optional)
 *      - bio: string (optional)
 *      - walletAddress: string (optional)
 *      - createdAt: timestamp
 *      - updatedAt: timestamp
 *      - deleted: boolean (soft delete)
 *      - deletedAt: timestamp (optional)
 * 
 * 2. eventuser collection
 *    - Document ID: "{eventId}__{userId}" (composite key)
 *    - Fields:
 *      - eventId: string
 *      - userId: string
 *      - role: string (organizer, volunteer, sponsor, viewer)
 *      - schedule: object (optional, event-specific schedule)
 *        - shifts: array
 *        - availability: object
 *        - tasks: array
 *      - createdAt: timestamp
 *      - updatedAt: timestamp
 * 
 * BENEFITS:
 * - Separation of concerns: User data vs Event-specific data
 * - Scalability: eventuser collection grows with event participation, not user count
 * - Query efficiency: Direct queries by eventId or userId
 * - Schedule isolation: Each event can have different schedules for same user
 * - No data duplication: User details stay in one place
 * 
 * MIGRATIONS:
 * - Old userProfiles → accounts
 * - Old events.collaborators → eventuser entries
 * - Events.createdBy → eventuser entry with role='organizer'
 */

import { createOrUpdateAccount } from './accountService';

/**
 * Helper to sync Firebase Auth user to accounts collection
 * Call this after user signs up or updates profile
 * @param {Object} authUser - Firebase Auth user object
 * @param {Object} additionalData - Additional profile data (displayName, bio, etc.)
 * @returns {Promise<Object>} { success, error }
 */
export const syncUserToAccounts = async (authUser, additionalData = {}) => {
  if (!authUser) {
    return { success: false, error: 'Auth user is required' };
  }

  return createOrUpdateAccount(authUser.uid, {
    email: authUser.email || '',
    displayName: additionalData.displayName || authUser.displayName || '',
    photoURL: additionalData.photoURL || authUser.photoURL || null,
    bio: additionalData.bio || '',
    walletAddress: additionalData.walletAddress || null,
    ...additionalData,
  });
};

/**
 * Helper to get user's full profile combining accounts + eventuser data
 * Useful for displaying user info in context of an event
 * @param {Object} accountService - Account service instance
 * @param {Object} eventUserService - EventUser service instance
 * @param {string} userId - User ID
 * @param {string} eventId - Optional event ID for role info
 * @returns {Promise<Object>} Combined user data
 */
export const getUserFullProfile = async (accountService, eventUserService, userId, eventId = null) => {
  try {
    // Get account data
    const account = await accountService.getAccount(userId);
    if (!account) return null;

    // Get event-specific data if eventId provided
    let eventData = null;
    if (eventId) {
      eventData = await eventUserService.getEventUser(eventId, userId);
    }

    return {
      ...account,
      eventData, // Will be null if no eventId provided
    };
  } catch (error) {
    console.error('Error getting full user profile:', error);
    return null;
  }
};

export default {
  syncUserToAccounts,
  getUserFullProfile,
};
