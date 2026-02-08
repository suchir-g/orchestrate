/**
 * Event Sharing Component
 * Allows event owners/organizers to manage collaborators and access control
 */

import React, { useState, useEffect } from 'react';
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
import { USER_ROLES } from '../../utils/roleConstants';

const EventSharing = ({ open, onClose, event, onUpdate }) => {
  const { user } = useAuth();
  const { userRole } = useAuth();
  const [collaborators, setCollaborators] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState(EVENT_ROLES.VIEWER);
  const [visibility, setVisibility] = useState(event?.visibility || EVENT_VISIBILITY.PRIVATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load collaborators
  useEffect(() => {
    if (open && event) {
      loadCollaborators();
      setVisibility(event.visibility || EVENT_VISIBILITY.PRIVATE);
    }
  }, [open, event]);

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
        setCanManage(false);
        return;
      }
      // Event creator should always be able to manage collaborators
      if (event.createdBy === user.uid) {
        setCanManage(true);
        return;
      }

      const allowed = await canManageCollaborators(event.id, user.uid, userRole);
      setCanManage(Boolean(allowed));
    };

    loadCanManage();
  }, [event, user, userRole]);

  const loadCollaborators = async () => {
    if (!event) return;

    const { data, error } = await getEventCollaborators(event.id);
    if (error) {
      console.error('Error loading collaborators:', error);
      toast.error('Failed to load collaborators');
    } else {
      setCollaborators(data || []);
    }
  };

  const handleAddCollaborator = async () => {
    if (!newUserEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    setError(null);

    // TODO: In production, you'd need to look up user by email first
    // For now, we'll use a placeholder userId
    const userId = `user_${newUserEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

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

    setLoading(false);
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

  if (!event) return null;

  const isOwner = event.createdBy === user?.uid;
  const isManager = isOwner || userEventRole === EVENT_ROLES.ORGANIZER || userRole === USER_ROLES.ADMIN;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Share "{event.name}"
      </DialogTitle>

      <DialogContent>
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

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddCollaborator}
            disabled={loading || !canManage || !newUserEmail.trim()}
            fullWidth
          >
            Add Collaborator
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
