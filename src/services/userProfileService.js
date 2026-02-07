/**
 * User Profile Service
 * Fetch user profiles and details for displaying team members
 */

import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Get a single user profile
 * @param {string} userId - User ID
 * @returns {Promise<Object>} { data, error }
 */
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return { data: null, error: 'User not found' };
    }

    return {
      data: {
        id: userDoc.id,
        ...userDoc.data(),
      },
      error: null,
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Get multiple user profiles
 * @param {Array<string>} userIds - Array of user IDs
 * @returns {Promise<Object>} { data, error }
 */
export const getMultipleUserProfiles = async (userIds) => {
  try {
    if (!userIds || userIds.length === 0) {
      return { data: [], error: null };
    }

    // Fetch all user profiles in parallel
    const profilePromises = userIds.map(userId => getUserProfile(userId));
    const results = await Promise.all(profilePromises);

    // Filter out errors and return only successful profiles
    const profiles = results
      .filter(result => !result.error && result.data)
      .map(result => result.data);

    return { data: profiles, error: null };
  } catch (error) {
    console.error('Error getting multiple profiles:', error);
    return { data: [], error: error.message };
  }
};

/**
 * Get event team members (organizers, volunteers, sponsors)
 * @param {Object} event - Event object
 * @returns {Promise<Object>} { organizers, volunteers, sponsors, error }
 */
export const getEventTeamMembers = async (event) => {
  try {
    if (!event) {
      return { organizers: [], volunteers: [], sponsors: [], error: 'No event provided' };
    }

    // Get all unique user IDs
    const organizerIds = event.organizers || [];
    const volunteerIds = event.volunteers || [];
    const sponsorIds = event.sponsors || [];

    // Fetch profiles in parallel
    const [organizersData, volunteersData, sponsorsData] = await Promise.all([
      getMultipleUserProfiles(organizerIds),
      getMultipleUserProfiles(volunteerIds),
      getMultipleUserProfiles(sponsorIds),
    ]);

    return {
      organizers: organizersData.data || [],
      volunteers: volunteersData.data || [],
      sponsors: sponsorsData.data || [],
      error: null,
    };
  } catch (error) {
    console.error('Error getting event team members:', error);
    return {
      organizers: [],
      volunteers: [],
      sponsors: [],
      error: error.message,
    };
  }
};

/**
 * Get event owner details
 * @param {string} ownerId - Owner user ID
 * @returns {Promise<Object>} { data, error }
 */
export const getEventOwner = async (ownerId) => {
  return getUserProfile(ownerId);
};

export default {
  getUserProfile,
  getMultipleUserProfiles,
  getEventTeamMembers,
  getEventOwner,
};
