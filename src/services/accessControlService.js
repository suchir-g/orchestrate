/**
 * Access Control Service
 * Handles event access permissions and role-based queries
 */

import {
  collection,
  query,
  where,
  or,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS } from './firebaseDbService';
import {
  USER_ROLES,
  EVENT_ROLES,
  EVENT_VISIBILITY,
  PERMISSIONS,
  hasEventPermission,
  isAdmin,
} from '../utils/roleConstants';

// ========== EVENT ACCESS QUERIES ==========

/**
 * Get all events accessible by a user based on their roles and permissions
 * @param {string} userId - User ID
 * @param {string} userRole - User role (admin, organizer, volunteer, sponsor, attendee)
 * @returns {Promise<Object>} { data: [...events], error: null }
 */
export const getUserAccessibleEvents = async (userId, userRole = USER_ROLES.ATTENDEE) => {
  try {
    const eventsRef = collection(db, COLLECTIONS.EVENTS);
    let constraints = [];

    if (userRole === USER_ROLES.ADMIN) {
      // Admins can see all events
      const querySnapshot = await getDocs(eventsRef);
      const events = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { data: events, error: null };
    }

    // Build query for non-admin users
    // Events where user is:
    // 1. Creator (createdBy)
    // 2. In organizers array
    // 3. In volunteers array
    // 4. In sponsors array
    // 5. Public events (for attendees)

    const q = query(
      eventsRef,
      or(
        where('createdBy', '==', userId),
        where('organizers', 'array-contains', userId),
        where('volunteers', 'array-contains', userId),
        where('sponsors', 'array-contains', userId),
        where('visibility', '==', EVENT_VISIBILITY.PUBLIC)
      )
    );

    const querySnapshot = await getDocs(q);
    const events = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { data: events, error: null };
  } catch (error) {
    console.error('Error getting accessible events:', error);
    return { data: [], error: error.message };
  }
};

/**
 * Get user's role for a specific event
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @param {string} userRole - User's global role
 * @returns {Promise<string>} Event role (owner, organizer, volunteer, sponsor, viewer, or null)
 */
export const getUserEventRole = async (eventId, userId, userRole) => {
  try {
    // Admins are mapped to organizer role for events
    if (userRole === USER_ROLES.ADMIN) {
      return EVENT_ROLES.ORGANIZER;
    }

    const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
      return null;
    }

    const eventData = eventDoc.data();

    // Treat event creator as an organizer (no separate owner role)
    if (eventData.createdBy === userId) {
      return EVENT_ROLES.ORGANIZER;
    }

    // Check collaborators array for specific role
    const collaborator = eventData.collaborators?.find(c => c.userId === userId);
    if (collaborator) {
      return collaborator.role;
    }

    // Check organizers array
    if (eventData.organizers?.includes(userId)) {
      return EVENT_ROLES.ORGANIZER;
    }

    // Check volunteers array
    if (eventData.volunteers?.includes(userId)) {
      return EVENT_ROLES.VOLUNTEER;
    }

    // Check sponsors array
    if (eventData.sponsors?.includes(userId)) {
      return EVENT_ROLES.SPONSOR;
    }

    // Check if event is public
    if (eventData.visibility === EVENT_VISIBILITY.PUBLIC) {
      return EVENT_ROLES.VIEWER;
    }

    // No access
    return null;
  } catch (error) {
    console.error('Error getting user event role:', error);
    return null;
  }
};

/**
 * Check if user can access an event
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @param {string} userRole - User's global role
 * @returns {Promise<boolean>}
 */
export const canAccessEvent = async (eventId, userId, userRole) => {
  const eventRole = await getUserEventRole(eventId, userId, userRole);
  return eventRole !== null;
};

/**
 * Check if user has specific permission for an event
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @param {string} userRole - User's global role
 * @param {string} permission - Permission to check
 * @returns {Promise<boolean>}
 */
export const hasEventAccess = async (eventId, userId, userRole, permission) => {
  try {
    // Admins have all permissions
    if (isAdmin(userRole)) {
      return true;
    }

    const eventRole = await getUserEventRole(eventId, userId, userRole);

    if (!eventRole) {
      return false;
    }

    return hasEventPermission(eventRole, permission);
  } catch (error) {
    console.error('Error checking event access:', error);
    return false;
  }
};

/**
 * Check if a user can manage collaborators for an event (add/remove/edit collaborators)
 * @param {string} eventId
 * @param {string} userId
 * @param {string} userRole
 * @returns {Promise<boolean>}
 */
export const canManageCollaborators = async (eventId, userId, userRole) => {
  try {
    // Reuse existing permission check for collaborator edit
    return await hasEventAccess(eventId, userId, userRole, PERMISSIONS.COLLABORATOR_EDIT);
  } catch (error) {
    console.error('Error checking collaborator manage permission:', error);
    return false;
  }
};

// ========== COLLABORATOR MANAGEMENT ==========

