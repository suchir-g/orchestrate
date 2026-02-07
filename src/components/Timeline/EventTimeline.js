import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  Fab,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  ViewTimeline as TimelineIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncompletedIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Assignment as TodoIcon,
  LocalShipping as ShippingIcon,
  ConfirmationNumber as TicketIcon,
  SmartToy as AiIcon,
} from '@mui/icons-material';
import { useAppState } from '../../context/AppStateContext';
import { format, parseISO, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import EventChatAssistant from '../Chat/EventChatAssistant';

const EventTimeline = () => {
  const { events = [], orders = [], tickets = [] } = useAppState();
  const [view, setView] = useState('gantt'); // 'gantt', 'project'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProject, setSelectedProject] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  // Get date range based on view
  const getDateRange = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return { start, end };
  };

  const { start: rangeStart, end: rangeEnd } = getDateRange();
  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

  // Filter events in current range
  const eventsInRange = (events || []).filter(event => {
    if (!event || !event.date) return false;
    try {
      const eventDate = parseISO(event.date);
      return eventDate >= rangeStart && eventDate <= rangeEnd;
    } catch (error) {
      console.error('Error parsing event date:', event, error);
      return false;
    }
  });

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Planning': return '#9e9e9e';
      case 'Confirmed': return '#2196f3';
      case 'In Progress': return '#ff9800';
      case 'Completed': return '#4caf50';
      case 'Cancelled': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  // Calculate position on timeline
  const getEventPosition = (eventDate) => {
    const totalDays = differenceInDays(rangeEnd, rangeStart);
    const daysSinceStart = differenceInDays(parseISO(eventDate), rangeStart);
    return (daysSinceStart / totalDays) * 100;
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get upcoming milestones for selected project
  const getUpcomingMilestones = (event) => {
    if (!event || !event.timeline) return [];

    const now = new Date();
    return (event.timeline || [])
      .filter(item => {
        try {
          const itemDate = new Date(item.timestamp);
          return itemDate > now && item.status !== 'completed';
        } catch {
          return false;
        }
      })
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  };

  // Calculate project progress
  const calculateProgress = (event) => {
    if (!event || !event.timeline || event.timeline.length === 0) return 0;
    const completed = event.timeline.filter(item => item.status === 'completed').length;
    return Math.round((completed / event.timeline.length) * 100);
  };

  // Get status color
  const getProjectStatusColor = (status) => {
    switch (status) {
      case 'Planning': return 'default';
      case 'Confirmed': return 'primary';
      case 'In Progress': return 'warning';
      case 'Completed': return 'success';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  // Project Detail View Component
  const ProjectDetailView = ({ event }) => {
    const progress = calculateProgress(event);
    const upcomingMilestones = getUpcomingMilestones(event);
    const completedMilestones = (event.timeline || []).filter(item => item.status === 'completed');

    // Filter merchandise and tickets for this event
    const eventMerchandise = (orders || []).filter(order => order.eventId === event.id);
    const eventTickets = (tickets || []).filter(ticket => ticket.eventId === event.id);

    return (
      <Box sx={{ mt: 3 }}>
        {/* Project Header */}
        <Paper sx={{
          p: 3,
          mb: 3,
          borderLeft: 4,
          borderColor: 'primary.main',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          borderRadius: 2,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" gutterBottom>
                {event.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {event.description}
              </Typography>
            </Box>
            <Chip
              label={event.status}
              color={getProjectStatusColor(event.status)}
              size="large"
              sx={{
                fontWeight: 'bold',
                fontSize: '0.9rem',
                px: 1,
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
              }}
            />
          </Box>

          {/* Progress Bar */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Project Progress
              </Typography>
              <Typography variant="h6" color="primary">
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'action.hover',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                }
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {completedMilestones.length} of {event.timeline?.length || 0} milestones completed
            </Typography>
          </Box>
        </Paper>

        {/* Todos Section */}
        {event.todos && event.todos.length > 0 && (
          <Paper sx={{
            p: 3,
            mb: 3,
            background: 'rgba(33, 150, 243, 0.1)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(33, 150, 243, 0.2)',
            boxShadow: '0 8px 32px 0 rgba(33, 150, 243, 0.2)',
            borderRadius: 2,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TodoIcon sx={{ mr: 1, fontSize: 28 }} />
              <Typography variant="h5">
                Event Todo List
              </Typography>
            </Box>
            <Grid container spacing={2}>
              {event.todos.map((todo, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Paper sx={{
                    p: 2,
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 2,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight="bold" sx={{ textDecoration: todo.status === 'completed' ? 'line-through' : 'none' }}>
                          {todo.status === 'completed' && '✅ '}
                          {todo.status === 'in_progress' && '🔄 '}
                          {todo.status === 'pending' && '⏳ '}
                          {todo.task}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Due: {format(new Date(todo.dueDate), 'MMM dd, yyyy h:mm a')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Assigned: {todo.assignedTo}
                        </Typography>
                      </Box>
                      <Chip
                        label={todo.priority}
                        size="small"
                        color={todo.priority === 'urgent' ? 'error' : todo.priority === 'high' ? 'warning' : 'default'}
                        sx={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(8px)',
                        }}
                      />
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        <Grid container spacing={3}>
          {/* Left Column - Project Info */}
          <Grid item xs={12} md={4}>
            {/* Key Details */}
            <Paper sx={{
              p: 2,
              mb: 2,
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
              borderRadius: 2,
            }}>
              <Typography variant="h6" gutterBottom>
                📋 Project Details
              </Typography>
              <Divider sx={{ mb: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ScheduleIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">Event Date</Typography>
                </Box>
                <Typography variant="body2" fontWeight="medium">
                  {format(parseISO(event.date), 'PPP')}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">Location</Typography>
                </Box>
                <Typography variant="body2" fontWeight="medium">
                  {event.location}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PeopleIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">Attendance</Typography>
                </Box>
                <Typography variant="body2" fontWeight="medium">
                  {event.tickets?.sold || 0} / {event.tickets?.total || 0} tickets sold
                </Typography>
              </Box>

              {event.category && (
                <Box>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Category
                  </Typography>
                  <Chip label={event.category} size="small" variant="outlined" />
                </Box>
              )}
            </Paper>

            {/* Upcoming Milestones */}
            <Paper sx={{
              p: 2,
              background: 'rgba(255, 152, 0, 0.1)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 152, 0, 0.2)',
              boxShadow: '0 8px 32px 0 rgba(255, 152, 0, 0.2)',
              borderRadius: 2,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Upcoming Milestones
                </Typography>
              </Box>
              {upcomingMilestones.length > 0 ? (
                <Box>
                  {upcomingMilestones.map((milestone, index) => (
                    <Box
                      key={index}
                      sx={{
                        mb: 1.5,
                        pb: 1.5,
                        borderBottom: index < upcomingMilestones.length - 1 ? 1 : 0,
                        borderColor: 'divider'
                      }}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        {milestone.step}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Due: {format(new Date(milestone.timestamp), 'MMM dd, yyyy')}
                      </Typography>
                      {milestone.completedBy && (
                        <Typography variant="caption" display="block" color="warning.light">
                          Assigned to: {milestone.completedBy}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No upcoming milestones
                </Typography>
              )}
            </Paper>

            {/* Merchandise Orders */}
            {eventMerchandise.length > 0 && (
              <Paper sx={{
                p: 2,
                mt: 2,
                background: 'rgba(76, 175, 80, 0.1)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(76, 175, 80, 0.2)',
                boxShadow: '0 8px 32px 0 rgba(76, 175, 80, 0.2)',
                borderRadius: 2,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ShippingIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Merchandise & Supplies
                  </Typography>
                </Box>
                {eventMerchandise.map((order, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 1.5,
                      pb: 1.5,
                      borderBottom: index < eventMerchandise.length - 1 ? 1 : 0,
                      borderColor: 'divider'
                    }}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      {order.orderNumber} - {order.itemType}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Supplier: {order.supplier}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Total: ${order.totalAmount.toFixed(2)}
                    </Typography>
                    <Chip
                      label={order.status}
                      size="small"
                      color={order.status === 'Delivered' ? 'success' : order.status === 'Shipped' ? 'primary' : 'warning'}
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                ))}
              </Paper>
            )}

            {/* Tickets Issued */}
            {eventTickets.length > 0 && (
              <Paper sx={{
                p: 2,
                mt: 2,
                background: 'rgba(255, 152, 0, 0.1)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 152, 0, 0.2)',
                boxShadow: '0 8px 32px 0 rgba(255, 152, 0, 0.2)',
                borderRadius: 2,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TicketIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Tickets Issued
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {eventTickets.length} ticket{eventTickets.length !== 1 ? 's' : ''} sold
                </Typography>
                {eventTickets.slice(0, 5).map((ticket, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 1.5,
                      pb: 1.5,
                      borderBottom: index < Math.min(4, eventTickets.length - 1) ? 1 : 0,
                      borderColor: 'divider'
                    }}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      {ticket.ticketNumber} - {ticket.ticketType}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {ticket.holderName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ${ticket.price.toFixed(2)}
                    </Typography>
                  </Box>
                ))}
                {eventTickets.length > 5 && (
                  <Typography variant="caption" color="text.secondary">
                    +{eventTickets.length - 5} more tickets
                  </Typography>
                )}
              </Paper>
            )}
          </Grid>

          {/* Right Column - Timeline */}
          <Grid item xs={12} md={8}>
            <Paper sx={{
              p: 3,
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
              borderRadius: 2,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <TimelineIcon sx={{ mr: 1, fontSize: 28 }} color="primary" />
                <Typography variant="h5">
                  Project Timeline
                </Typography>
              </Box>

              {event.timeline && event.timeline.length > 0 ? (
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
                          <Typography variant="subtitle1" fontWeight="bold">
                            {item.step}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(item.timestamp), 'MMMM dd, yyyy • h:mm a')}
                            {item.completedBy && ` • ${item.completedBy}`}
                          </Typography>
                        </Box>
                      </StepLabel>
                      <StepContent>
                        <Paper sx={{
                          p: 2,
                          mt: 1,
                          mb: 2,
                          background: 'rgba(255, 255, 255, 0.03)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: 1,
                        }}>
                          <Typography variant="body2" color="text.secondary">
                            {item.description}
                          </Typography>
                        </Paper>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <TimelineIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No timeline data available
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Timeline milestones will appear here as the project progresses
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              📅 Event Timeline & Projects
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {view === 'gantt' ? 'Gantt chart view of all events' : 'Detailed project timeline and milestones'}
            </Typography>
          </Box>

          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(e, newView) => {
              if (newView) {
                setView(newView);
                if (newView === 'project' && !selectedProject && events.length > 0) {
                  setSelectedProject(events[0].id);
                }
              }
            }}
            size="small"
          >
            <ToggleButton value="gantt">
              <CalendarIcon sx={{ mr: 1 }} />
              Gantt Chart
            </ToggleButton>
            <ToggleButton value="project">
              <TimelineIcon sx={{ mr: 1 }} />
              Project View
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Project Selector - Only show in project view */}
        {view === 'project' && events.length > 0 && (
          <Paper sx={{
            p: 2,
            mb: 3,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            borderRadius: 2,
          }}>
            <FormControl fullWidth>
              <InputLabel>Select Project / Event</InputLabel>
              <Select
                value={selectedProject || ''}
                label="Select Project / Event"
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                {events.map((event) => (
                  <MenuItem key={event.id} value={event.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body1">{event.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {event.location} • {format(parseISO(event.date), 'MMM dd, yyyy')}
                        </Typography>
                      </Box>
                      <Chip
                        label={event.status}
                        color={getProjectStatusColor(event.status)}
                        size="small"
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
        )}
      </Box>

      {/* Conditional View Rendering */}
      {view === 'project' ? (
        // Project Detail View
        <>
          {events.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.3 }} />
              <Typography variant="h6" color="text.secondary">
                No projects available
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Create events to see project timelines
              </Typography>
            </Box>
          ) : selectedProject ? (
            <ProjectDetailView event={events.find(e => e.id === selectedProject)} />
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                Select a project to view its timeline
              </Typography>
            </Box>
          )}
        </>
      ) : (
        // Gantt Chart View (Original)
        <>
          {/* Date Navigation */}
          <Paper sx={{
            p: 2,
            mb: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            borderRadius: 2,
          }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Chip
                icon={<CalendarIcon />}
                label="Previous"
                onClick={goToPreviousMonth}
                clickable
              />
              <Chip
                icon={<CalendarIcon />}
                label="Today"
                onClick={goToToday}
                clickable
                color="primary"
              />
              <Chip
                icon={<CalendarIcon />}
                label="Next"
                onClick={goToNextMonth}
                clickable
              />
            </Box>

            <Typography variant="h6">
              {format(currentDate, 'MMMM yyyy')}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {eventsInRange.length} events
              </Typography>
            </Box>
          </Paper>

          {/* Timeline Grid */}
      <Card sx={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        borderRadius: 2,
      }}>
        <CardContent>
          {/* Date Header */}
          <Box sx={{ display: 'flex', mb: 2, pb: 1, borderBottom: '2px solid', borderColor: 'divider' }}>
            <Box sx={{ width: 200, flexShrink: 0, pr: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Event
              </Typography>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-between', px: 2 }}>
              {[...Array(Math.ceil(days.length / 7))].map((_, weekIndex) => (
                <Typography key={weekIndex} variant="caption" color="text.secondary">
                  Week {weekIndex + 1}
                </Typography>
              ))}
            </Box>
          </Box>

          {/* Calendar Row */}
          <Box sx={{ display: 'flex', mb: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ width: 200, flexShrink: 0, pr: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Days →
              </Typography>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', position: 'relative' }}>
              {days.map((day, index) => {
                const isToday = isSameDay(day, new Date());
                return (
                  <Box
                    key={index}
                    sx={{
                      flex: 1,
                      textAlign: 'center',
                      borderRight: index < days.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      py: 0.5,
                      bgcolor: isToday ? 'primary.dark' : 'transparent',
                      opacity: isToday ? 0.3 : 1,
                    }}
                  >
                    <Typography variant="caption" sx={{ opacity: 0.5 }}>
                      {format(day, 'd')}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Events */}
          {eventsInRange.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.3 }} />
              <Typography variant="h6" color="text.secondary">
                No events in this time range
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Navigate to a different month or create new events
              </Typography>
            </Box>
          ) : (
            eventsInRange.map((event, index) => {
              const position = getEventPosition(event.date);
              const statusColor = getStatusColor(event.status);

              return (
                <Box
                  key={event.id}
                  sx={{
                    display: 'flex',
                    mb: 2,
                    alignItems: 'center',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                    },
                    p: 1,
                  }}
                >
                  {/* Event Info */}
                  <Box sx={{ width: 200, flexShrink: 0, pr: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                      {event.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={event.status}
                        size="small"
                        sx={{
                          bgcolor: statusColor,
                          color: 'white',
                          fontSize: '0.7rem',
                          height: 20,
                        }}
                      />
                      <Chip
                        label={event.category}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    </Box>
                  </Box>

                  {/* Timeline Bar */}
                  <Box sx={{ flex: 1, position: 'relative', height: 40, px: 2 }}>
                    {/* Background grid */}
                    {days.map((day, dayIndex) => (
                      <Box
                        key={dayIndex}
                        sx={{
                          position: 'absolute',
                          left: `${(dayIndex / days.length) * 100}%`,
                          width: `${(1 / days.length) * 100}%`,
                          height: '100%',
                          borderRight: dayIndex < days.length - 1 ? '1px solid' : 'none',
                          borderColor: 'divider',
                          opacity: 0.1,
                        }}
                      />
                    ))}

                    {/* Event Bar */}
                    <Tooltip
                      title={
                        <Box>
                          <Typography variant="subtitle2">{event.name}</Typography>
                          <Typography variant="caption">
                            {format(parseISO(event.date), 'PPP')}
                          </Typography>
                          <Typography variant="caption" display="block">
                            {event.location}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Status: {event.status}
                          </Typography>
                        </Box>
                      }
                      arrow
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          left: `${position}%`,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: statusColor,
                          border: '2px solid white',
                          boxShadow: 2,
                          zIndex: 10,
                          cursor: 'pointer',
                          '&:hover': {
                            width: 12,
                            height: 12,
                            boxShadow: 4,
                          },
                          transition: 'all 0.2s',
                        }}
                      />
                    </Tooltip>

                    {/* Event line/bar */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: `${position}%`,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: `${Math.max(3, 100 - position)}%`,
                        height: 2,
                        bgcolor: statusColor,
                        opacity: 0.3,
                      }}
                    />
                  </Box>
                </Box>
              );
            })
          )}
        </CardContent>
      </Card>

          {/* Legend */}
          <Paper sx={{
            p: 2,
            mt: 3,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            borderRadius: 2,
          }}>
            <Typography variant="subtitle2" gutterBottom>
              Status Legend
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {['Planning', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'].map(status => (
                <Chip
                  key={status}
                  label={status}
                  size="small"
                  sx={{
                    bgcolor: getStatusColor(status),
                    color: 'white',
                  }}
                />
              ))}
            </Box>
          </Paper>

          {/* Stats */}
          <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <Paper sx={{
              p: 2,
              background: 'rgba(33, 150, 243, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(33, 150, 243, 0.2)',
              boxShadow: '0 8px 32px 0 rgba(33, 150, 243, 0.2)',
              borderRadius: 2,
            }}>
              <Typography variant="h4" color="primary.main">
                {(events || []).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Events
              </Typography>
            </Paper>
            <Paper sx={{
              p: 2,
              background: 'rgba(76, 175, 80, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(76, 175, 80, 0.2)',
              boxShadow: '0 8px 32px 0 rgba(76, 175, 80, 0.2)',
              borderRadius: 2,
            }}>
              <Typography variant="h4" color="success.main">
                {(events || []).filter(e => e?.status === 'Completed').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </Paper>
            <Paper sx={{
              p: 2,
              background: 'rgba(255, 152, 0, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 152, 0, 0.2)',
              boxShadow: '0 8px 32px 0 rgba(255, 152, 0, 0.2)',
              borderRadius: 2,
            }}>
              <Typography variant="h4" color="warning.main">
                {(events || []).filter(e => e?.status === 'In Progress').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In Progress
              </Typography>
            </Paper>
            <Paper sx={{
              p: 2,
              background: 'rgba(33, 150, 243, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(33, 150, 243, 0.2)',
              boxShadow: '0 8px 32px 0 rgba(33, 150, 243, 0.2)',
              borderRadius: 2,
            }}>
              <Typography variant="h4" color="info.main">
                {(events || []).filter(e => e?.status && ['Planning', 'Confirmed'].includes(e.status)).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upcoming
              </Typography>
            </Paper>
          </Box>
        </>
      )}

      {/* AI Assistant FAB - Only show in project view with selected project */}
      {view === 'project' && selectedProject && (
        <Fab
          color="primary"
          aria-label="AI Assistant"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(135deg, #00d4ff 0%, #ff6b9d 100%)',
            boxShadow: '0 4px 20px rgba(0, 212, 255, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #00a3cc 0%, #cc4670 100%)',
              boxShadow: '0 6px 25px rgba(0, 212, 255, 0.6)',
            },
          }}
          onClick={() => setChatOpen(true)}
        >
          <AiIcon />
        </Fab>
      )}

      {/* AI Chat Assistant */}
      <EventChatAssistant
        event={events.find(e => e.id === selectedProject)}
        relatedOrders={orders.filter(o => o.eventId === selectedProject)}
        relatedTickets={tickets.filter(t => t.eventId === selectedProject)}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </Container>
  );
};

export default EventTimeline;
