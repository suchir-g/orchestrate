/**
 * Event Collaboration Component
 * Messaging/collaboration system for event collaborators
 * Sponsors can request sessions, organizers can approve/reject
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
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
  Alert,
} from '@mui/material';
import {
  Send as SendIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Message as MessageIcon,
  EventNote as SessionIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  sendEventMessage,
  listenToEventMessages,
  updateMessageStatus,
  MESSAGE_TYPES,
  MESSAGE_STATUS,
} from '../../services/eventMessagingService';
import { getUserEventRole } from '../../services/accessControlService';
import { EVENT_ROLES, EVENT_ROLE_LABELS } from '../../utils/roleConstants';
import { formatDistanceToNow } from 'date-fns';

const EventCollaboration = ({ open, onClose, event }) => {
  const { user, userProfile, userRole } = useAuth();
  const [messages, setMessages] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState(MESSAGE_TYPES.COMMENT);
  const [sessionDetails, setSessionDetails] = useState({
    title: '',
    description: '',
    duration: '',
  });
  const [userEventRole, setUserEventRole] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load user's event role
  useEffect(() => {
    const loadRole = async () => {
      if (!event || !user) return;
      const role = await getUserEventRole(event.id, user.uid, userRole);
      setUserEventRole(role);
    };
    loadRole();
  }, [event, user, userRole]);

  // Listen to messages
  useEffect(() => {
    if (!event || !open) return;

    const unsubscribe = listenToEventMessages(event.id, (msgs) => {
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [event, open]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && messageType !== MESSAGE_TYPES.SESSION_REQUEST) {
      toast.error('Please enter a message');
      return;
    }

    if (messageType === MESSAGE_TYPES.SESSION_REQUEST && !sessionDetails.title.trim()) {
      toast.error('Please enter a session title');
      return;
    }

    setLoading(true);

    const metadata = messageType === MESSAGE_TYPES.SESSION_REQUEST
      ? { sessionDetails }
      : null;

    const { error } = await sendEventMessage(
      event.id,
      user.uid,
      userProfile?.displayName || userProfile?.email || 'Unknown User',
      userEventRole,
      messageType,
      newMessage,
      metadata
    );

    if (error) {
      toast.error(`Failed to send message: ${error}`);
    } else {
      toast.success('Message sent!');
      setNewMessage('');
      setSessionDetails({ title: '', description: '', duration: '' });
      setMessageType(MESSAGE_TYPES.COMMENT);
    }

    setLoading(false);
  };

  const handleApprove = async (messageId, sessionData) => {
    const { error } = await updateMessageStatus(
      messageId,
      MESSAGE_STATUS.APPROVED,
      user.uid,
      userProfile?.displayName || 'Organizer',
      'Session request approved'
    );

    if (error) {
      toast.error('Failed to approve request');
    } else {
      toast.success('Session request approved! You can now add it to the schedule.');
      // TODO: Optionally auto-create schedule block with session details
    }
  };

  const handleReject = async (messageId) => {
    const { error } = await updateMessageStatus(
      messageId,
      MESSAGE_STATUS.REJECTED,
      user.uid,
      userProfile?.displayName || 'Organizer',
      'Session request rejected'
    );

    if (error) {
      toast.error('Failed to reject request');
    } else {
      toast.success('Session request rejected');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case MESSAGE_STATUS.PENDING: return 'warning';
      case MESSAGE_STATUS.APPROVED: return 'success';
      case MESSAGE_STATUS.REJECTED: return 'error';
      case MESSAGE_STATUS.RESOLVED: return 'info';
      default: return 'default';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case MESSAGE_TYPES.SESSION_REQUEST: return <SessionIcon />;
      case MESSAGE_TYPES.COMMENT: return <MessageIcon />;
      default: return <MessageIcon />;
    }
  };

  const canApproveRequests = userEventRole === EVENT_ROLES.ORGANIZER;

  const allMessages = messages;
  const pendingRequests = messages.filter(
    m => m.messageType === MESSAGE_TYPES.SESSION_REQUEST && m.status === MESSAGE_STATUS.PENDING
  );

  if (!event) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MessageIcon />
          Event Collaboration - {event.name}
        </Box>
        <Typography variant="body2" color="text.secondary">
          Your role: <Chip label={EVENT_ROLE_LABELS[userEventRole] || 'Viewer'} size="small" sx={{ ml: 1 }} />
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
          <Tab label={`All Messages (${allMessages.length})`} />
          {canApproveRequests && (
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Pending Requests
                  {pendingRequests.length > 0 && (
                    <Chip label={pendingRequests.length} size="small" color="warning" />
                  )}
                </Box>
              }
            />
          )}
        </Tabs>

        {/* Messages List */}
        <Paper sx={{ maxHeight: 400, overflow: 'auto', mb: 3, p: 2 }}>
          {(tabValue === 0 ? allMessages : pendingRequests).length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              {tabValue === 0 ? 'No messages yet. Start a conversation!' : 'No pending requests'}
            </Typography>
          ) : (
            <List>
              {(tabValue === 0 ? allMessages : pendingRequests).map((message, index) => (
                <React.Fragment key={message.id}>
                  <ListItem alignItems="flex-start" sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {getTypeIcon(message.messageType)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {message.userName}
                            <Chip
                              label={EVENT_ROLE_LABELS[message.userRole] || message.userRole}
                              size="small"
                              sx={{ ml: 1, fontSize: '0.7rem' }}
                            />
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(message.createdAt, { addSuffix: true })}
                          </Typography>
                        </Box>
                      </Box>
                      {message.status && (
                        <Chip label={message.status} color={getStatusColor(message.status)} size="small" />
                      )}
                    </Box>

                    <Paper sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                      {message.messageType === MESSAGE_TYPES.SESSION_REQUEST && message.metadata?.sessionDetails && (
                        <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(0, 212, 255, 0.1)', borderRadius: 1 }}>
                          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <SessionIcon fontSize="small" />
                            Session Request
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {message.metadata.sessionDetails.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {message.metadata.sessionDetails.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Duration: {message.metadata.sessionDetails.duration || 'Not specified'}
                          </Typography>
                        </Box>
                      )}

                      <Typography variant="body2">{message.content}</Typography>

                      {canApproveRequests && message.status === MESSAGE_STATUS.PENDING && (
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<ApproveIcon />}
                            onClick={() => handleApprove(message.id, message.metadata?.sessionDetails)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<RejectIcon />}
                            onClick={() => handleReject(message.id)}
                          >
                            Reject
                          </Button>
                        </Box>
                      )}
                    </Paper>
                  </ListItem>
                  {index < (tabValue === 0 ? allMessages : pendingRequests).length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>

        {/* New Message Form */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Send Message
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Message Type</InputLabel>
            <Select
              value={messageType}
              label="Message Type"
              onChange={(e) => setMessageType(e.target.value)}
            >
              <MenuItem value={MESSAGE_TYPES.COMMENT}>Comment / Discussion</MenuItem>
              <MenuItem value={MESSAGE_TYPES.SESSION_REQUEST}>Request Session (Sponsors)</MenuItem>
              <MenuItem value={MESSAGE_TYPES.QUESTION}>Question</MenuItem>
            </Select>
          </FormControl>

          {messageType === MESSAGE_TYPES.SESSION_REQUEST && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(0, 212, 255, 0.1)', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Session Details
              </Typography>
              <TextField
                fullWidth
                label="Session Title"
                value={sessionDetails.title}
                onChange={(e) => setSessionDetails({ ...sessionDetails, title: e.target.value })}
                sx={{ mb: 1 }}
                size="small"
              />
              <TextField
                fullWidth
                label="Session Description"
                value={sessionDetails.description}
                onChange={(e) => setSessionDetails({ ...sessionDetails, description: e.target.value })}
                multiline
                rows={2}
                sx={{ mb: 1 }}
                size="small"
              />
              <TextField
                fullWidth
                label="Duration (e.g., 60 minutes)"
                value={sessionDetails.duration}
                onChange={(e) => setSessionDetails({ ...sessionDetails, duration: e.target.value })}
                size="small"
              />
            </Box>
          )}

          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSendMessage}
            disabled={loading}
            fullWidth
          >
            {loading ? 'Sending...' : 'Send Message'}
          </Button>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventCollaboration;
