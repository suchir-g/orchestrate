/**
 * Role Selector Component
 * Displays and allows updating user role
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Event as OrganizerIcon,
  VolunteerActivism as VolunteerIcon,
  CardGiftcard as SponsorIcon,
  Person as AttendeeIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  USER_ROLES,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  getRoleColor,
  isAdmin,
  getUserPermissions,
  PERMISSIONS,
} from '../../utils/roleConstants';

const RoleSelector = () => {
  const { userRole, updateUserRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState(userRole || USER_ROLES.ATTENDEE);
  const [loading, setLoading] = useState(false);

  const handleRoleChange = async () => {
    if (selectedRole === userRole) {
      toast.error('Role is already set to this value');
      return;
    }

    setLoading(true);
    const result = await updateUserRole(selectedRole);
    setLoading(false);

    if (!result.error) {
      toast.success('Role updated successfully!');
    }
  };

  const getRoleIcon = (role) => {
    const icons = {
      [USER_ROLES.ADMIN]: <AdminIcon />,
      [USER_ROLES.ORGANIZER]: <OrganizerIcon />,
      [USER_ROLES.VOLUNTEER]: <VolunteerIcon />,
      [USER_ROLES.SPONSOR]: <SponsorIcon />,
      [USER_ROLES.ATTENDEE]: <AttendeeIcon />,
    };
    return icons[role] || <AttendeeIcon />;
  };

  const currentPermissions = getUserPermissions(userRole);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getRoleIcon(userRole)}
          Your Role
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Chip
            label={ROLE_LABELS[userRole]}
            color={getRoleColor(userRole)}
            icon={getRoleIcon(userRole)}
            sx={{ mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary">
            {ROLE_DESCRIPTIONS[userRole]}
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Contact an administrator to change your role. For demo purposes, you can change your role below.
        </Alert>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Change Role</InputLabel>
          <Select
            value={selectedRole}
            label="Change Role"
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={loading}
          >
            {Object.values(USER_ROLES).map((role) => (
              <MenuItem key={role} value={role}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getRoleIcon(role)}
                  {ROLE_LABELS[role]}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          fullWidth
          onClick={handleRoleChange}
          disabled={loading || selectedRole === userRole}
        >
          {loading ? 'Updating...' : 'Update Role'}
        </Button>

        <Divider sx={{ my: 3 }} />

        {/* Permissions Display */}
        <Typography variant="h6" gutterBottom>
          Your Permissions
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Based on your current role, you have access to:
        </Typography>

        <List dense>
          {currentPermissions.slice(0, 8).map((permission) => (
            <ListItem key={permission}>
              <ListItemIcon>
                <CheckIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={permission.split(':')[1].replace(/([A-Z])/g, ' $1').trim()}
                secondary={`Permission: ${permission}`}
                primaryTypographyProps={{ variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
          ))}
          {currentPermissions.length > 8 && (
            <ListItem>
              <ListItemText
                primary={`+ ${currentPermissions.length - 8} more permissions`}
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
              />
            </ListItem>
          )}
          {currentPermissions.length === 0 && (
            <ListItem>
              <ListItemText
                primary="No special permissions"
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
              />
            </ListItem>
          )}
        </List>

        {isAdmin(userRole) && (
          <Alert severity="success" sx={{ mt: 2 }}>
            🎉 You have administrator access with full permissions!
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default RoleSelector;
