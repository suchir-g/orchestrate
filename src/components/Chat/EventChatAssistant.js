import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  CircularProgress,
  Chip,
  Drawer,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { chatWithEventAssistant, buildEventContext, generateSuggestedQuestions } from '../../services/openaiService';
import toast from 'react-hot-toast';

const EventChatAssistant = ({ event, relatedOrders = [], relatedTickets = [], open, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (event && open) {
      // Generate suggested questions when event changes
      setSuggestedQuestions(generateSuggestedQuestions(event));

      // Add welcome message if no messages yet
      if (messages.length === 0) {
        setMessages([{
          role: 'assistant',
          content: `Hi! I'm your AI assistant for **${event.name}**. I can help you with information about tasks, schedules, tickets, merchandise, and timelines. What would you like to know?`,
          timestamp: new Date()
        }]);
      }
    }
  }, [event, open]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (messageText = input) => {
    if (!messageText.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Build context from event data
      const eventContext = buildEventContext(event, relatedOrders, relatedTickets);

      // Prepare messages for API (only role and content)
      const apiMessages = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Get response from OpenAI
      const { message: responseText } = await chatWithEventAssistant(apiMessages, eventContext);

      const assistantMessage = {
        role: 'assistant',
        content: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error.message || 'Failed to get response. Please try again.');

      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please check your API key configuration and try again.',
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedQuestion = (question) => {
    handleSend(question);
    setSuggestedQuestions([]); // Hide suggestions after use
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 450 },
          background: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(20px)',
        }
      }}
    >
      {/* Header */}
      <AppBar position="sticky" elevation={0} sx={{
        background: 'rgba(26, 26, 26, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
      }}>
        <Toolbar>
          <Avatar sx={{
            background: 'linear-gradient(135deg, #00d4ff 0%, #ff6b9d 100%)',
            mr: 2
          }}>
            <BotIcon />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Event AI Assistant
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {event?.name || 'No event selected'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Messages Container */}
      <Box sx={{
        flexGrow: 1,
        overflowY: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        height: 'calc(100vh - 64px - 120px)', // Subtract header and input area
      }}>
        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'flex-start',
              flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
            }}
          >
            <Avatar sx={{
              background: message.role === 'user'
                ? 'linear-gradient(135deg, #00d4ff 0%, #00a3cc 100%)'
                : message.isError
                ? 'linear-gradient(135deg, #ff6b9d 0%, #cc4670 100%)'
                : 'linear-gradient(135deg, #ff6b9d 0%, #ff9dc7 100%)',
              width: 32,
              height: 32,
            }}>
              {message.role === 'user' ? <PersonIcon fontSize="small" /> : <BotIcon fontSize="small" />}
            </Avatar>
            <Paper sx={{
              p: 2,
              maxWidth: '75%',
              background: message.role === 'user'
                ? 'rgba(0, 212, 255, 0.15)'
                : message.isError
                ? 'rgba(255, 107, 157, 0.15)'
                : 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid',
              borderColor: message.role === 'user'
                ? 'rgba(0, 212, 255, 0.3)'
                : message.isError
                ? 'rgba(255, 107, 157, 0.3)'
                : 'rgba(255, 255, 255, 0.1)',
            }}>
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: 'pre-wrap',
                  '& strong': { fontWeight: 700, color: '#00d4ff' },
                  '& ul, & ol': { pl: 2, mt: 1, mb: 1 },
                  '& li': { mb: 0.5 },
                }}
              >
                {message.content}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {message.timestamp.toLocaleTimeString()}
              </Typography>
            </Paper>
          </Box>
        ))}

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{
              background: 'linear-gradient(135deg, #ff6b9d 0%, #ff9dc7 100%)',
              width: 32,
              height: 32,
            }}>
              <BotIcon fontSize="small" />
            </Avatar>
            <Paper sx={{
              p: 2,
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <CircularProgress size={20} sx={{ color: '#00d4ff' }} />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                Thinking...
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Suggested Questions */}
        {suggestedQuestions.length > 0 && messages.length <= 1 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              💡 Suggested questions:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {suggestedQuestions.slice(0, 4).map((question, index) => (
                <Chip
                  key={index}
                  label={question}
                  onClick={() => handleSuggestedQuestion(question)}
                  clickable
                  sx={{
                    background: 'rgba(0, 212, 255, 0.1)',
                    border: '1px solid rgba(0, 212, 255, 0.3)',
                    '&:hover': {
                      background: 'rgba(0, 212, 255, 0.2)',
                      border: '1px solid rgba(0, 212, 255, 0.5)',
                    },
                    justifyContent: 'flex-start',
                    height: 'auto',
                    py: 1,
                    '& .MuiChip-label': {
                      whiteSpace: 'normal',
                      textAlign: 'left',
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box sx={{
        p: 2,
        background: 'rgba(26, 26, 26, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about tasks, schedule, tickets, or anything else..."
            disabled={loading || !event}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
              }
            }}
          />
          <IconButton
            onClick={() => handleSend()}
            disabled={!input.trim() || loading || !event}
            sx={{
              background: 'linear-gradient(135deg, #00d4ff 0%, #00a3cc 100%)',
              color: '#0a0a0a',
              '&:hover': {
                background: 'linear-gradient(135deg, #00a3cc 0%, #007a99 100%)',
              },
              '&.Mui-disabled': {
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.3)',
              }
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Press Enter to send • Shift+Enter for new line
        </Typography>
      </Box>
    </Drawer>
  );
};

export default EventChatAssistant;