/**
 * Add a collaborator to an event
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID to add
 * @param {string} role - Event role (organizer, volunteer, sponsor, viewer)
 * @param {Object} permissions - Custom permissions (optional)
 * @returns {Promise<Object>} { error: null } or { error: message }
 */
export const addEventCollaborator = async (eventId, userId, role, permissions = null) => {
  try {
    const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);

    const collaborator = {
      userId,
      role,
      permissions: permissions || null,
      addedAt: new Date().toISOString(),
    };

    // Add to collaborators array
    await updateDoc(eventRef, {
      collaborators: arrayUnion(collaborator),
      updatedAt: new Date(),
    });

    // Also add to role-specific arrays for easier querying
    if (role === EVENT_ROLES.ORGANIZER) {
      await updateDoc(eventRef, {
        organizers: arrayUnion(userId),
      });
    } else if (role === EVENT_ROLES.VOLUNTEER) {
      await updateDoc(eventRef, {
        volunteers: arrayUnion(userId),
      });
    } else if (role === EVENT_ROLES.SPONSOR) {
      await updateDoc(eventRef, {
        sponsors: arrayUnion(userId),
      });
    }

    return { error: null };
  } catch (error) {
    console.error('Error adding collaborator:', error);
    return { error: error.message };
  }
};

/**
 * Remove a collaborator from an event
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID to remove
 * @returns {Promise<Object>} { error: null } or { error: message }
 */
export const removeEventCollaborator = async (eventId, userId) => {
  try {
    const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
      return { error: 'Event not found' };
    }

    const eventData = eventDoc.data();

    // Find and remove collaborator
    const collaborator = eventData.collaborators?.find(c => c.userId === userId);

    if (!collaborator) {
      return { error: 'Collaborator not found' };
    }

    // Remove from collaborators array
    await updateDoc(eventRef, {
      collaborators: arrayRemove(collaborator),
      updatedAt: new Date(),
    });

    // Remove from role-specific arrays
    if (collaborator.role === EVENT_ROLES.ORGANIZER) {
      await updateDoc(eventRef, {
        organizers: arrayRemove(userId),
      });
    } else if (collaborator.role === EVENT_ROLES.VOLUNTEER) {
      await updateDoc(eventRef, {
        volunteers: arrayRemove(userId),
      });
    } else if (collaborator.role === EVENT_ROLES.SPONSOR) {
      await updateDoc(eventRef, {
        sponsors: arrayRemove(userId),
      });
    }

    return { error: null };
  } catch (error) {
    console.error('Error removing collaborator:', error);
    return { error: error.message };
  }
};

/**
 * Update collaborator role
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID
 * @param {string} newRole - New event role
 * @returns {Promise<Object>} { error: null } or { error: message }
 */
export const updateEventCollaboratorRole = async (eventId, userId, newRole) => {
  try {
    // Remove old collaborator entry
    await removeEventCollaborator(eventId, userId);

    // Add with new role
    await addEventCollaborator(eventId, userId, newRole);

    return { error: null };
  } catch (error) {
    console.error('Error updating collaborator role:', error);
    return { error: error.message };
  }
};

/**
 * Get all collaborators for an event
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} { data: [...collaborators], error: null }
 */
export const getEventCollaborators = async (eventId) => {
  try {
    const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
      return { data: [], error: 'Event not found' };
    }

    const eventData = eventDoc.data();
    const collaborators = eventData.collaborators || [];

    return { data: collaborators, error: null };
  } catch (error) {
    console.error('Error getting collaborators:', error);
    return { data: [], error: error.message };
  }
};

/**
 * Get organizers and volunteers for an event
 * Organizers = creator + those assigned as organizers
 * Volunteers = those assigned as volunteers
 * @param {string} eventId - Event ID
 * @param {string} userId - Current user ID (for filtering if needed)
 * @returns {Promise<Object>} { organizers: [...], volunteers: [...], error: null }
 */
export const getEventTeams = async (eventId, userId = null) => {
  try {
    const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists()) {
      return { organizers: [], volunteers: [], error: 'Event not found' };
    }

    const eventData = eventDoc.data();
    const collaborators = eventData.collaborators || [];
    
    // Helper function to get user display name
    const getUserDisplayName = async (uid) => {
      try {
        const userRef = doc(db, 'userProfiles', uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          return userDoc.data().displayName || userDoc.data().email || uid;
        }
        return uid;
      } catch (err) {
        console.warn('Could not fetch user profile for', uid);
        return uid;
      }
    };
    
    // Organizers: event creator + collaborators with organizer role
    const organizers = [];
    
    // Add event creator as organizer
    if (eventData.createdBy) {
      const creatorName = await getUserDisplayName(eventData.createdBy);
      organizers.push({
        id: eventData.createdBy,
        displayName: creatorName,
        role: EVENT_ROLES.ORGANIZER,
        isCreator: true,
      });
    }
    
    // Add collaborators with organizer role
    for (const collab of collaborators) {
      if (collab.role === EVENT_ROLES.ORGANIZER && collab.userId !== eventData.createdBy) {
        const collabName = await getUserDisplayName(collab.userId);
        organizers.push({
          id: collab.userId,
          displayName: collabName,
          role: EVENT_ROLES.ORGANIZER,
          isCreator: false,
          ...collab,
        });
      }
    }

    // Volunteers: collaborators with volunteer role only
    const volunteers = [];
    for (const collab of collaborators) {
      if (collab.role === EVENT_ROLES.VOLUNTEER) {
        const volName = await getUserDisplayName(collab.userId);
        volunteers.push({
          id: collab.userId,
          displayName: volName,
          role: EVENT_ROLES.VOLUNTEER,
          ...collab,
        });
      }
    }

    return { organizers, volunteers, error: null };
  } catch (error) {
    console.error('Error getting event teams:', error);
    return { organizers: [], volunteers: [], error: error.message };
  }
};

