import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Fab,
  Tab,
  Tabs,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Event as EventIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncompletedIcon,
  Timeline as TimelineIcon,
  Share as ShareIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { useAppState } from '../../context/AppStateContext';
import { useAuth } from '../../context/AuthContext';
import EventSharing from '../EventSharing/EventSharing';
import { getUserEventRole } from '../../services/accessControlService';
import { PERMISSIONS, hasEventPermission } from '../../utils/roleConstants';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const EventTracking = () => {
  const { events, addEvent, updateEvent, setLoading } = useAppState();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [sharingOpen, setSharingOpen] = useState(false);
  const [eventToShare, setEventToShare] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [eventRoles, setEventRoles] = useState({});
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
    capacity: '',
    organizer: '',
    category: '',
  });

  const eventStatuses = ['Planning', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];
  const eventCategories = ['Conference', 'Workshop', 'Concert', 'Sports', 'Exhibition', 'Other'];

  // Load event roles for all events
  useEffect(() => {
    const loadEventRoles = async () => {
      if (!user || !events.length) return;

      const roles = {};
      for (const event of events) {
        const role = await getUserEventRole(event.id, user.uid, userRole);
        roles[event.id] = role;
      }
      setEventRoles(roles);
    };

    loadEventRoles();
  }, [events, user, userRole]);

  // Helper to check if user can share an event
  const canShareEvent = (eventId) => {
    const role = eventRoles[eventId];
    if (!role) return false;
    return hasEventPermission(role, PERMISSIONS.EVENT_SHARE);
  };

  const handleCreateEvent = async () => {
    if (!user) {
      toast.error('Please sign in to create events');
      return;
    }

    if (!newEvent.name || !newEvent.date || !newEvent.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const eventData = {
        ...newEvent,
        createdBy: user.uid,
        status: 'Planning',
        timeline: [
          {
            step: 'Event Created',
            timestamp: new Date().toISOString(),
            status: 'completed',
            description: 'Event has been created and is in planning phase',
          },
        ],
        attendees: 0,
        tickets: {
          total: parseInt(newEvent.capacity) || 0,
          sold: 0,
          available: parseInt(newEvent.capacity) || 0,
        },
      };

      await addEvent(eventData);
      toast.success('Event created successfully!');

      setNewEvent({
        name: '',
        description: '',
        date: '',
        location: '',
        capacity: '',
        organizer: '',
        category: '',
      });
      setOpenDialog(false);
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Planning': return 'default';
      case 'Confirmed': return 'primary';
      case 'In Progress': return 'warning';
      case 'Completed': return 'success';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const EventCard = ({ event }) => (
    <Card
      onClick={() => navigate(`/event/${event.id}`)}
      sx={{
        height: '100%',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
        transition: 'all 0.3s ease',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="h2">
            {event.name}
          </Typography>
          <Chip
            label={event.status}
            color={getStatusColor(event.status)}
            size="small"
          />
        </Box>
        
        <Typography color="text.secondary" gutterBottom>
          {event.description}
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <ScheduleIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">
              {new Date(event.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <LocationIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">{event.location}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <PeopleIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">
              {event.tickets.sold}/{event.tickets.total} tickets sold
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <EventIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">{event.category}</Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          {canShareEvent(event.id) && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<ShareIcon />}
              onClick={(e) => {
                e.stopPropagation();
                setEventToShare(event);
                setSharingOpen(true);
              }}
            >
              Share
            </Button>
          )}
          <Button
            variant="outlined"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEvent(event);
            }}
          >
            View Timeline
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  const EventTimeline = ({ event }) => {
    if (!event) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No event data available</Typography>
        </Box>
      );
    }

    const hasDetails = event.venue || event.pricing || event.speakers || event.schedule;
    const hasTimeline = event.timeline && event.timeline.length > 0;

    return (
      <Box sx={{ mt: 2 }}>
        {/* Event Header Info */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper', borderLeft: 4, borderColor: 'primary.main' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                {event.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {event.description}
              </Typography>
            </Box>
            <Chip
              label={event.status}
              color={getStatusColor(event.status)}
              sx={{ fontWeight: 'bold' }}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">📅 Date</Typography>
              <Typography variant="body2">
                {new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">📍 Location</Typography>
              <Typography variant="body2">{event.location}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">👥 Capacity</Typography>
              <Typography variant="body2">{event.capacity} attendees</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">🎫 Tickets Sold</Typography>
              <Typography variant="body2">
                {event.tickets?.sold || 0} / {event.tickets?.total || 0}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Event Details Grid */}
        {hasDetails && (
          <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {/* Venue Info */}
            {event.venue && (
              <Paper sx={{ p: 2, bgcolor: 'primary.dark', opacity: 0.9 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  📍 Venue Details
                </Typography>
                <Typography variant="body2" gutterBottom fontWeight="medium">
                  {event.venue.name}
                </Typography>
                {event.venue.address && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {event.venue.address}
                  </Typography>
                )}
                {event.venue.facilities && event.venue.facilities.length > 0 && (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Facilities:
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {event.venue.facilities.map((facility, idx) => (
                        <Chip key={idx} label={facility} size="small" sx={{ mr: 0.5, mt: 0.5 }} />
                      ))}
                    </Box>
                  </Box>
                )}
              </Paper>
            )}

            {/* Pricing Info */}
            {event.pricing && (
              <Paper sx={{ p: 2, bgcolor: 'success.dark', opacity: 0.9 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  💰 Ticket Pricing
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, mt: 1.5 }}>
                  {Object.entries(event.pricing).map(([type, price]) => (
                    <Box key={type}>
                      <Typography variant="caption" color="text.secondary">
                        {type.replace(/([A-Z])/g, ' $1').trim().charAt(0).toUpperCase() +
                         type.replace(/([A-Z])/g, ' $1').trim().slice(1)}
                      </Typography>
                      <Typography variant="h6" color="success.light">
                        ${price}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            )}

            {/* Speakers */}
            {event.speakers && event.speakers.length > 0 && (
              <Paper sx={{ p: 2, bgcolor: 'secondary.dark', opacity: 0.9 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  🎤 Featured Speakers
                </Typography>
                <Box sx={{ mt: 1.5 }}>
                  {event.speakers.map((speaker, idx) => (
                    <Box key={idx} sx={{ mb: 1.5, pb: 1.5, borderBottom: idx < event.speakers.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                      <Typography variant="body2" fontWeight="bold">
                        {speaker.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {speaker.title}
                      </Typography>
                      <Typography variant="caption" color="secondary.light">
                        Topic: {speaker.topic}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            )}

            {/* Schedule */}
            {event.schedule && event.schedule.length > 0 && (
              <Paper sx={{ p: 2, bgcolor: 'warning.dark', opacity: 0.9 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  📅 Event Schedule
                </Typography>
                <Box sx={{ mt: 1.5, maxHeight: 250, overflow: 'auto' }}>
                  {event.schedule.map((item, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        mb: 1.5,
                        pb: 1.5,
                        borderBottom: idx < event.schedule.length - 1 ? 1 : 0,
                        borderColor: 'divider'
                      }}
                    >
                      <Typography variant="body2" fontWeight="bold" color="warning.light">
                        {item.time}
                        {item.day && ` (Day ${item.day})`}
                      </Typography>
                      <Typography variant="body2">
                        {item.activity}
                      </Typography>
                      {item.speaker && (
                        <Typography variant="caption" color="text.secondary">
                          Speaker: {item.speaker}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              </Paper>
            )}
          </Box>
        )}

        {/* Event Progress Timeline */}
        <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimelineIcon color="primary" />
            Event Progress Timeline
          </Typography>

          {hasTimeline ? (
            <Stepper orientation="vertical" sx={{ mt: 2 }}>
              {event.timeline.map((item, index) => (
                <Step key={index} active={true} completed={item.status === 'completed'}>
                  <StepLabel
                    icon={item.status === 'completed' ? <CheckCircleIcon color="success" /> : <UncompletedIcon />}
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontWeight: 'bold',
                      }
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {item.step}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(item.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                        {item.completedBy && ` • by ${item.completedBy}`}
                      </Typography>
                    </Box>
                  </StepLabel>
                  <StepContent>
                    <Paper sx={{ p: 2, bgcolor: 'action.hover', mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                    </Paper>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <TimelineIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                No timeline events recorded yet
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Timeline will update as the event progresses
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          🎪 Event Tracking & Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Create, track, and manage events with real-time status updates
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="All Events" />
          <Tab label="Active Events" />
          <Tab label="Upcoming Events" />
          <Tab label="Completed Events" />
        </Tabs>
      </Paper>

      <Grid container spacing={3}>
        {events
          .filter(event => {
            switch (tabValue) {
              case 1: return ['Confirmed', 'In Progress'].includes(event.status);
              case 2: return event.status === 'Planning' || event.status === 'Confirmed';
              case 3: return event.status === 'Completed';
              default: return true;
            }
          })
          .map((event) => (
            <Grid item xs={12} md={6} lg={4} key={event.id}>
              <EventCard event={event} />
            </Grid>
          ))}
      </Grid>

      {events.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No events created yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first event to start tracking and managing events
          </Typography>
          <Button variant="contained" onClick={() => setOpenDialog(true)}>
            Create First Event
          </Button>
        </Box>
      )}

      {/* Create Event Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>🎪 Create New Event</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Event Name *"
            fullWidth
            variant="outlined"
            value={newEvent.name}
            onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newEvent.description}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Date & Time *"
            type="datetime-local"
            fullWidth
            variant="outlined"
            value={newEvent.date}
            onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
            sx={{ mb: 2 }}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            margin="dense"
            label="Location *"
            fullWidth
            variant="outlined"
            value={newEvent.location}
            onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Capacity"
            type="number"
            fullWidth
            variant="outlined"
            value={newEvent.capacity}
            onChange={(e) => setNewEvent({ ...newEvent, capacity: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Organizer"
            fullWidth
            variant="outlined"
            value={newEvent.organizer}
            onChange={(e) => setNewEvent({ ...newEvent, organizer: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            select
            margin="dense"
            label="Category"
            fullWidth
            variant="outlined"
            value={newEvent.category}
            onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
            SelectProps={{
              native: true,
            }}
          >
            <option value=""></option>
            {eventCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateEvent} variant="contained">
            Create Event
          </Button>
        </DialogActions>
      </Dialog>

      {/* Event Timeline Dialog */}
      <Dialog
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: '80vh',
            maxHeight: '90vh',
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
          <TimelineIcon sx={{ mr: 1 }} />
          {selectedEvent?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedEvent && <EventTimeline event={selectedEvent} />}
        </DialogContent>
        <DialogActions sx={{ borderTop: 1, borderColor: 'divider', p: 2 }}>
          <Button onClick={() => setSelectedEvent(null)} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add event"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setOpenDialog(true)}
      >
        <AddIcon />
      </Fab>

      {/* Event Sharing Dialog */}
      <EventSharing
        open={sharingOpen}
        onClose={() => {
          setSharingOpen(false);
          setEventToShare(null);
        }}
        event={eventToShare}
        onUpdate={() => {
          // Event data will refresh automatically via AppStateContext
        }}
      />
    </Container>
  );
};

export default EventTracking;