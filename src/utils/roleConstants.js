/**
 * Role-Based Access Control (RBAC) Constants
 * Defines user roles, permissions, and access control rules
 */

// ========== USER ROLES ==========

export const USER_ROLES = {
  ADMIN: 'admin',
  ORGANIZER: 'organizer',
  VOLUNTEER: 'volunteer',
  SPONSOR: 'sponsor',
  ATTENDEE: 'attendee',
};

export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.ORGANIZER]: 'Event Organizer',
  [USER_ROLES.VOLUNTEER]: 'Volunteer',
  [USER_ROLES.SPONSOR]: 'Sponsor',
  [USER_ROLES.ATTENDEE]: 'Attendee',
};

export const ROLE_DESCRIPTIONS = {
  [USER_ROLES.ADMIN]: 'Full system access - can manage all events and users',
  [USER_ROLES.ORGANIZER]: 'Can create and manage events, invite collaborators',
  [USER_ROLES.VOLUNTEER]: 'Can view assigned events and manage volunteer tasks',
  [USER_ROLES.SPONSOR]: 'Can view sponsored events and manage sponsorship details',
  [USER_ROLES.ATTENDEE]: 'Can view public events and purchase tickets',
};

// ========== EVENT ROLES ==========

export const EVENT_ROLES = {
  OWNER: 'owner',
  ORGANIZER: 'organizer',
  VOLUNTEER: 'volunteer',
  SPONSOR: 'sponsor',
  VIEWER: 'viewer',
};

export const EVENT_ROLE_LABELS = {
  [EVENT_ROLES.OWNER]: 'Owner',
  [EVENT_ROLES.ORGANIZER]: 'Organizer',
  [EVENT_ROLES.VOLUNTEER]: 'Volunteer',
  [EVENT_ROLES.SPONSOR]: 'Sponsor',
  [EVENT_ROLES.VIEWER]: 'Viewer',
};

// ========== PERMISSIONS ==========

export const PERMISSIONS = {
  // Event Permissions
  EVENT_VIEW: 'event:view',
  EVENT_EDIT: 'event:edit',
  EVENT_DELETE: 'event:delete',
  EVENT_SHARE: 'event:share',

  // Collaborator Permissions
  COLLABORATOR_ADD: 'collaborator:add',
  COLLABORATOR_REMOVE: 'collaborator:remove',
  COLLABORATOR_EDIT: 'collaborator:edit',

  // Volunteer Permissions
  VOLUNTEER_VIEW: 'volunteer:view',
  VOLUNTEER_MANAGE: 'volunteer:manage',
  VOLUNTEER_ASSIGN: 'volunteer:assign',

  // Schedule Permissions
  SCHEDULE_VIEW: 'schedule:view',
  SCHEDULE_EDIT: 'schedule:edit',

  // Order Permissions
  ORDER_VIEW: 'order:view',
  ORDER_MANAGE: 'order:manage',

  // Ticket Permissions
  TICKET_VIEW: 'ticket:view',
  TICKET_MANAGE: 'ticket:manage',

  // Sponsor Permissions
  SPONSOR_VIEW: 'sponsor:view',
  SPONSOR_MANAGE: 'sponsor:manage',
};

// ========== ROLE PERMISSIONS MAPPING ==========

