import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  LinearProgress,
  Chip,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ConfirmationNumber as TicketIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { getEvent, claimTicket } from '../../services/firebaseDbService';
import toast from 'react-hot-toast';

const PublicTicketClaim = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimData, setClaimData] = useState({
    name: '',
    email: '',
    selectedTierIndex: null,
  });

  // Get ticket tiers from the event itself
  const eventTickets = event?.ticketTiers || [];

  useEffect(() => {
    // Fetch event directly from Firebase (no auth required for reading public events)
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const { data: eventData, error } = await getEvent(eventId);
        if (error) {
          console.error('Error fetching event:', error);
          toast.error('Event not found');
        } else {
            setEvent(eventData);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        toast.error('Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    } else {
      setLoading(false);
    }
  }, [eventId]);

  const handleClaim = async () => {
    if (!claimData.name || !claimData.email || claimData.selectedTierIndex === null) {
      toast.error('Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(claimData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setClaiming(true);

    try {
      // Actually claim the ticket in Firebase
      const result = await claimTicket(eventId, claimData.selectedTierIndex, {
        name: claimData.name,
        email: claimData.email
      });

      if (result.success) {
        setClaimed(true);
        toast.success('🎉 Ticket claimed successfully!');

        // Refresh event data to show updated availability
        const { data: updatedEvent } = await getEvent(eventId);
        if (updatedEvent) {
          setEvent(updatedEvent);
        }
      } else {
        toast.error(result.error || 'Failed to claim ticket');
      }
    } catch (error) {
      console.error('Error claiming ticket:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!event) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Event not found
        </Alert>
        <Typography variant="h6" color="text.secondary" align="center">
          The event you're looking for doesn't exist or has been removed.
        </Typography>
      </Container>
    );
  }

  if (claimed) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card sx={{
          textAlign: 'center',
          p: 4,
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(0, 212, 255, 0.1) 100%)',
          border: '2px solid rgba(76, 175, 80, 0.5)',
        }}>
          <CheckIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            🎉 Ticket Claimed!
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph>
            Your ticket for {event.name} has been claimed successfully.
          </Typography>

          <Box sx={{ mt: 4, p: 3, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Name:</strong> {claimData.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Email:</strong> {claimData.email}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Event:</strong> {event.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Date:</strong> {new Date(event.date).toLocaleDateString()}
            </Typography>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
            A confirmation email has been sent to {claimData.email}
          </Typography>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Event Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          🎫 Claim Your Ticket
        </Typography>
        <Typography variant="h5" color="primary.main" gutterBottom>
          {event.name}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', mt: 2 }}>
          <Chip
            icon={<TicketIcon />}
            label={`📅 ${new Date(event.date).toLocaleDateString()}`}
            variant="outlined"
          />
          <Chip
            label={`📍 ${event.location}`}
            variant="outlined"
          />
          <Chip
            label="FREE"
            color="success"
          />
        </Box>
      </Box>

      {/* Event Description */}
      {event.description && (
        <Paper sx={{
          p: 3,
          mb: 3,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <Typography variant="body1" color="text.secondary">
            {event.description}
          </Typography>
        </Paper>
      )}

      {/* Available Tickets */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Select Ticket Type
      </Typography>

      {eventTickets.length === 0 ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No tickets available for this event yet. Check back later!
        </Alert>
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {eventTickets.map((ticket, index) => {
            const claimed = ticket.sold || 0;
            const total = ticket.supply || 0;
            const available = total - claimed;
            const progress = total > 0 ? (claimed / total * 100) : 0;
            const isSelected = claimData.selectedTierIndex === index;
            const isSoldOut = available === 0;

            return (
              <Grid item xs={12} key={index}>
                <Card
                  onClick={() => !isSoldOut && setClaimData({ ...claimData, selectedTierIndex: index })}
                  sx={{
                    cursor: isSoldOut ? 'not-allowed' : 'pointer',
                    border: isSelected ? '2px solid #00d4ff' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: isSelected
                      ? 'rgba(0, 212, 255, 0.15)'
                      : isSoldOut
                      ? 'rgba(255, 255, 255, 0.02)'
                      : 'rgba(255, 255, 255, 0.05)',
                    opacity: isSoldOut ? 0.5 : 1,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: isSoldOut ? 'none' : 'translateY(-2px)',
                      border: isSoldOut ? '1px solid rgba(255, 255, 255, 0.1)' : '2px solid rgba(0, 212, 255, 0.5)',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {ticket.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {ticket.description || 'General admission ticket'}
                        </Typography>
                      </Box>
                      <Chip
                        label={isSoldOut ? 'SOLD OUT' : (ticket.price === 0 ? 'FREE' : `$${ticket.price}`)}
                        color={isSoldOut ? 'error' : 'success'}
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Availability
                        </Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {available} / {total} available
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                          height: 6,
                          borderRadius: 1,
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: isSoldOut ? 'error.main' : 'success.main'
                          }
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Claim Form */}
      {eventTickets.length > 0 && (
        <Paper sx={{
          p: 3,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            Your Information
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Full Name"
                value={claimData.name}
                onChange={(e) => setClaimData({ ...claimData, name: e.target.value })}
                placeholder="John Doe"
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email Address"
                type="email"
                value={claimData.email}
                onChange={(e) => setClaimData({ ...claimData, email: e.target.value })}
                placeholder="john@example.com"
                fullWidth
                required
              />
            </Grid>
          </Grid>

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleClaim}
            disabled={claiming || claimData.selectedTierIndex === null}
            sx={{
              mt: 3,
              py: 1.5,
              background: 'linear-gradient(135deg, #00d4ff 0%, #00a3cc 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #00a3cc 0%, #007a99 100%)',
              },
            }}
          >
            {claiming ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1, color: 'inherit' }} />
                Claiming Ticket...
              </>
            ) : (
              '🎫 Claim Free Ticket'
            )}
          </Button>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
            By claiming this ticket, you agree to receive event updates via email
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default PublicTicketClaim;
