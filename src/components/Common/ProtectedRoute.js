import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { LockOutlined as LockIcon } from '@mui/icons-material';

/**
 * ProtectedRoute Component
 * Protects routes based on user roles and permissions
 * 
 * @param {React.ReactNode} children - Component to render if authorized
 * @param {string|string[]} requiredRole - Single role or array of roles required
 * @param {string} eventId - Event ID to check permissions for
 * @param {string[]} requiredPermissions - Optional: array of permission strings like ["schedule:read"]
 * @param {React.ReactNode} fallback - Optional: component to show if unauthorized (default: access denied page)
 */
export const ProtectedRoute = ({
  children,
  requiredRole = null,
  eventId = null,
  requiredPermissions = [],
  fallback = null
}) => {
  const { isAuthenticated, userRoles, hasAllPermissions: hasAllPerms } = useAuth();
  const params = useParams();
  // If no explicit eventId prop provided, attempt to read it from route params
  const effectiveEventId = eventId || params.eventId || null;

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If eventId is required but not provided, show error
  if (requiredRole && !effectiveEventId) {
    console.warn('ProtectedRoute: eventId required when checking roles');
    return <UnauthorizedAccess message="Invalid route configuration" />;
  }

  // Check role if specified
  if (requiredRole && effectiveEventId) {
    const userRole = userRoles[effectiveEventId];
    const rolesArray = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    if (!userRole || !rolesArray.includes(Array.isArray(userRole) ? userRole[0] : userRole)) {
      return fallback ? fallback : <UnauthorizedAccess message={`This area requires ${rolesArray.join(' or ')} access`} />;
    }
  }

  // Check specific permissions if provided
  if (requiredPermissions.length > 0 && effectiveEventId) {
    if (!hasAllPerms(effectiveEventId, requiredPermissions)) {
      return fallback ? fallback : <UnauthorizedAccess message="You don't have permission to access this area" />;
    }
  }

  return children;
};

/**
 * UnauthorizedAccess Component
 * Shows when user doesn't have permission to access a resource
 */
const UnauthorizedAccess = ({ message = "You don't have permission to access this area" }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: 3,
        textAlign: 'center'
      }}
    >
      <LockIcon
        sx={{
          fontSize: 80,
          color: 'primary.main',
          marginBottom: 2,
          opacity: 0.7
        }}
      />
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Access Denied
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ marginBottom: 3, maxWidth: 500 }}>
        {message}
      </Typography>
      <Button
        variant="contained"
        color="primary"
        href="/"
      >
        Return to Dashboard
      </Button>
    </Box>
  );
};

/**
 * RequireRole Component
 * Wraps content that should only be visible to certain roles
 * Shows nothing if user doesn't have required role (useful for hiding UI elements)
 */
export const RequireRole = ({
  children,
  role = null,
  eventId = null,
  fallback = null
}) => {
  const { userRoles } = useAuth();

  if (!role || !eventId) {
    return null;
  }

  const userRole = userRoles[eventId];
  const rolesArray = Array.isArray(role) ? role : [role];

  const hasRole = userRole && rolesArray.includes(Array.isArray(userRole) ? userRole[0] : userRole);

  return hasRole ? children : fallback;
};

/**
 * RequirePermission Component
 * Wraps content that requires specific permissions
 * Shows nothing if user doesn't have required permission
 */
export const RequirePermission = ({
  children,
  permission = null,
  eventId = null,
  fallback = null
}) => {
  const { hasPermission } = useAuth();

  if (!permission || !eventId) {
    return null;
  }

  const [resource, action] = permission.split(':');
  const hasAccess = hasPermission(eventId, resource, action);

  return hasAccess ? children : fallback;
};

export default ProtectedRoute;