export const ROLE_PERMISSIONS = {
  // Admin has all permissions
  [USER_ROLES.ADMIN]: Object.values(PERMISSIONS),

  // Organizer permissions
  [USER_ROLES.ORGANIZER]: [
    PERMISSIONS.EVENT_VIEW,
    PERMISSIONS.EVENT_EDIT,
    PERMISSIONS.EVENT_DELETE,
    PERMISSIONS.EVENT_SHARE,
    PERMISSIONS.COLLABORATOR_ADD,
    PERMISSIONS.COLLABORATOR_REMOVE,
    PERMISSIONS.COLLABORATOR_EDIT,
    PERMISSIONS.VOLUNTEER_VIEW,
    PERMISSIONS.VOLUNTEER_MANAGE,
    PERMISSIONS.VOLUNTEER_ASSIGN,
    PERMISSIONS.SCHEDULE_VIEW,
    PERMISSIONS.SCHEDULE_EDIT,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_MANAGE,
    PERMISSIONS.TICKET_VIEW,
    PERMISSIONS.TICKET_MANAGE,
    PERMISSIONS.SPONSOR_VIEW,
    PERMISSIONS.SPONSOR_MANAGE,
  ],

  // Volunteer permissions
  [USER_ROLES.VOLUNTEER]: [
    PERMISSIONS.EVENT_VIEW,
    PERMISSIONS.VOLUNTEER_VIEW,
    PERMISSIONS.SCHEDULE_VIEW,
    PERMISSIONS.ORDER_VIEW,
  ],

  // Sponsor permissions
  [USER_ROLES.SPONSOR]: [
    PERMISSIONS.EVENT_VIEW,
    PERMISSIONS.SCHEDULE_VIEW,
    PERMISSIONS.SPONSOR_VIEW,
    PERMISSIONS.SPONSOR_MANAGE,
  ],

  // Attendee permissions
  [USER_ROLES.ATTENDEE]: [
    PERMISSIONS.EVENT_VIEW,
    PERMISSIONS.SCHEDULE_VIEW,
    PERMISSIONS.TICKET_VIEW,
  ],
};

// ========== EVENT ROLE PERMISSIONS ==========

export const EVENT_ROLE_PERMISSIONS = {
  // Event Owner (creator) - full access
  [EVENT_ROLES.OWNER]: [
    PERMISSIONS.EVENT_VIEW,
    PERMISSIONS.EVENT_EDIT,
    PERMISSIONS.EVENT_DELETE,
    PERMISSIONS.EVENT_SHARE,
    PERMISSIONS.COLLABORATOR_ADD,
    PERMISSIONS.COLLABORATOR_REMOVE,
    PERMISSIONS.COLLABORATOR_EDIT,
    PERMISSIONS.VOLUNTEER_VIEW,
    PERMISSIONS.VOLUNTEER_MANAGE,
    PERMISSIONS.VOLUNTEER_ASSIGN,
    PERMISSIONS.SCHEDULE_VIEW,
    PERMISSIONS.SCHEDULE_EDIT,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_MANAGE,
    PERMISSIONS.TICKET_VIEW,
    PERMISSIONS.TICKET_MANAGE,
    PERMISSIONS.SPONSOR_VIEW,
    PERMISSIONS.SPONSOR_MANAGE,
  ],

  // Event Organizer - can manage most aspects
  [EVENT_ROLES.ORGANIZER]: [
    PERMISSIONS.EVENT_VIEW,
    PERMISSIONS.EVENT_EDIT,
    PERMISSIONS.COLLABORATOR_ADD,
    PERMISSIONS.COLLABORATOR_REMOVE,
    PERMISSIONS.COLLABORATOR_EDIT,
    PERMISSIONS.VOLUNTEER_VIEW,
    PERMISSIONS.VOLUNTEER_MANAGE,
    PERMISSIONS.VOLUNTEER_ASSIGN,
    PERMISSIONS.SCHEDULE_VIEW,
    PERMISSIONS.SCHEDULE_EDIT,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_MANAGE,
    PERMISSIONS.TICKET_VIEW,
    PERMISSIONS.TICKET_MANAGE,
  ],

  // Event Volunteer - view and manage assigned tasks
  [EVENT_ROLES.VOLUNTEER]: [
    PERMISSIONS.EVENT_VIEW,
    PERMISSIONS.VOLUNTEER_VIEW,
    PERMISSIONS.SCHEDULE_VIEW,
  ],

  // Event Sponsor - view event details
  [EVENT_ROLES.SPONSOR]: [
    PERMISSIONS.EVENT_VIEW,
    PERMISSIONS.SCHEDULE_VIEW,
    PERMISSIONS.SPONSOR_VIEW,
  ],

  // Event Viewer - read-only access
  [EVENT_ROLES.VIEWER]: [
    PERMISSIONS.EVENT_VIEW,
    PERMISSIONS.SCHEDULE_VIEW,
  ],
};

