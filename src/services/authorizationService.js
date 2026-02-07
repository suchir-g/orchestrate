import { db } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

/**
 * Role-Permission Mapping
 * Defines what each role can do
 */
const rolePermissions = {
  admin: {
    schedule: 'write',
    volunteers: 'write',
    deliverables: 'write',
    sponsors: 'write',
    accommodations: 'write',
    foodService: 'write',
    infrastructure: 'write',
    analytics: 'read',
    userManagement: 'write'
  },
  volunteer: {
    schedule: 'read',
    volunteers: 'read',
    deliverables: 'none',
    sponsors: 'none',
    accommodations: 'none',
    foodService: 'none',
    infrastructure: 'none',
    analytics: 'none',
    userManagement: 'none'
  },
  sponsor: {
    schedule: 'read',
    volunteers: 'write',
    deliverables: 'read',
    sponsors: 'write',
    accommodations: 'none',
    foodService: 'none',
    infrastructure: 'none',
    analytics: 'none',
    userManagement: 'none'
  },
  attendee: {
    schedule: 'read',
    volunteers: 'none',
    deliverables: 'none',
    sponsors: 'none',
    accommodations: 'none',
    foodService: 'none',
    infrastructure: 'none',
    analytics: 'none',
    userManagement: 'none'
  }
};

/**
 * Get user's role(s) for a specific event
 * @param {string} userId - User ID
 * @param {string} eventId - Event ID
 * @returns {Promise<string|string[]|null>} - Role or array of roles, null if not found
 */
export const getUserRole = async (userId, eventId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) return null;

    const roles = userDoc.data().roles || [];
    const eventRoles = roles
      .filter(r => r.eventId === eventId)
      .map(r => r.role);

    return eventRoles.length === 0 ? null : eventRoles.length === 1 ? eventRoles[0] : eventRoles;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

/**
 * Get all user roles across all events
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Object with eventId as key and role(s) as value
 */
export const getUserRolesAllEvents = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) return {};

    const roles = userDoc.data().roles || [];
    const rolesByEvent = {};

    roles.forEach(r => {
      if (!rolesByEvent[r.eventId]) {
        rolesByEvent[r.eventId] = [];
      }
      rolesByEvent[r.eventId].push(r.role);
    });

    return rolesByEvent;
  } catch (error) {
    console.error('Error getting user roles:', error);
    return {};
  }
};

/**
 * Check if user has specific permission for a resource
 * @param {string} userRole - User's role
 * @param {string} resource - Resource name (schedule, volunteers, etc.)
 * @param {string} action - Action type ('read' or 'write')
 * @returns {boolean} - True if user has permission
 */
export const checkPermission = (userRole, resource, action = 'read') => {
  if (!userRole || !rolePermissions[userRole]) return false;

  const permission = rolePermissions[userRole][resource];
  if (!permission || permission === 'none') return false;

  if (action === 'read') {
    return permission === 'read' || permission === 'write';
  } else if (action === 'write') {
    return permission === 'write';
  }

  return false;
};

/**
 * Check multiple permissions (AND logic - all must be true)
 * @param {string} userRole - User's role
 * @param {string[]} permissions - Array of permission strings like "schedule:read", "volunteers:write"
 * @returns {boolean} - True if user has ALL permissions
 */
export const hasAllPermissions = (userRole, permissions) => {
  return permissions.every(perm => {
    const [resource, action] = perm.split(':');
    return checkPermission(userRole, resource, action);
  });
};

/**
 * Check if user has ANY of the specified permissions (OR logic)
 * @param {string} userRole - User's role
 * @param {string[]} permissions - Array of permission strings
 * @returns {boolean} - True if user has ANY permission
 */
export const hasAnyPermission = (userRole, permissions) => {
  return permissions.some(perm => {
    const [resource, action] = perm.split(':');
    return checkPermission(userRole, resource, action);
  });

};

/**
 * Get all permissions for a user role
 * @param {string} userRole - User's role
 * @returns {Object} - Object with resource names and their access levels
 */
export const getRolePermissions = (userRole) => {
  return rolePermissions[userRole] || {};
};

/**
 * Assign role to user for an event
 * @param {string} userId - User ID
 * @param {string} role - Role to assign
 * @param {string} eventId - Event ID
 * @param {string} adminId - Admin user ID who is making the assignment
 * @returns {Promise<{error: null|string}>}
 */
