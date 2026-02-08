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
  getUserEventRole,
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

const ACCENT = '#00d4ff';
const BG_DARK = '#1f1f1f';
const BG_PANEL = '#262626';
const BG_HEADER = '#2a2a2a';
const BORDER_SUBTLE = '#333';

const EventSharing = ({ open, onClose, event, onUpdate }) => {
  const { user, userRole } = useAuth();

  const [collaborators, setCollaborators] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState(EVENT_ROLES.VIEWER);
  const [visibility, setVisibility] = useState(event?.visibility || EVENT_VISIBILITY.PRIVATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [canManage, setCanManage] = useState(false);

  const loadCollaborators = useCallback(async () => {
    if (!event) return;
    const { data, error } = await getEventCollaborators(event.id);
    if (error) {
      toast.error('Failed to load collaborators');
    } else {
      setCollaborators(data || []);
    }
  }, [event]);

  useEffect(() => {
    if (open && event) {
      loadCollaborators();
      setVisibility(event.visibility || EVENT_VISIBILITY.PRIVATE);
    }
  }, [open, event, loadCollaborators]);

  useEffect(() => {
    const loadPermissions = async () => {
      if (!event || !user) return;
      if (event.createdBy === user.uid) {
        setCanManage(true);
        return;
      }
      const allowed = await canManageCollaborators(event.id, user.uid, userRole);
      setCanManage(Boolean(allowed));
    };
    loadPermissions();
  }, [event, user, userRole]);

  const handleAddCollaborator = async () => {
    if (!newUserEmail.trim()) return toast.error('Please enter an email address');

    setLoading(true);
    setError(null);

    try {
      const account = await getAccountByEmail(newUserEmail.trim());
      if (!account) {
        setError('User not found.');
        toast.error('User not found.');
        return;
      }

      const result = await addEventCollaborator(event.id, account.userId, newUserRole);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success(`Added ${newUserEmail}`);
        setNewUserEmail('');
        setNewUserRole(EVENT_ROLES.VIEWER);
        loadCollaborators();
        onUpdate?.();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCollaborator = async (collaborator) => {
    if (!window.confirm('Remove this collaborator?')) return;
    const result = await removeEventCollaborator(event.id, collaborator.userId);
    if (result?.error) toast.error(result.error);
    else {
      toast.success('Collaborator removed');
      loadCollaborators();
      onUpdate?.();
    }
  };

  const handleVisibilityChange = async (newVisibility) => {
    const result = await updateEventVisibility(event.id, newVisibility);
    if (result?.error) toast.error(result.error);
    else {
      setVisibility(newVisibility);
      toast.success('Visibility updated');
      onUpdate?.();
    }
  };

  const handleCopyInviteLink = (role) => {
    navigator.clipboard.writeText(generateEventInviteLink(event.id, role));
    toast.success('Invite link copied (valid 7 days)');
  };

  if (!event) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(180deg, ${BG_HEADER} 0%, ${BG_DARK} 100%)`,
          color: '#eaeaea',
          borderRadius: 3,
          boxShadow: '0 25px 70px rgba(0,0,0,0.7)',
        },
      }}
    >
      <DialogTitle
        sx={{
          background: BG_HEADER,
          fontWeight: 600,
          letterSpacing: 0.5,
        }}
      >
        Share “{event.name}”
      </DialogTitle>

      <DialogContent sx={{ backgroundColor: BG_DARK }}>
        {/* Add collaborator */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <AddIcon sx={{ color: ACCENT }} />
            Add Collaborator
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Email address"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              disabled={!canManage || loading}
              sx={{
                '& .MuiInputBase-root': { backgroundColor: BG_PANEL },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER_SUBTLE },
              }}
            />

            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={newUserRole}
                label="Role"
                onChange={(e) => setNewUserRole(e.target.value)}
                disabled={!canManage || loading}
                sx={{
                  backgroundColor: BG_PANEL,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER_SUBTLE },
                }}
              >
                {Object.values(EVENT_ROLES).map((role) => (
                  <MenuItem key={role} value={role}>
                    {EVENT_ROLE_LABELS[role]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Button
            fullWidth
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddCollaborator}
            disabled={!canManage || loading || !newUserEmail.trim()}
            sx={{
              backgroundColor: ACCENT,
              color: '#000',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#00b8e6' },
            }}
          >
            Add Collaborator
          </Button>
        </Box>

        <Divider sx={{ borderColor: BORDER_SUBTLE, my: 4 }} />

        {/* Invite links */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            📎 Quick Invite Links
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {[EVENT_ROLES.ORGANIZER, EVENT_ROLES.VOLUNTEER, EVENT_ROLES.SPONSOR].map((role) => (
              <Tooltip key={role} title={`Copy ${EVENT_ROLE_LABELS[role]} link`}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<CopyIcon />}
                  onClick={() => handleCopyInviteLink(role)}
                  disabled={!canManage}
                  sx={{
                    color: ACCENT,
                    borderColor: ACCENT,
                    '&:hover': {
                      backgroundColor: 'rgba(0,212,255,0.08)',
                    },
                  }}
                >
                  {EVENT_ROLE_LABELS[role]}
                </Button>
              </Tooltip>
            ))}
          </Box>
        </Box>

        <Divider sx={{ borderColor: BORDER_SUBTLE, my: 4 }} />

        {/* Collaborators list */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            👥 Collaborators ({collaborators.length})
          </Typography>

          {collaborators.length === 0 ? (
            <Alert severity="info">No collaborators yet.</Alert>
          ) : (
            <List>
              {collaborators.map((c, i) => (
                <ListItem
                  key={i}
                  sx={{
                    backgroundColor: BG_PANEL,
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <ListItemText
                    primary={c.userId}
                    secondary={`Added ${new Date(c.addedAt).toLocaleDateString()}`}
                  />
                  <Chip
                    label={EVENT_ROLE_LABELS[c.role]}
                    color={getRoleColor(c.role)}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  {canManage && (
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => handleRemoveCollaborator(c)} color="error">
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

      <DialogActions sx={{ backgroundColor: BG_DARK }}>
        <Button onClick={onClose} sx={{ color: ACCENT }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventSharing;