// ========== EVENT VISIBILITY ==========

export const EVENT_VISIBILITY = {
  PRIVATE: 'private',       // Only owner and collaborators
  ORGANIZATION: 'organization', // Organization members
  PUBLIC: 'public',         // Anyone can view
};

export const VISIBILITY_LABELS = {
  [EVENT_VISIBILITY.PRIVATE]: 'Private',
  [EVENT_VISIBILITY.ORGANIZATION]: 'Organization',
  [EVENT_VISIBILITY.PUBLIC]: 'Public',
};

export const VISIBILITY_DESCRIPTIONS = {
  [EVENT_VISIBILITY.PRIVATE]: 'Only you and invited collaborators can view',
  [EVENT_VISIBILITY.ORGANIZATION]: 'All organization members can view',
  [EVENT_VISIBILITY.PUBLIC]: 'Anyone can view this event',
};

// ========== HELPER FUNCTIONS ==========

/**
 * Check if a user role has a specific permission
 * @param {string} userRole - User role
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

/**
 * Check if an event role has a specific permission
 * @param {string} eventRole - Event role
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const hasEventPermission = (eventRole, permission) => {
  if (!eventRole || !permission) return false;
  const rolePermissions = EVENT_ROLE_PERMISSIONS[eventRole] || [];
  return rolePermissions.includes(permission);
};

/**
 * Get all permissions for a user role
 * @param {string} userRole - User role
 * @returns {Array<string>}
 */
export const getUserPermissions = (userRole) => {
  return ROLE_PERMISSIONS[userRole] || [];
};

/**
 * Get all permissions for an event role
 * @param {string} eventRole - Event role
 * @returns {Array<string>}
 */
export const getEventPermissions = (eventRole) => {
  return EVENT_ROLE_PERMISSIONS[eventRole] || [];
};

/**
 * Check if user is admin
 * @param {string} userRole - User role
 * @returns {boolean}
 */
export const isAdmin = (userRole) => {
  return userRole === USER_ROLES.ADMIN;
};

/**
 * Check if user is organizer
 * @param {string} userRole - User role
 * @returns {boolean}
 */
export const isOrganizer = (userRole) => {
  return userRole === USER_ROLES.ORGANIZER || userRole === USER_ROLES.ADMIN;
};

/**
 * Get role badge color
 * @param {string} role - User or event role
 * @returns {string} - Material-UI color
 */
export const getRoleColor = (role) => {
  const colors = {
    [USER_ROLES.ADMIN]: 'error',
    [USER_ROLES.ORGANIZER]: 'primary',
    [USER_ROLES.VOLUNTEER]: 'success',
    [USER_ROLES.SPONSOR]: 'secondary',
    [USER_ROLES.ATTENDEE]: 'default',
    [EVENT_ROLES.OWNER]: 'error',
    [EVENT_ROLES.ORGANIZER]: 'primary',
    [EVENT_ROLES.VOLUNTEER]: 'success',
    [EVENT_ROLES.SPONSOR]: 'secondary',
    [EVENT_ROLES.VIEWER]: 'default',
  };
  return colors[role] || 'default';
};

/**
 * Get default user role for new users
 * @returns {string}
 */
export const getDefaultUserRole = () => {
  return USER_ROLES.ATTENDEE;
};

/**
 * Validate if a role is valid
 * @param {string} role - Role to validate
 * @returns {boolean}
 */
export const isValidUserRole = (role) => {
  return Object.values(USER_ROLES).includes(role);
};

/**
 * Validate if an event role is valid
 * @param {string} role - Event role to validate
 * @returns {boolean}
 */
export const isValidEventRole = (role) => {
  return Object.values(EVENT_ROLES).includes(role);
};
