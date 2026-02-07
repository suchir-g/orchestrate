import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Typography,
  Divider,
  Stack,
  Paper
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useAuth } from '../../../context/AuthContext';
import * as authService from '../../../services/authorizationService';
import toast from 'react-hot-toast';

const RoleManagement = ({ eventId }) => {
  const { user, hasPermission, assignRoleToUser, removeRoleFromUser } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('attendee');
  const [searchTerm, setSearchTerm] = useState('');
  const [openUserForm, setOpenUserForm] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    name: '',
    role: 'attendee'
  });

  const roles = ['admin', 'volunteer', 'sponsor', 'attendee'];

  useEffect(() => {
    if (hasPermission(eventId, 'userManagement', 'read')) {
      loadUsers();
    }
  }, [eventId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // TODO: Load users from Firestore
      setUsers([]);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !newRole) return;

    try {
      const result = await assignRoleToUser(selectedUser.id, newRole, eventId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Role assigned successfully!`);
        setOpenDialog(false);
        loadUsers();
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      toast.error('Failed to assign role');
    }
  };

  const handleRemoveRole = async (userId, role) => {
    if (!window.confirm(`Remove ${role} role from this user?`)) return;

    try {
      const result = await removeRoleFromUser(userId, role, eventId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Role removed successfully!');
        loadUsers();
      }
    } catch (error) {
      console.error('Error removing role:', error);
      toast.error('Failed to remove role');
    }
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!hasPermission(eventId, 'userManagement', 'read')) {
    return (
      <Alert severity="error">
        You don't have permission to manage user roles.
      </Alert>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      {/* Header */}
      <Box sx={{ marginBottom: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, marginBottom: 1 }}>
          <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          User Role Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage user roles and permissions for this event
        </Typography>
      </Box>

      {/* Controls */}
      <Card sx={{ marginBottom: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
            <TextField
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              size="small"
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenUserForm(true)}
              sx={{ minWidth: 150 }}
            >
              Add User
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader
          title={`Users (${filteredUsers.length})`}
          subheader="Click on a user to manage their roles"
        />
        <Divider />
        <CardContent>
          {loading ? (
            <Typography align="center" color="text.secondary" sx={{ py: 3 }}>
              Loading users...
            </Typography>
          ) : filteredUsers.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#1a1a1a' }}>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Roles</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map(userItem => (
                    <TableRow key={userItem.id}>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {userItem.name || 'Unknown'}
                      </TableCell>
                      <TableCell>{userItem.email}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                          {userItem.roles && userItem.roles.length > 0 ? (
                            userItem.roles.map(role => (
                              <Chip
                                key={role}
                                label={authService.getRoleDisplayName(role)}
                                size="small"
                                onDelete={() => handleRemoveRole(userItem.id, role)}
                                color={role === 'admin' ? 'error' : 'default'}
                              />
                            ))
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              No roles assigned
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedUser(userItem);
                            setOpenDialog(true);
                          }}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography align="center" color="text.secondary" sx={{ py: 3 }}>
              {searchTerm ? 'No users found matching your search' : 'No users yet'}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Assign Role Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Assign Role to {selectedUser?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Email: {selectedUser?.email}
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Select Role</InputLabel>
            <Select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              label="Select Role"
            >
              {roles.map(role => (
                <MenuItem key={role} value={role}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {authService.getRoleDisplayName(role)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {getRoleDescription(role)}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAssignRole}>
            Assign Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={openUserForm} onClose={() => setOpenUserForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New User</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              value={newUserData.email}
              onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Name"
              value={newUserData.name}
              onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Initial Role</InputLabel>
              <Select
                value={newUserData.role}
                onChange={(e) => setNewUserData(prev => ({ ...prev, role: e.target.value }))}
                label="Initial Role"
              >
                {roles.map(role => (
                  <MenuItem key={role} value={role}>
                    {authService.getRoleDisplayName(role)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Alert severity="info">
              User will be invited to join via email. They must accept the invitation.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenUserForm(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              // TODO: Implement user invite
              toast.success('User invitation sent!');
              setOpenUserForm(false);
            }}
          >
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const getRoleDescription = (role) => {
  const descriptions = {
    admin: 'Full event management access',
    volunteer: 'Can see schedule and manage own assignments',
    sponsor: 'Can request items and volunteers',
    attendee: 'Can view finalized schedule only'
  };
  return descriptions[role] || '';
};

export default RoleManagement;
