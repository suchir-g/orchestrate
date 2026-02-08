/**
 * Enhanced Event Collaboration Component
 * Thread-based messaging with recipient selection
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Badge,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import {
  Send as SendIcon,
  CheckCircle as ResolveIcon,
  Replay as ReopenIcon,
  Message as MessageIcon,
  Close as CloseIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getUserEventRole } from '../../services/accessControlService';
import { getEventTeamMembers } from '../../services/userProfileService';
import {
  createMessageThread,
  sendThreadMessage,
  getEventThreads,
  listenToEventThreads,
  listenToThreadMessages,
  markThreadAsRead,
  resolveThread,
  reopenThread,
  THREAD_STATUS,
  RECIPIENT_TYPES,
} from '../../services/enhancedMessagingService';
import { EVENT_ROLES, EVENT_ROLE_LABELS } from '../../utils/roleConstants';
import { formatDistanceToNow } from 'date-fns';

const EnhancedEventCollaboration = ({ open, onClose, event, initialRecipient = null }) => {
  const { user, userProfile, userRole } = useAuth();
  const [userEventRole, setUserEventRole] = useState(null);
  const [teamMembers, setTeamMembers] = useState({ organizers: [], volunteers: [], sponsors: [] });

  // Thread management
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);

  // New thread/message
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [newThreadSubject, setNewThreadSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');

  // Recipient selection
  const [recipientType, setRecipientType] = useState(RECIPIENT_TYPES.SPECIFIC_USER);
  const [selectedRecipients, setSelectedRecipients] = useState([]);

  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Load user's event role
  useEffect(() => {
    const loadRole = async () => {
      if (!event || !user) return;
      const role = await getUserEventRole(event.id, user.uid, userRole);
      setUserEventRole(role);
    };
    loadRole();
  }, [event, user, userRole]);

  // Load team members
  useEffect(() => {
    const loadTeam = async () => {
      if (!event) return;
      const members = await getEventTeamMembers(event);
      setTeamMembers(members);
    };
    loadTeam();
  }, [event]);

  // Listen to threads for this event in real-time so recipients see new threads immediately
  useEffect(() => {
    if (!event || !user || !open) return;

    const unsubscribe = listenToEventThreads(event.id, user.uid, (data) => {
      setThreads(data || []);
    }, userRole);

    return () => {
      unsubscribe && unsubscribe();
    };
  }, [event, user, open, userRole]);

  // Listen to messages in selected thread
  useEffect(() => {
    if (!selectedThread || !user) return;

    const unsubscribe = listenToThreadMessages(selectedThread.id, (messages) => {
      setThreadMessages(messages);
    });

    // Mark as read when opening thread
    if (user && user.uid) {
      markThreadAsRead(selectedThread.id, user.uid);
    }

    return () => unsubscribe();
  }, [selectedThread, user]);

  // Set initial recipient if provided
  useEffect(() => {
    if (initialRecipient && open) {
      setIsCreatingThread(true);
      setSelectedRecipients([initialRecipient.id]);
    }
  }, [initialRecipient, open]);

  const handleCreateThread = async () => {
    if (!newThreadSubject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    if (!newMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (recipientType === RECIPIENT_TYPES.SPECIFIC_USER && selectedRecipients.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    setLoading(true);

    // Determine recipients based on type
    let recipients = [];
    let finalRecipientType = recipientType;

    if (recipientType === RECIPIENT_TYPES.SPECIFIC_USER) {
      recipients = selectedRecipients;
    } else if (recipientType === RECIPIENT_TYPES.ALL_ORGANIZERS) {
      recipients = teamMembers.organizers.map(o => o.id);
    } else if (recipientType === RECIPIENT_TYPES.ALL_VOLUNTEERS) {
      recipients = teamMembers.volunteers.map(v => v.id);
    } else if (recipientType === RECIPIENT_TYPES.ALL_ADMINS) {
      recipients = [event.createdBy];
    } else if (recipientType === RECIPIENT_TYPES.ORGANIZER_TEAM) {
      recipients = teamMembers.organizers.map(o => o.id);
    }

    // Create thread
    const { threadId, error: threadError } = await createMessageThread(
      event.id,
      newThreadSubject,
      user.uid,
      userProfile?.displayName || userProfile?.email || 'Unknown',
      userEventRole,
      recipients,
      finalRecipientType
    );

    if (threadError) {
      toast.error(`Failed to create thread: ${threadError}`);
      setLoading(false);
      return;
    }

    // Send first message
    const { error: messageError } = await sendThreadMessage(
      threadId,
      user.uid,
      userProfile?.displayName || userProfile?.email || 'Unknown',
      newMessage
    );

    if (messageError) {
      toast.error(`Failed to send message: ${messageError}`);
    } else {
      toast.success('Thread created!');
      setIsCreatingThread(false);
      setNewThreadSubject('');
      setNewMessage('');
      setSelectedRecipients([]);

      // Reload threads
      const { data } = await getEventThreads(event.id, user.uid, userRole);
      setThreads(data || []);
    }

    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return;

    setLoading(true);
    const { error, message } = await sendThreadMessage(
      selectedThread.id,
      user.uid,
      userProfile?.displayName || userProfile?.email || 'Unknown',
      newMessage
    );

    if (error) {
      toast.error('Failed to send message');
    } else {
      // Optimistically append the message to the conversation so sender sees it immediately
      setThreadMessages(prev => [...prev, message]);
      // Also update thread preview in the thread list
      setThreads(prev => prev.map(t => t.id === selectedThread.id ? { ...t, lastMessageAt: new Date(), unreadCount: { ...(t.unreadCount || {}), [user.uid]: 0 } } : t));
      setNewMessage('');
    }
    setLoading(false);
  };

  const handleResolveThread = async () => {
    if (!selectedThread) return;

    const { error } = await resolveThread(
      selectedThread.id,
      user.uid,
      userProfile?.displayName || 'Unknown'
    );

    if (error) {
      toast.error('Failed to resolve thread');
    } else {
      toast.success('Thread resolved');
      setSelectedThread({ ...selectedThread, status: THREAD_STATUS.RESOLVED });
    }
  };

  const handleReopenThread = async () => {
    if (!selectedThread) return;

    const { error } = await reopenThread(selectedThread.id);

    if (error) {
      toast.error('Failed to reopen thread');
    } else {
      toast.success('Thread reopened');
      setSelectedThread({ ...selectedThread, status: THREAD_STATUS.OPEN });
    }
  };

  const canResolveThread = (thread) => {
    if (!thread) return false;
    return (
      thread.createdBy === user.uid ||
      userEventRole === EVENT_ROLES.ORGANIZER
    );
  };

  const getAvailableRecipients = () => {
    // If no role or viewer: only organizers
    if (!userEventRole || userEventRole === EVENT_ROLES.VIEWER) {
      return teamMembers.organizers;
    }

    // Sponsors: only organizers
    if (userEventRole === EVENT_ROLES.SPONSOR) {
      return teamMembers.organizers;
    }

    // Volunteers: can message organizers and volunteers only
    if (userEventRole === EVENT_ROLES.VOLUNTEER) {
      return [
        ...teamMembers.organizers,
        ...teamMembers.volunteers,
      ].filter(member => member.id !== user.uid);
    }

    // Organizers/owners: can message everyone (including sponsors)
    return [
      ...teamMembers.organizers,
      ...teamMembers.volunteers,
      ...teamMembers.sponsors,
    ].filter(member => member.id !== user.uid); // Exclude self
  };

  const openThreads = threads.filter(t => t.status === THREAD_STATUS.OPEN);
  const resolvedThreads = threads.filter(t => t.status === THREAD_STATUS.RESOLVED);

  if (!event) return null;

  // Show thread list view
  if (!selectedThread && !isCreatingThread) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6">Messages - {event.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                Your role: {EVENT_ROLE_LABELS[userEventRole] || 'Viewer'}
              </Typography>
            </Box>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Open Threads
                  {openThreads.length > 0 && <Chip label={openThreads.length} size="small" />}
                </Box>
              }
            />
            <Tab label={`Resolved (${resolvedThreads.length})`} />
          </Tabs>

          <Button
            variant="contained"
            startIcon={<MessageIcon />}
            onClick={() => setIsCreatingThread(true)}
            fullWidth
            sx={{ mb: 2 }}
          >
            New Message Thread
          </Button>

          <Paper sx={{ maxHeight: 400, overflow: 'auto' }}>
            {(tabValue === 0 ? openThreads : resolvedThreads).length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  {tabValue === 0 ? 'No open threads' : 'No resolved threads'}
                </Typography>
              </Box>
            ) : (
              <List>
                {(tabValue === 0 ? openThreads : resolvedThreads).map((thread) => {
                  const unreadCount = thread.unreadCount?.[user.uid] || 0;
                  return (
                    <ListItem
                      key={thread.id}
                      button
                      onClick={() => setSelectedThread(thread)}
                      divider
                    >
                      <ListItemAvatar>
                        <Badge badgeContent={unreadCount} color="error">
                          <Avatar>
                            <MessageIcon />
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={thread.subject}
                        secondary={
                          <>
                            <Typography variant="caption" component="span">
                              Started by {thread.createdByName}
                            </Typography>
                            {' · '}
                            <Typography variant="caption" component="span">
                              {formatDistanceToNow(thread.lastMessageAt, { addSuffix: true })}
                            </Typography>
                          </>
                        }
                      />
                      {thread.status === THREAD_STATUS.RESOLVED && (
                        <Chip label="Resolved" size="small" color="success" />
                      )}
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Show new thread creation view
  if (isCreatingThread) {
    const availableRecipients = getAvailableRecipients();
    const canMessageVolunteers = ['owner', 'organizer', 'volunteer'].includes(userEventRole);

    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => setIsCreatingThread(false)}>
              <BackIcon />
            </IconButton>
            <Typography>New Message Thread</Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            label="Subject"
            value={newThreadSubject}
            onChange={(e) => setNewThreadSubject(e.target.value)}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Send To</InputLabel>
            <Select
              value={recipientType}
              label="Send To"
              onChange={(e) => {
                setRecipientType(e.target.value);
                setSelectedRecipients([]);
              }}
            >
              <MenuItem value={RECIPIENT_TYPES.SPECIFIC_USER}>Specific Person(s)</MenuItem>
              <MenuItem value={RECIPIENT_TYPES.ALL_ORGANIZERS}>All Organizers</MenuItem>
              {canMessageVolunteers && (
                <MenuItem value={RECIPIENT_TYPES.ALL_VOLUNTEERS}>All Volunteers</MenuItem>
              )}
              <MenuItem value={RECIPIENT_TYPES.ORGANIZER_TEAM}>Organizer Team</MenuItem>
            </Select>
          </FormControl>

          {recipientType === RECIPIENT_TYPES.SPECIFIC_USER && (
            <Paper sx={{ p: 2, mb: 2, maxHeight: 200, overflow: 'auto' }}>
              <Typography variant="subtitle2" gutterBottom>
                Select Recipients:
              </Typography>
              <FormGroup>
                {availableRecipients.map((member) => (
                  <FormControlLabel
                    key={member.id}
                    control={
                      <Checkbox
                        checked={selectedRecipients.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRecipients([...selectedRecipients, member.id]);
                          } else {
                            setSelectedRecipients(selectedRecipients.filter(id => id !== member.id));
                          }
                        }}
                      />
                    }
                    label={`${member.displayName || member.email} (${member.role || 'Member'})`}
                  />
                ))}
              </FormGroup>
            </Paper>
          )}

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setIsCreatingThread(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateThread}
            disabled={loading}
            startIcon={<SendIcon />}
          >
            {loading ? 'Sending...' : 'Create Thread'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Show thread conversation view
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => setSelectedThread(null)}>
              <BackIcon />
            </IconButton>
            <Box>
              <Typography variant="h6">{selectedThread?.subject}</Typography>
              <Typography variant="caption" color="text.secondary">
                Started by {selectedThread?.createdByName}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {selectedThread?.status === THREAD_STATUS.OPEN && canResolveThread(selectedThread) && (
              <Button
                size="small"
                startIcon={<ResolveIcon />}
                onClick={handleResolveThread}
                color="success"
              >
                Resolve
              </Button>
            )}
            {selectedThread?.status === THREAD_STATUS.RESOLVED && canResolveThread(selectedThread) && (
              <Button
                size="small"
                startIcon={<ReopenIcon />}
                onClick={handleReopenThread}
              >
                Reopen
              </Button>
            )}
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Paper sx={{ maxHeight: 400, overflow: 'auto', p: 2, mb: 2, minHeight: 100 }}>
          {threadMessages.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}>
              <MessageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                {selectedThread?.legacy ? 'No messages in this conversation yet' : 'Loading messages...'}
              </Typography>
              {selectedThread?.legacy && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  This is a legacy conversation
                </Typography>
              )}
            </Box>
          ) : (
            <List>
              {threadMessages.map((message) => (
                <ListItem key={message.id} alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar>
                      {message.senderName[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2">{message.senderName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(message.createdAt, { addSuffix: true })}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {message.content}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>

        {selectedThread?.status === THREAD_STATUS.OPEN && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Type your reply..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={loading || !newMessage.trim()}
              startIcon={<SendIcon />}
            >
              Send
            </Button>
          </Box>
        )}

        {selectedThread?.status === THREAD_STATUS.RESOLVED && (
          <Typography variant="body2" color="text.secondary" align="center">
            This thread has been resolved by {selectedThread.resolvedByName}
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedEventCollaboration;