export const assignUserRole = async (userId, role, eventId, adminId) => {
  try {
    const validRoles = ['admin', 'volunteer', 'sponsor', 'attendee'];
    if (!validRoles.includes(role)) {
      return { error: 'Invalid role' };
    }

    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return { error: 'User not found' };
    }

    const roles = userDoc.data().roles || [];
    
    // Check if user already has this role for this event
    const existingRole = roles.find(r => r.eventId === eventId && r.role === role);
    if (existingRole) {
      return { error: 'User already has this role for this event' };
    }

    // Add new role
    roles.push({
      role,
      eventId,
      assignedAt: new Date(),
      assignedBy: adminId
    });

    await setDoc(userDocRef, { roles }, { merge: true });
    return { error: null };
  } catch (error) {
    console.error('Error assigning role:', error);
    return { error: error.message };
  }
};

/**
 * Remove role from user for an event
 * @param {string} userId - User ID
 * @param {string} role - Role to remove
 * @param {string} eventId - Event ID
 * @returns {Promise<{error: null|string}>}
 */
export const removeUserRole = async (userId, role, eventId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return { error: 'User not found' };
    }

    const roles = (userDoc.data().roles || []).filter(
      r => !(r.eventId === eventId && r.role === role)
    );

    await setDoc(userDocRef, { roles }, { merge: true });
    return { error: null };
  } catch (error) {
    console.error('Error removing role:', error);
    return { error: error.message };
  }
};

/**
 * Filter schedule blocks based on user role
 * For attendees, only show finalized blocks
 * @param {Array} scheduleBlocks - Array of schedule blocks
 * @param {string} userRole - User's role
 * @returns {Array} - Filtered schedule blocks
 */
export const filterScheduleByRole = (scheduleBlocks, userRole) => {
  if (!Array.isArray(scheduleBlocks)) return [];

  if (userRole === 'attendee') {
    // Attendees can only see finalized/completed sessions
    return scheduleBlocks.filter(block => block.status === 'completed');
  }

  // All other roles can see all schedule blocks
  return scheduleBlocks;
};

/**
 * Filter deliverables based on user role
 * @param {Array} deliverables - Array of deliverable items
 * @param {string} userRole - User's role
 * @returns {Array} - Filtered deliverables
 */
export const filterDeliverablesByRole = (deliverables, userRole) => {
  if (!Array.isArray(deliverables)) return [];

  // Only admins and sponsors can see deliverables
  if (userRole === 'admin' || userRole === 'sponsor') {
    return deliverables;
  }

  return [];
};

/**
 * Filter volunteers based on user role and userId
 * @param {Array} volunteers - Array of volunteers
 * @param {string} userRole - User's role
 * @param {string} userId - Current user's ID
 * @returns {Array} - Filtered volunteers
 */
export const filterVolunteersByRole = (volunteers, userRole, userId) => {
  if (!Array.isArray(volunteers)) return [];

  if (userRole === 'admin') {
    // Admins see all volunteers
    return volunteers;
  }

  if (userRole === 'volunteer') {
    // Volunteers only see their own profile (limited info)
    return volunteers.filter(v => v.userId === userId);
  }

  // Sponsors and attendees can't see volunteers
  return [];
};

/**
 * Filter volunteers' task assignments based on user role
 * @param {Array} assignments - Array of task assignments
 * @param {string} userRole - User's role
 * @param {string} userId - Current user's ID
 * @returns {Array} - Filtered assignments
 */
export const filterAssignmentsByRole = (assignments, userRole, userId) => {
  if (!Array.isArray(assignments)) return [];

  if (userRole === 'admin') {
    // Admins see all assignments
    return assignments;
  }

  if (userRole === 'volunteer') {
    // Volunteers only see their own assignments
    return assignments.filter(a => a.volunteerId === userId);
  }

  return [];
};

/**
 * Validate sponsor item request for conflicts
 * Checks if the item overlaps with items already provided
 * @param {Object} newItem - New item being requested
 * @param {Array} existingItems - Array of existing provided items
 * @returns {Object} - Validation result with conflicts array
 */
