/**
 * Message Center Component
 * Central hub for viewing all message threads across events
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  Chip,
  Tabs,
  Tab,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
} from '@mui/material';
import {
  Message as MessageIcon,
  Send as SendIcon,
  CheckCircle as ResolveIcon,
  Replay as ReopenIcon,
  Close as CloseIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useAppState } from '../../context/AppStateContext';
import {
  listenToUserThreads,
  listenToThreadMessages,
  sendThreadMessage,
  markThreadAsRead,
  resolveThread,
  reopenThread,
  THREAD_STATUS,
} from '../../services/enhancedMessagingService';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const MessageCenter = () => {
  const { user, userProfile } = useAuth();
  const { events } = useAppState();
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);

  // Listen to all user threads
  useEffect(() => {
    if (!user) return;

    const unsubscribe = listenToUserThreads(user.uid, (userThreads) => {
      setThreads(userThreads);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen to messages in selected thread
  useEffect(() => {
    if (!selectedThread) return;

    const unsubscribe = listenToThreadMessages(selectedThread.id, (messages) => {
      setThreadMessages(messages);
    });

    // Mark as read
    markThreadAsRead(selectedThread.id, user.uid);

    return () => unsubscribe();
  }, [selectedThread, user]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return;

    setLoading(true);
    const { error } = await sendThreadMessage(
      selectedThread.id,
      user.uid,
      userProfile?.displayName || userProfile?.email || 'Unknown',
      newMessage
    );

    if (error) {
      toast.error('Failed to send message');
    } else {
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

    const { error} = await reopenThread(selectedThread.id);

    if (error) {
      toast.error('Failed to reopen thread');
    } else {
      toast.success('Thread reopened');
      setSelectedThread({ ...selectedThread, status: THREAD_STATUS.OPEN });
    }
  };

  const getEventName = (eventId) => {
    const event = events.find(e => e.id === eventId);
    return event?.name || 'Unknown Event';
  };

  const canResolveThread = (thread) => {
    if (!thread) return false;
    return thread.createdBy === user.uid; // Creator can always resolve
  };

  const openThreads = threads.filter(t => t.status === THREAD_STATUS.OPEN);
  const resolvedThreads = threads.filter(t => t.status === THREAD_STATUS.RESOLVED);
  const unreadCount = openThreads.filter(t => (t.unreadCount?.[user?.uid] || 0) > 0).length;

  const displayThreads = tabValue === 0 ? openThreads : resolvedThreads;

  // Thread list view
  if (!selectedThread) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MessageIcon />
              Message Center
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} Unread`}
                color="error"
                variant="filled"
              />
            )}
          </Box>

          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Open Messages
                  <Badge badgeContent={openThreads.length} color="primary" />
                </Box>
              }
            />
            <Tab label={`Resolved (${resolvedThreads.length})`} />
          </Tabs>

          {displayThreads.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <MessageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {tabValue === 0 ? 'No open messages' : 'No resolved messages'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tabValue === 0
                  ? 'Messages will appear here when you receive them'
                  : 'Resolved conversations will appear here'}
              </Typography>
            </Box>
          ) : (
            <List>
              {displayThreads.map((thread) => {
                const unread = thread.unreadCount?.[user.uid] || 0;
                const eventName = getEventName(thread.eventId);

                return (
                  <React.Fragment key={thread.id}>
                    <ListItem
                      button
                      onClick={() => setSelectedThread(thread)}
                      sx={{
                        bgcolor: unread > 0 ? 'rgba(0, 212, 255, 0.05)' : 'transparent',
                        '&:hover': {
                          bgcolor: 'rgba(0, 212, 255, 0.1)',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Badge badgeContent={unread} color="error">
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <MessageIcon />
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: unread > 0 ? 600 : 400 }}
                            >
                              {thread.subject}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                              <Chip
                                icon={<EventIcon />}
                                label={eventName}
                                size="small"
                                variant="outlined"
                              />
                              {thread.status === THREAD_STATUS.RESOLVED && (
                                <Chip label="Resolved" size="small" color="success" />
                              )}
                            </Box>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Started by {thread.createdByName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Last message {formatDistanceToNow(thread.lastMessageAt, { addSuffix: true })}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Paper>
      </Container>
    );
  }

  // Thread conversation view
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => setSelectedThread(null)}>
              <CloseIcon />
            </IconButton>
            <Box>
              <Typography variant="h5">{selectedThread.subject}</Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                <Chip
                  icon={<EventIcon />}
                  label={getEventName(selectedThread.eventId)}
                  size="small"
                  color="primary"
                />
                <Typography variant="caption" color="text.secondary">
                  Started by {selectedThread.createdByName}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {selectedThread.status === THREAD_STATUS.OPEN && canResolveThread(selectedThread) && (
              <Button
                startIcon={<ResolveIcon />}
                onClick={handleResolveThread}
                color="success"
                variant="outlined"
              >
                Resolve
              </Button>
            )}
            {selectedThread.status === THREAD_STATUS.RESOLVED && canResolveThread(selectedThread) && (
              <Button
                startIcon={<ReopenIcon />}
                onClick={handleReopenThread}
                variant="outlined"
              >
                Reopen
              </Button>
            )}
          </Box>
        </Box>

        <Paper sx={{ maxHeight: 500, overflow: 'auto', p: 2, mb: 3, bgcolor: 'rgba(0, 0, 0, 0.2)' }}>
          {threadMessages.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              No messages yet
            </Typography>
          ) : (
            <List>
              {threadMessages.map((message, index) => (
                <React.Fragment key={message.id}>
                  <ListItem alignItems="flex-start" sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                      <Avatar sx={{ mr: 2 }}>
                        {message.senderName[0]}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {message.senderName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(message.createdAt, { addSuffix: true })}
                          </Typography>
                        </Box>
                        <Paper sx={{ p: 2, bgcolor: message.senderId === user.uid ? 'rgba(0, 212, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)' }}>
                          <Typography variant="body2">{message.content}</Typography>
                        </Paper>
                      </Box>
                    </Box>
                  </ListItem>
                  {index < threadMessages.length - 1 && <Divider sx={{ my: 2 }} />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>

        {selectedThread.status === THREAD_STATUS.OPEN ? (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Type your reply..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={loading || !newMessage.trim()}
              startIcon={<SendIcon />}
              sx={{ minWidth: 100 }}
            >
              Send
            </Button>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ p: 2 }}>
            This thread has been resolved by {selectedThread.resolvedByName}.
            {canResolveThread(selectedThread) && ' Click "Reopen" to continue the conversation.'}
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default MessageCenter;
