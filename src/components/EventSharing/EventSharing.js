/**
 * Event Sharing Component
 * Allows event owners/organizers to manage collaborators and access control
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Box,
  Typography,
  Alert,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  PersonAdd as AddIcon,
  Visibility as VisibilityIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  Business as OrgIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import {
  addEventCollaborator,
  removeEventCollaborator,
  getEventCollaborators,
  updateEventVisibility,
  generateEventInviteLink,
  canManageCollaborators,
} from '../../services/accessControlService';
import { getAccountByEmail } from '../../services/accountService';
import {
  EVENT_ROLES,
  EVENT_ROLE_LABELS,
  EVENT_VISIBILITY,
  VISIBILITY_LABELS,
  VISIBILITY_DESCRIPTIONS,
  getRoleColor,
} from '../../utils/roleConstants';
import { useAuth } from '../../context/AuthContext';
import { getUserEventRole } from '../../services/accessControlService';

const EventSharing = ({ open, onClose, event, onUpdate }) => {
  console.log('🔴 EventSharing component rendered! open:', open, 'event:', event?.id, 'event:', event);
  const { user } = useAuth();
  const { userRole } = useAuth();
  const [collaborators, setCollaborators] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState(EVENT_ROLES.VIEWER);
  const [visibility, setVisibility] = useState(event?.visibility || EVENT_VISIBILITY.PRIVATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadCollaborators = useCallback(async () => {
    if (!event) return;

    const { data, error } = await getEventCollaborators(event.id);
    if (error) {
      console.error('Error loading collaborators:', error);
      toast.error('Failed to load collaborators');
    } else {
      setCollaborators(data || []);
    }
  }, [event]);

  // Load collaborators
  useEffect(() => {
    if (open && event) {
      loadCollaborators();
      setVisibility(event.visibility || EVENT_VISIBILITY.PRIVATE);
    }
  }, [open, event, loadCollaborators]);

  // Load user's event role to determine permissions (owner/organizer/admin)
  const [userEventRole, setUserEventRole] = useState(null);
  useEffect(() => {
    const loadRole = async () => {
      if (!event || !user) return;
      const role = await getUserEventRole(event.id, user.uid, userRole);
      setUserEventRole(role);
    };
    loadRole();
  }, [event, user, userRole]);

  // Centralized collaborator management permission
  const [canManage, setCanManage] = useState(false);
  useEffect(() => {
    const loadCanManage = async () => {
      if (!event || !user) {
        console.log('EventSharing: Missing event or user', { hasEvent: !!event, hasUser: !!user });
        setCanManage(false);
        return;
      }
      
      // Event creator should always be able to manage collaborators
      const isCreator = event.createdBy === user.uid;
      console.log('EventSharing: Permission check', {
        eventCreatedBy: event.createdBy,
        userId: user.uid,
        isCreator,
        eventId: event.id,
      });
      
      if (isCreator) {
        console.log('EventSharing: User is event creator - allowing management');
        setCanManage(true);
        return;
      }

      const allowed = await canManageCollaborators(event.id, user.uid, userRole);
      console.log('EventSharing: Permission check via service', { allowed });
      setCanManage(Boolean(allowed));
    };

    loadCanManage();
  }, [event, user, userRole]);

  useEffect(() => {
    console.log('EventSharing: canManage state changed to:', canManage);
  }, [canManage]);

  const handleAddCollaborator = async () => {
    if (!newUserEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Look up user by email in the accounts collection
      const account = await getAccountByEmail(newUserEmail.trim());
      
      if (!account) {
        setError('User not found. Make sure they have an account in the system.');
        toast.error('User not found. Make sure they have an account in the system.');
        setLoading(false);
        return;
      }

      const userId = account.userId;
      console.log('EventSharing: Found user by email:', { email: newUserEmail, userId });

      const result = await addEventCollaborator(event.id, userId, newUserRole);

      if (result.error) {
        setError(result.error);
        toast.error(`Failed to add collaborator: ${result.error}`);
      } else {
        toast.success(`Added ${newUserEmail} as ${EVENT_ROLE_LABELS[newUserRole]}`);
        setNewUserEmail('');
        setNewUserRole(EVENT_ROLES.VIEWER);
        loadCollaborators();
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error('Error adding collaborator:', err);
      setError(err.message);
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCollaborator = async (collaborator) => {
    if (!window.confirm(`Remove ${collaborator.userId} from this event?`)) {
      return;
    }

    const result = await removeEventCollaborator(event.id, collaborator.userId);

    if (result.error) {
      toast.error(`Failed to remove collaborator: ${result.error}`);
    } else {
      toast.success('Collaborator removed');
      loadCollaborators();
      if (onUpdate) onUpdate();
    }
  };

  const handleVisibilityChange = async (newVisibility) => {
    const result = await updateEventVisibility(event.id, newVisibility);

    if (result.error) {
      toast.error(`Failed to update visibility: ${result.error}`);
    } else {
      setVisibility(newVisibility);
      toast.success('Event visibility updated');
      if (onUpdate) onUpdate();
    }
  };

  const handleCopyInviteLink = (role) => {
    const inviteLink = generateEventInviteLink(event.id, role);
    navigator.clipboard.writeText(inviteLink);
    toast.success(`Invite link copied! Valid for 7 days.`);
  };

  const getVisibilityIcon = (vis) => {
    switch (vis) {
      case EVENT_VISIBILITY.PUBLIC:
        return <PublicIcon />;
      case EVENT_VISIBILITY.ORGANIZATION:
        return <OrgIcon />;
      default:
        return <LockIcon />;
    }
  };

  if (!event) {
    console.log('EventSharing: event is null, returning nothing');
    return null;
  }

  console.log('EventSharing: Rendering dialog with event:', event.id, 'createdBy:', event.createdBy, 'user.uid:', user?.uid);

  const isOwner = event.createdBy === user?.uid;

  console.log('🔴 EventSharing RENDERING! open:', open, 'isOwner:', isOwner, 'canManage:', canManage);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ backgroundColor: '#ff0000', color: 'white' }}>
        🔴 DIALOG IS OPEN - Share "{event.name}"
      </DialogTitle>

      <DialogContent sx={{ backgroundColor: '#ffeb3b' }}>
        {/* DEBUG: Show current state */}
        <Box sx={{ p: 2, bgcolor: '#f0f0f0', mb: 2, borderRadius: 1, border: '3px solid red' }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            [DEBUG] canManage: {String(canManage)} | isOwner: {String(isOwner)} | event.createdBy: {event.createdBy} | user.uid: {user?.uid}
          </Typography>
        </Box>

        {/* Visibility Settings */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VisibilityIcon /> Event Visibility
          </Typography>
          <FormControl fullWidth>
            <Select
              value={visibility}
              onChange={(e) => handleVisibilityChange(e.target.value)}
              disabled={!isOwner}
              startAdornment={getVisibilityIcon(visibility)}
            >
              {Object.values(EVENT_VISIBILITY).map((vis) => (
                <MenuItem key={vis} value={vis}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getVisibilityIcon(vis)}
                    <Box>
                      <Typography>{VISIBILITY_LABELS[vis]}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {VISIBILITY_DESCRIPTIONS[vis]}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Add Collaborator */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon /> Add Collaborator
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Email Address"
              placeholder="colleague@example.com"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              disabled={loading || !canManage}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={newUserRole}
                label="Role"
                onChange={(e) => setNewUserRole(e.target.value)}
                disabled={loading || !canManage}
              >
                <MenuItem value={EVENT_ROLES.ORGANIZER}>{EVENT_ROLE_LABELS[EVENT_ROLES.ORGANIZER]}</MenuItem>
                <MenuItem value={EVENT_ROLES.VOLUNTEER}>{EVENT_ROLE_LABELS[EVENT_ROLES.VOLUNTEER]}</MenuItem>
                <MenuItem value={EVENT_ROLES.SPONSOR}>{EVENT_ROLE_LABELS[EVENT_ROLES.SPONSOR]}</MenuItem>
                <MenuItem value={EVENT_ROLES.VIEWER}>{EVENT_ROLE_LABELS[EVENT_ROLES.VIEWER]}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {console.log('EventSharing: Add Collaborator section - canManage:', canManage, 'loading:', loading, 'button should be', canManage ? 'ENABLED' : 'DISABLED')}

        <Box sx={{ p: 2, bgcolor: '#fff3e0', mb: 2, borderRadius: 1, border: '2px solid red' }}>
          <Typography variant="caption">
            [BUTTON DEBUG] canManage={String(canManage)} loading={String(loading)} email.trim()={String(!!newUserEmail.trim())} disabled={String(loading || !canManage || !newUserEmail.trim())}
          </Typography>
        </Box>

        <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddCollaborator}
            disabled={loading || !canManage || !newUserEmail.trim()}
            fullWidth
            sx={{ backgroundColor: 'red' }}
          >
            Add Collaborator [SHOULD BE VISIBLE]
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Invite Links */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            📎 Quick Invite Links
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Share these links to instantly add people to your event. Links expire in 7 days.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {[EVENT_ROLES.ORGANIZER, EVENT_ROLES.VOLUNTEER, EVENT_ROLES.SPONSOR].map((role) => (
              <Tooltip key={role} title={`Copy invite link for ${EVENT_ROLE_LABELS[role]}`}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<CopyIcon />}
                  onClick={() => handleCopyInviteLink(role)}
                  disabled={!canManage}
                >
                  {EVENT_ROLE_LABELS[role]} Link
                </Button>
              </Tooltip>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Collaborators List */}
        <Box>
          <Typography variant="h6" gutterBottom>
            👥 Collaborators ({collaborators.length})
          </Typography>

          {collaborators.length === 0 ? (
            <Alert severity="info">
              No collaborators yet. Add people above to start collaborating!
            </Alert>
          ) : (
            <List>
              {collaborators.map((collaborator, index) => (
                <ListItem key={index} divider={index < collaborators.length - 1}>
                  <ListItemText
                    primary={collaborator.userId}
                    secondary={`Added ${new Date(collaborator.addedAt).toLocaleDateString()}`}
                  />
                  <Chip
                    label={EVENT_ROLE_LABELS[collaborator.role]}
                    color={getRoleColor(collaborator.role)}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  {canManage && (
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveCollaborator(collaborator)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventSharing;