export const validateSponsorItemRequest = (newItem, existingItems = []) => {
  const conflicts = [];

  if (!Array.isArray(existingItems)) {
    return { isValid: true, conflicts: [] };
  }

  // Check for exact duplicate items
  const duplicates = existingItems.filter(item =>
    item.itemName.toLowerCase() === newItem.itemName.toLowerCase() &&
    item.category === newItem.category
  );

  if (duplicates.length > 0) {
    conflicts.push({
      type: 'duplicate',
      message: `This item is already being provided by ${duplicates[0].sponsorId || 'organizer'}`,
      conflictingItem: duplicates[0]
    });
  }

  // Check for overlapping items in the same category
  const categoryOverlaps = existingItems.filter(item =>
    item.category === newItem.category &&
    (!newItem.relatedScheduleBlocks || !item.relatedScheduleBlocks ||
      newItem.relatedScheduleBlocks.some(block => item.relatedScheduleBlocks.includes(block)))
  );

  if (categoryOverlaps.length > 0) {
    conflicts.push({
      type: 'category_overlap',
      message: `Similar items in the "${newItem.category}" category are already provided for overlapping time slots`,
      conflictingItems: categoryOverlaps
    });
  }

  return {
    isValid: conflicts.length === 0,
    conflicts
  };
};

/**
 * Validate sponsor volunteer request
 * Checks for scheduling conflicts with existing requests
 * @param {Object} volunteerRequest - New volunteer request
 * @param {Array} existingRequests - Array of existing volunteer requests
 * @returns {Object} - Validation result
 */
export const validateVolunteerRequest = (volunteerRequest, existingRequests = []) => {
  const conflicts = [];

  if (!Array.isArray(existingRequests)) {
    return { isValid: true, conflicts: [] };
  }

  // Check for time slot conflicts
  const timeConflicts = existingRequests.filter(req => {
    const requestStart = new Date(volunteerRequest.timeSlot.startTime);
    const requestEnd = new Date(volunteerRequest.timeSlot.endTime);
    const existingStart = new Date(req.timeSlot.startTime);
    const existingEnd = new Date(req.timeSlot.endTime);

    // Check if time slots overlap
    return requestStart < existingEnd && requestEnd > existingStart;
  });

  if (timeConflicts.length > 0) {
    conflicts.push({
      type: 'time_conflict',
      message: 'There are existing volunteer requests for this time slot',
      conflictingRequests: timeConflicts
    });
  }

  // Check for location conflicts
  const locationConflicts = existingRequests.filter(req =>
    req.location === volunteerRequest.location &&
    req.status === 'pending'
  );

  if (locationConflicts.length > 0) {
    conflicts.push({
      type: 'location_conflict',
      message: `There are already ${locationConflicts.length} pending requests for ${volunteerRequest.location}`,
      conflictingRequests: locationConflicts
    });
  }

  return {
    isValid: conflicts.length === 0,
    conflicts
  };
};

/**
 * Get action-specific resource access level
 * @param {string} userRole - User's role
 * @param {string} resource - Resource name
 * @returns {string} - 'read', 'write', or 'none'
 */
export const getResourceAccess = (userRole, resource) => {
  if (!rolePermissions[userRole]) return 'none';
  return rolePermissions[userRole][resource] || 'none';
};

/**
 * Check if user can perform specific action on resource
 * @param {string} userId - User ID
 * @param {string} eventId - Event ID
 * @param {string} resource - Resource name
 * @param {string} action - 'read' or 'write'
 * @returns {Promise<boolean>}
 */
export const canUserAccessResource = async (userId, eventId, resource, action = 'read') => {
  try {
    const userRole = await getUserRole(userId, eventId);
    if (!userRole) return false;

    return checkPermission(userRole, resource, action);
  } catch (error) {
    console.error('Error checking resource access:', error);
    return false;
  }
};

/**
 * Get role display name
 * @param {string} role - Role name
 * @returns {string} - Display name
 */
export const getRoleDisplayName = (role) => {
  const displayNames = {
    admin: 'Administrator',
    volunteer: 'Volunteer',
    sponsor: 'Sponsor',
    attendee: 'Attendee'
  };
  return displayNames[role] || role;
};

export default {
  getUserRole,
  getUserRolesAllEvents,
  checkPermission,
  hasAllPermissions,
  hasAnyPermission,
  getRolePermissions,
  assignUserRole,
  removeUserRole,
  filterScheduleByRole,
  filterDeliverablesByRole,
  filterVolunteersByRole,
  filterAssignmentsByRole,
  validateSponsorItemRequest,
  validateVolunteerRequest,
  getResourceAccess,
  canUserAccessResource,
  getRoleDisplayName
};
