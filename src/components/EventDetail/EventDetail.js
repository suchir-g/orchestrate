import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  CalendarMonth as CalendarIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  CheckCircle as CompleteIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  LocationOn as LocationIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
  Warning as WarningIcon,
  PlayArrow as NextStageIcon,
  Share as ShareIcon,
  Message as MessageIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppState } from '../../context/AppStateContext';
import { useAuth } from '../../context/AuthContext';
import { getAllScheduleBlocks } from '../../services/scheduleService';
import EventSharing from '../EventSharing/EventSharing';
import EnhancedEventCollaboration from '../EventCollaboration/EnhancedEventCollaboration';
import EventTeam from '../EventTeam/EventTeam';
import { getUserEventRole } from '../../services/accessControlService';
import { EVENT_ROLES, PERMISSIONS, hasEventPermission } from '../../utils/roleConstants';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const EventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { events, orders, shipments } = useAppState();
  const { user, userRole } = useAuth();

  const [currentEvent, setCurrentEvent] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [scheduleBlocks, setLocalScheduleBlocks] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [sharingOpen, setSharingOpen] = useState(false);
  const [collaborationOpen, setCollaborationOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingStage, setProcessingStage] = useState(false);
  const [userEventRole, setUserEventRole] = useState(null);

  // Load event details
  useEffect(() => {
    if (eventId && events.length > 0) {
      const event = events.find(e => e.id === eventId);
      setCurrentEvent(event);
    }
  }, [eventId, events]);

  // Load user's event role
  useEffect(() => {
    const loadUserEventRole = async () => {
      if (!eventId || !user) return;

      const role = await getUserEventRole(eventId, user.uid, userRole);
      setUserEventRole(role);
    };

    loadUserEventRole();
  }, [eventId, user, userRole]);

  // Load schedule blocks
  useEffect(() => {
    const loadScheduleBlocks = async () => {
      if (!eventId) return;

      setLoading(true);
      const { data, error } = await getAllScheduleBlocks(eventId);

      if (error) {
        console.error('Error loading schedule blocks:', error);
        setLocalScheduleBlocks([]);
      } else {
        setLocalScheduleBlocks(data || []);
      }
      setLoading(false);
    };

    loadScheduleBlocks();
  }, [eventId]);

  const handleBlockClick = (block) => {
    setSelectedBlock(block);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedBlock(null);
  };

  const handleOpenValidation = () => {
    setValidationDialogOpen(true);
  };

  // Permission check helpers
  const canShareEvent = useMemo(() => {
    if (!userEventRole) return false;
    return hasEventPermission(userEventRole, PERMISSIONS.EVENT_SHARE);
  }, [userEventRole]);

  const canEditEvent = useMemo(() => {
    if (!userEventRole) return false;
    return hasEventPermission(userEventRole, PERMISSIONS.EVENT_EDIT);
  }, [userEventRole]);

  const handleCloseValidation = () => {
    setValidationDialogOpen(false);
  };

  const handleMarkComplete = async () => {
    if (!allChecksPassed) {
      toast.error('Cannot proceed: Not all requirements are met');
      return;
    }

    setProcessingStage(true);

    try {
      // TODO: Integrate with blockchain service to record stage completion
      // For now, we'll just update the event status
      // await updateEventToBlockchain(eventId, { status: 'completed' });

      toast.success('Event stage marked as complete! Ready for blockchain confirmation.');

      // Close dialog and navigate back
      setValidationDialogOpen(false);
      setTimeout(() => {
        navigate('/events');
      }, 1500);
    } catch (error) {
      console.error('Error marking event complete:', error);
      toast.error('Failed to mark event as complete');
    } finally {
      setProcessingStage(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'in_progress': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'keynote': return '#ff6b9d';
      case 'workshop': return '#00d4ff';
      case 'session': return '#4caf50';
      case 'break': return '#9e9e9e';
      case 'meal': return '#ff9800';
      default: return '#2196f3';
    }
  };

  const calculateProgress = (block) => {
    if (block.status === 'completed') return 100;
    if (block.status === 'in_progress') return 50;
    if (block.status === 'cancelled') return 0;

    // Calculate based on registration if available
    if (block.requiresRegistration && block.capacity) {
      return (block.registered / block.capacity) * 100;
    }

    return 0;
  };

  const groupBlocksByDay = () => {
    const grouped = {};
    scheduleBlocks.forEach(block => {
      const day = block.day || 1;
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(block);
    });

    // Sort blocks within each day by start time
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => {
        const timeA = a.startTime.split(':').map(Number);
        const timeB = b.startTime.split(':').map(Number);
        return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
      });
    });

    return grouped;
  };

  // Stage completion validation
  const validationChecks = useMemo(() => {
    if (!currentEvent) return [];

    const checks = [];

    // 1. Schedule completion check
    const scheduleCheck = {
      id: 'schedule',
      label: 'All Schedule Blocks Completed',
      description: 'All sessions, workshops, and activities must be marked as completed',
      completed: false,
      details: '',
    };

    if (scheduleBlocks.length > 0) {
      const completedBlocks = scheduleBlocks.filter(b => b.status === 'completed').length;
      const cancelledBlocks = scheduleBlocks.filter(b => b.status === 'cancelled').length;
      const activeBlocks = scheduleBlocks.length - cancelledBlocks;

      scheduleCheck.completed = completedBlocks === activeBlocks && activeBlocks > 0;
      scheduleCheck.details = `${completedBlocks}/${activeBlocks} sessions completed${cancelledBlocks > 0 ? ` (${cancelledBlocks} cancelled)` : ''}`;
    } else {
      scheduleCheck.completed = true;
      scheduleCheck.details = 'No schedule blocks to complete';
    }
    checks.push(scheduleCheck);

    // 2. Volunteer assignments check
    const volunteerCheck = {
      id: 'volunteers',
      label: 'All Volunteer Positions Filled',
      description: 'All required volunteer positions must be assigned',
      completed: false,
      details: '',
    };

    const blocksNeedingVolunteers = scheduleBlocks.filter(b => b.volunteersRequired > 0);
    if (blocksNeedingVolunteers.length > 0) {
      const fullyStaffed = blocksNeedingVolunteers.filter(b =>
        (b.assignedVolunteers?.length || 0) >= b.volunteersRequired
      ).length;

      volunteerCheck.completed = fullyStaffed === blocksNeedingVolunteers.length;
      volunteerCheck.details = `${fullyStaffed}/${blocksNeedingVolunteers.length} positions filled`;
    } else {
      volunteerCheck.completed = true;
      volunteerCheck.details = 'No volunteer positions required';
    }
    checks.push(volunteerCheck);

    // 3. Registration capacity check
    const registrationCheck = {
      id: 'registrations',
      label: 'Registration Targets Met',
      description: 'Sessions requiring registration should meet minimum attendance',
      completed: false,
      details: '',
    };

    const blocksWithRegistration = scheduleBlocks.filter(b => b.requiresRegistration && b.capacity);
    if (blocksWithRegistration.length > 0) {
      const totalCapacity = blocksWithRegistration.reduce((sum, b) => sum + b.capacity, 0);
      const totalRegistered = blocksWithRegistration.reduce((sum, b) => sum + (b.registered || 0), 0);
      const percentFilled = totalCapacity > 0 ? (totalRegistered / totalCapacity) * 100 : 0;

      registrationCheck.completed = percentFilled >= 75; // At least 75% capacity
      registrationCheck.details = `${totalRegistered}/${totalCapacity} registrations (${percentFilled.toFixed(0)}%)`;
    } else {
      registrationCheck.completed = true;
      registrationCheck.details = 'No registration requirements';
    }
    checks.push(registrationCheck);

    // 4. Shipments delivery check
    const shipmentsCheck = {
      id: 'shipments',
      label: 'All Shipments Delivered',
      description: 'All orders and shipments must be delivered',
      completed: false,
      details: '',
    };

    const eventShipments = shipments?.filter(s => s.eventId === eventId) || [];
    if (eventShipments.length > 0) {
      const deliveredShipments = eventShipments.filter(s => s.status === 'delivered').length;

      shipmentsCheck.completed = deliveredShipments === eventShipments.length;
      shipmentsCheck.details = `${deliveredShipments}/${eventShipments.length} shipments delivered`;
    } else {
      shipmentsCheck.completed = true;
      shipmentsCheck.details = 'No shipments required';
    }
    checks.push(shipmentsCheck);

    // 5. Budget compliance check
    const budgetCheck = {
      id: 'budget',
      label: 'Budget Compliance',
      description: 'Event expenses must be within budget',
      completed: false,
      details: '',
    };

    if (currentEvent.budget) {
      const actualSpent = currentEvent.actualSpent || 0;
      const budget = currentEvent.budget;
      const percentUsed = (actualSpent / budget) * 100;

      budgetCheck.completed = actualSpent <= budget;
      budgetCheck.details = `$${actualSpent.toFixed(2)} / $${budget.toFixed(2)} (${percentUsed.toFixed(0)}%)`;
    } else {
      budgetCheck.completed = true;
      budgetCheck.details = 'No budget set';
    }
    checks.push(budgetCheck);

    // 6. Orders/Transactions check
    const ordersCheck = {
      id: 'orders',
      label: 'All Transactions Complete',
      description: 'All orders must be paid and completed',
      completed: false,
      details: '',
    };

    const eventOrders = orders?.filter(o => o.eventId === eventId) || [];
    if (eventOrders.length > 0) {
      const paidOrders = eventOrders.filter(o =>
        o.paymentStatus === 'paid' || o.paymentStatus === 'completed'
      ).length;

      ordersCheck.completed = paidOrders === eventOrders.length;
      ordersCheck.details = `${paidOrders}/${eventOrders.length} orders paid`;
    } else {
      ordersCheck.completed = true;
      ordersCheck.details = 'No orders to complete';
    }
    checks.push(ordersCheck);

    return checks;
  }, [currentEvent, scheduleBlocks, shipments, orders, eventId]);

  const allChecksPassed = useMemo(() => {
    return validationChecks.every(check => check.completed);
  }, [validationChecks]);

  if (!currentEvent) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h5">Event not found</Typography>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/events')} sx={{ mt: 2 }}>
          Back to Events
        </Button>
      </Container>
    );
  }

  const blocksByDay = groupBlocksByDay();
  const days = Object.keys(blocksByDay).sort((a, b) => Number(a) - Number(b));

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/events')}
          sx={{ mb: 2 }}
        >
          Back to Events
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #00d4ff 30%, #ff6b9d 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              {currentEvent.name}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              {currentEvent.description}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip icon={<CalendarIcon />} label={currentEvent.date} />
              <Chip icon={<LocationIcon />} label={currentEvent.location} />
              <Chip icon={<PeopleIcon />} label={`${currentEvent.capacity} capacity`} />
              <Chip
                label={currentEvent.status}
                color={getStatusColor(currentEvent.status)}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {canShareEvent && (
              <Button
                variant="outlined"
                startIcon={<ShareIcon />}
                onClick={() => setSharingOpen(true)}
              >
                Share
              </Button>
            )}

            {/* Collaborate button - visible to all collaborators */}
            {userEventRole && (
              <Button
                variant="outlined"
                startIcon={<MessageIcon />}
                onClick={() => setCollaborationOpen(true)}
              >
                Collaborate
              </Button>
            )}

            {canEditEvent && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/schedule/${eventId}`)}
                sx={{
                  background: 'linear-gradient(45deg, #00d4ff 30%, #ff6b9d 90%)',
                }}
              >
                Manage Schedule
              </Button>
            )}

            {canEditEvent && (
              <Tooltip
                title={allChecksPassed ? 'All requirements met - ready to proceed' : 'Complete all requirements first'}
              >
                <span>
                  <Button
                    variant="contained"
                    startIcon={allChecksPassed ? <CheckIcon /> : <WarningIcon />}
                    endIcon={<NextStageIcon />}
                    onClick={handleOpenValidation}
                    disabled={currentEvent?.status === 'completed'}
                    sx={{
                      background: allChecksPassed
                        ? 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)'
                        : 'linear-gradient(45deg, #ff9800 30%, #ffa726 90%)',
                    }}
                  >
                    {currentEvent?.status === 'completed' ? 'Completed' : 'Next Stage'}
                  </Button>
                </span>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Box>

      {/* Event Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 3,
              background: 'rgba(0, 212, 255, 0.1)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#00d4ff' }}>
              {scheduleBlocks.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Sessions
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 3,
              background: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
              {scheduleBlocks.filter(b => b.status === 'completed').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completed
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 3,
              background: 'rgba(255, 152, 0, 0.1)',
              border: '1px solid rgba(255, 152, 0, 0.3)',
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800' }}>
              {scheduleBlocks.filter(b => b.status === 'in_progress').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              In Progress
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 3,
              background: 'rgba(158, 158, 158, 0.1)',
              border: '1px solid rgba(158, 158, 158, 0.3)',
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#9e9e9e' }}>
              {scheduleBlocks.filter(b => b.status === 'scheduled').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Scheduled
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Calendar View - Sub-events by Day */}
      {loading ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography>Loading schedule...</Typography>
        </Paper>
      ) : scheduleBlocks.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <CalendarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No schedule blocks yet
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate(`/schedule/${eventId}`)}
          >
            Create Schedule
          </Button>
        </Paper>
      ) : (
        <Box>
          {days.map(day => (
            <Paper
              key={day}
              sx={{
                mb: 3,
                p: 3,
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  mb: 3,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <CalendarIcon />
                Day {day}
              </Typography>

              <Grid container spacing={2}>
                {blocksByDay[day].map(block => (
                  <Grid item xs={12} md={6} lg={4} key={block.id}>
                    <Card
                      onClick={() => handleBlockClick(block)}
                      sx={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderLeft: `4px solid ${getTypeColor(block.type)}`,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4,
                          background: 'rgba(255, 255, 255, 0.08)',
                        },
                      }}
                    >
                      <CardContent>
                        {/* Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Chip
                            label={block.type}
                            size="small"
                            sx={{
                              backgroundColor: getTypeColor(block.type),
                              color: 'white',
                            }}
                          />
                          <Chip
                            label={block.status}
                            color={getStatusColor(block.status)}
                            size="small"
                          />
                        </Box>

                        {/* Title */}
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          {block.title}
                        </Typography>

                        {/* Details */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ScheduleIcon sx={{ fontSize: 16 }} />
                            {block.startTime} - {block.endTime}
                          </Typography>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationIcon sx={{ fontSize: 16 }} />
                            {block.location}
                          </Typography>
                          {block.track && (
                            <Typography variant="body2">
                              🎯 Track: {block.track}
                            </Typography>
                          )}
                        </Box>

                        {/* Progress Bar */}
                        <Box sx={{ mb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Progress
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {calculateProgress(block).toFixed(0)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={calculateProgress(block)}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: getTypeColor(block.type),
                              },
                            }}
                          />
                        </Box>

                        {/* Capacity */}
                        {block.capacity && (
                          <Typography variant="caption" color="text.secondary">
                            <PeopleIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                            {block.registered || 0} / {block.capacity} registered
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          ))}
        </Box>
      )}

      {/* Event Team Members */}
      <Box sx={{ mb: 4 }}>
        <EventTeam
          event={currentEvent}
          userEventRole={userEventRole}
          onMessageUser={(member, role) => {
            // Open collaboration dialog with pre-selected recipient
            setCollaborationOpen(true);
          }}
        />
      </Box>

      {/* Detail Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedBlock && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5">{selectedBlock.title}</Typography>
                <IconButton onClick={handleCloseDialog}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip
                    label={selectedBlock.type}
                    sx={{
                      backgroundColor: getTypeColor(selectedBlock.type),
                      color: 'white',
                    }}
                  />
                  <Chip
                    label={selectedBlock.status}
                    color={getStatusColor(selectedBlock.status)}
                  />
                </Box>

                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedBlock.description || 'No description provided'}
                </Typography>

                <Divider sx={{ my: 2 }} />

                {/* Progress Bars */}
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Progress Details
                </Typography>

                {/* Overall Progress */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Overall Completion
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={calculateProgress(selectedBlock)}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getTypeColor(selectedBlock.type),
                      },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {calculateProgress(selectedBlock).toFixed(0)}% complete
                  </Typography>
                </Box>

                {/* Registration Progress */}
                {selectedBlock.requiresRegistration && selectedBlock.capacity && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Registration
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(selectedBlock.registered / selectedBlock.capacity) * 100}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#00d4ff',
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {selectedBlock.registered || 0} / {selectedBlock.capacity} registered
                    </Typography>
                  </Box>
                )}

                {/* Volunteer Progress */}
                {selectedBlock.volunteersRequired > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Volunteer Assignments
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={((selectedBlock.assignedVolunteers?.length || 0) / selectedBlock.volunteersRequired) * 100}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#4caf50',
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {selectedBlock.assignedVolunteers?.length || 0} / {selectedBlock.volunteersRequired} volunteers assigned
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Details */}
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Time
                    </Typography>
                    <Typography variant="body1">
                      {selectedBlock.startTime} - {selectedBlock.endTime}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body1">
                      {selectedBlock.location}
                    </Typography>
                  </Grid>
                  {selectedBlock.track && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Track
                      </Typography>
                      <Typography variant="body1">
                        {selectedBlock.track}
                      </Typography>
                    </Grid>
                  )}
                </Grid>

                {/* Speakers */}
                {selectedBlock.speakers && selectedBlock.speakers.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Speakers
                    </Typography>
                    {selectedBlock.speakers.map((speaker, index) => (
                      <Box key={index} sx={{ mb: 1 }}>
                        <Typography variant="body1">
                          {speaker.name} {speaker.title && `- ${speaker.title}`}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>

              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  handleCloseDialog();
                  navigate(`/schedule/${eventId}`);
                }}
              >
                Edit in Schedule Builder
              </Button>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Stage Completion Validation Dialog */}
      <Dialog
        open={validationDialogOpen}
        onClose={handleCloseValidation}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">Stage Completion Validation</Typography>
            <IconButton onClick={handleCloseValidation}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            {/* Overall Status Alert */}
            {allChecksPassed ? (
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ✓ All Requirements Met
                </Typography>
                <Typography variant="body2">
                  This event is ready to proceed to the next stage and be recorded on the blockchain.
                </Typography>
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ⚠ Requirements Not Met
                </Typography>
                <Typography variant="body2">
                  Please complete all requirements before proceeding to the next stage.
                </Typography>
              </Alert>
            )}

            {/* Validation Checklist */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Completion Checklist
            </Typography>

            <Paper
              sx={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <List>
                {validationChecks.map((check, index) => (
                  <React.Fragment key={check.id}>
                    <ListItem>
                      <ListItemIcon>
                        {check.completed ? (
                          <CheckIcon sx={{ color: '#4caf50', fontSize: 28 }} />
                        ) : (
                          <ClearIcon sx={{ color: '#ff6b9d', fontSize: 28 }} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {check.label}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {check.description}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                mt: 0.5,
                                color: check.completed ? '#4caf50' : '#ff9800',
                                fontWeight: 500,
                              }}
                            >
                              {check.details}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < validationChecks.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>

            {/* Progress Summary */}
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Overall Progress
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {validationChecks.filter(c => c.completed).length} / {validationChecks.length} Complete
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(validationChecks.filter(c => c.completed).length / validationChecks.length) * 100}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: allChecksPassed ? '#4caf50' : '#ff9800',
                  },
                }}
              />
            </Box>

            {/* Action Buttons */}
            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleCloseValidation}
                disabled={processingStage}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                variant="contained"
                startIcon={<NextStageIcon />}
                onClick={handleMarkComplete}
                disabled={!allChecksPassed || processingStage}
                sx={{
                  background: allChecksPassed
                    ? 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)'
                    : undefined,
                }}
              >
                {processingStage ? 'Processing...' : 'Mark Complete & Proceed'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Event Sharing Dialog */}
      <EventSharing
        open={sharingOpen}
        onClose={() => setSharingOpen(false)}
        event={currentEvent}
        onUpdate={() => {
          // Refresh event data
          if (eventId && events.length > 0) {
            const event = events.find(e => e.id === eventId);
            setCurrentEvent(event);
          }
        }}
      />

      {/* Event Collaboration Dialog */}
      <EnhancedEventCollaboration
        open={collaborationOpen}
        onClose={() => setCollaborationOpen(false)}
        event={currentEvent}
      />
    </Container>
  );
};

export default EventDetail;