// ========== EVENT VISIBILITY ==========

/**
 * Update event visibility
 * @param {string} eventId - Event ID
 * @param {string} visibility - Visibility (private, organization, public)
 * @returns {Promise<Object>} { error: null } or { error: message }
 */
export const updateEventVisibility = async (eventId, visibility) => {
  try {
    if (!Object.values(EVENT_VISIBILITY).includes(visibility)) {
      return { error: 'Invalid visibility value' };
    }

    const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);

    await updateDoc(eventRef, {
      visibility,
      updatedAt: new Date(),
    });

    return { error: null };
  } catch (error) {
    console.error('Error updating event visibility:', error);
    return { error: error.message };
  }
};

// ========== INVITE SYSTEM ==========

/**
 * Generate invite link for an event
 * @param {string} eventId - Event ID
 * @param {string} role - Event role for invitee
 * @returns {string} Invite URL
 */
export const generateEventInviteLink = (eventId, role) => {
  const baseUrl = window.location.origin;
  const inviteCode = btoa(`${eventId}:${role}:${Date.now()}`);
  return `${baseUrl}/event/${eventId}/join?invite=${inviteCode}`;
};

/**
 * Accept event invite
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID accepting invite
 * @param {string} inviteCode - Invite code from URL
 * @returns {Promise<Object>} { error: null, role: string } or { error: message }
 */
export const acceptEventInvite = async (eventId, userId, inviteCode) => {
  try {
    // Decode invite
    const decoded = atob(inviteCode);
    const [inviteEventId, role, timestamp] = decoded.split(':');

    // Validate
    if (inviteEventId !== eventId) {
      return { error: 'Invalid invite code' };
    }

    // Check if invite is expired (7 days)
    const inviteAge = Date.now() - parseInt(timestamp);
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    if (inviteAge > sevenDays) {
      return { error: 'Invite code has expired' };
    }

    // Add user as collaborator
    const result = await addEventCollaborator(eventId, userId, role);

    if (result.error) {
      return result;
    }

    return { error: null, role };
  } catch (error) {
    console.error('Error accepting invite:', error);
    return { error: 'Invalid invite code' };
  }
};

// ========== MIGRATION UTILITIES ==========

/**
 * Migrate existing events to add RBAC fields
 * This function adds missing organizers, volunteers, sponsors arrays and visibility field
 * Should be run once when RBAC is first implemented
 * @returns {Promise<Object>} { updated: number, error: null }
 */
export const migrateEventsToRBAC = async () => {
  try {
    const eventsRef = collection(db, COLLECTIONS.EVENTS);
    const querySnapshot = await getDocs(eventsRef);

    let updatedCount = 0;
    const batch = writeBatch(db);

    querySnapshot.forEach((docSnapshot) => {
      const eventData = docSnapshot.data();
      const eventRef = doc(db, COLLECTIONS.EVENTS, docSnapshot.id);

      const updates = {};
      let needsUpdate = false;

      // Add organizers array if missing (creator becomes organizer)
      if (!eventData.organizers) {
        updates.organizers = eventData.createdBy ? [eventData.createdBy] : [];
        needsUpdate = true;
      }

      // Add volunteers array if missing
      if (!eventData.volunteers) {
        updates.volunteers = [];
        needsUpdate = true;
      }

      // Add sponsors array if missing
      if (!eventData.sponsors) {
        updates.sponsors = [];
        needsUpdate = true;
      }

      // Add collaborators array if missing
      if (!eventData.collaborators) {
        updates.collaborators = [];
        needsUpdate = true;
      }

      // Add visibility field if missing (default to private)
      if (!eventData.visibility) {
        updates.visibility = EVENT_VISIBILITY.PRIVATE;
        needsUpdate = true;
      }

      if (needsUpdate) {
        batch.update(eventRef, { ...updates, updatedAt: new Date() });
        updatedCount++;
      }
    });

    await batch.commit();

    console.log(`✅ Migration complete: Updated ${updatedCount} events`);
    return { updated: updatedCount, error: null };
  } catch (error) {
    console.error('Error migrating events:', error);
    return { updated: 0, error: error.message };
  }
};
