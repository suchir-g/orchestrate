/**
 * Protected Route Component
 * Restricts access to routes based on user roles and permissions
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { hasPermission, isAdmin, ROLE_LABELS } from '../../utils/roleConstants';

/**
 * ProtectedRoute - Wraps a component and checks user permissions
 * @param {Object} props
 * @param {React.Component} props.children - Component to render if authorized
 * @param {Array<string>} props.allowedRoles - Array of allowed user roles
 * @param {string} props.requiredPermission - Specific permission required
 * @param {string} props.redirectTo - Path to redirect if unauthorized (default: '/')
 * @param {boolean} props.requireAuth - Require authentication (default: true)
 */
const ProtectedRoute = ({
  children,
  allowedRoles = [],
  requiredPermission = null,
  redirectTo = '/',
  requireAuth = true,
}) => {
  const { isAuthenticated, userRole, loading } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  // Check if authentication is required
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/account" replace />;
  }

  // If no restrictions, render children
  if (!requireAuth && allowedRoles.length === 0 && !requiredPermission) {
    return children;
  }

  // Check if user has required role
  const hasRequiredRole = allowedRoles.length === 0 || allowedRoles.includes(userRole);

  // Check if user has required permission
  const hasRequiredPermission =
    !requiredPermission || isAdmin(userRole) || hasPermission(userRole, requiredPermission);

  // If user doesn't have access, show unauthorized page
  if (!hasRequiredRole || !hasRequiredPermission) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          p: 3,
        }}
      >
        <Paper
          sx={{
            p: 4,
            maxWidth: 500,
            textAlign: 'center',
          }}
        >
          <LockIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            You don't have permission to access this page.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Your role: <strong>{ROLE_LABELS[userRole] || 'Unknown'}</strong>
          </Typography>
          {allowedRoles.length > 0 && (
            <Typography variant="body2" color="text.secondary" paragraph>
              Required roles: {allowedRoles.map((r) => ROLE_LABELS[r]).join(', ')}
            </Typography>
          )}
          <Button variant="contained" href={redirectTo} sx={{ mt: 2 }}>
            Go to Dashboard
          </Button>
        </Paper>
      </Box>
    );
  }

  // User has access, render children
  return children;
};

export default ProtectedRoute;
