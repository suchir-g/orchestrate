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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
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
  ChevronLeft,
  ChevronRight,
  ViewWeek as WeekViewIcon,
  ViewModule as MonthViewIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAppState } from '../../context/AppStateContext';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, addDays, isSameMonth, addMonths, subMonths } from 'date-fns';
import { getAllScheduleBlocks } from '../../services/scheduleService';
import EventChatAssistant from '../Chat/EventChatAssistant';

const EventTimeline = () => {
  const { events = [], orders = [], tickets = [], shipments = [] } = useAppState();
  const navigate = useNavigate();
  const [view, setView] = useState('calendar'); // 'calendar', 'project'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProject, setSelectedProject] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [allScheduleBlocks, setAllScheduleBlocks] = useState([]);

  // Load all schedule blocks for all events
  useEffect(() => {
    const loadAllScheduleBlocks = async () => {
      const allBlocks = [];
      for (const event of events) {
        const { data, error } = await getAllScheduleBlocks(event.id);
        if (!error && data) {
          allBlocks.push(...data.map(block => ({ ...block, eventId: event.id })));
        }
      }
      setAllScheduleBlocks(allBlocks);
    };

    if (events.length > 0) {
      loadAllScheduleBlocks();
    }
  }, [events]);

  // Get calendar month days
  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const calendarDays = getCalendarDays();

  // Get events for a specific day
  const getEventsForDay = (day) => {
    return events.filter(event => {
      if (!event || !event.date) return false;
      try {
        const eventDate = parseISO(event.date);
        return isSameDay(eventDate, day);
      } catch (error) {
        return false;
      }
    });
  };

  // Get schedule blocks for a specific day
  const getScheduleBlocksForDay = (day) => {
    return allScheduleBlocks.filter(block => {
      if (!block || !block.date) return false;
      try {
        const blockDate = parseISO(block.date);
        return isSameDay(blockDate, day);
      } catch (error) {
        return false;
      }
    });
  };

  // Get orders for a specific day
  const getOrdersForDay = (day) => {
    return orders.filter(order => {
      if (!order || !order.orderDate) return false;
      try {
        const orderDate = parseISO(order.orderDate);
        return isSameDay(orderDate, day);
      } catch (error) {
        return false;
      }
    });
  };

  // Get shipments for a specific day (by delivery date)
  const getShipmentsForDay = (day) => {
    return shipments.filter(shipment => {
      if (!shipment || !shipment.deliveryDate) return false;
      try {
        const shipmentDate = parseISO(shipment.deliveryDate);
        return isSameDay(shipmentDate, day);
      } catch (error) {
        return false;
      }
    });
  };

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
      case 'scheduled': return '#2196f3';
      case 'in_progress': return '#ff9800';
      case 'completed': return '#4caf50';
      case 'cancelled': return '#f44336';
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
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle day click
  const handleDayClick = (day) => {
    const dayEvents = getEventsForDay(day);
    const dayBlocks = getScheduleBlocksForDay(day);
    const dayOrders = getOrdersForDay(day);
    const dayShipments = getShipmentsForDay(day);

    if (dayEvents.length > 0 || dayBlocks.length > 0 || dayOrders.length > 0 || dayShipments.length > 0) {
      setSelectedDay({
        day,
        events: dayEvents,
        blocks: dayBlocks,
        orders: dayOrders,
        shipments: dayShipments
      });
      setDayDialogOpen(true);
    }
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

  const getTypeColor = (type) => {
    switch (type) {
      case 'keynote': return '#ff6b9d';
      case 'workshop': return '#00d4ff';
      case 'session': return '#4caf50';
      case 'break': return '#9e9e9e';
      case 'meal': return '#ff9800';
      case 'networking': return '#9c27b0';
      default: return '#2196f3';
    }
  };

  // Calendar Month View Component
  const CalendarView = () => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <Box>
        {/* Calendar Grid */}
        <Paper
          sx={{
            p: 3,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
          }}
        >
          {/* Week Day Headers */}
          <Grid container spacing={0} sx={{ mb: 1 }}>
            {weekDays.map((day) => (
              <Grid item xs={12/7} key={day}>
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 2,
                    borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={700}>
                    {day}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Calendar Days Grid */}
          <Grid container spacing={0.5}>
            {calendarDays.map((day, index) => {
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentDate);
              const dayEvents = getEventsForDay(day);
              const dayBlocks = getScheduleBlocksForDay(day);
              const dayOrders = getOrdersForDay(day);
              const dayShipments = getShipmentsForDay(day);
              const hasActivity = dayEvents.length > 0 || dayBlocks.length > 0 || dayOrders.length > 0 || dayShipments.length > 0;

              return (
                <Grid item xs={12/7} key={index}>
                  <Paper
                    onClick={() => hasActivity && handleDayClick(day)}
                    sx={{
                      minHeight: 120,
                      p: 1,
                      background: isToday
                        ? 'rgba(0, 212, 255, 0.1)'
                        : isCurrentMonth
                        ? 'rgba(255, 255, 255, 0.03)'
                        : 'rgba(255, 255, 255, 0.01)',
                      backdropFilter: 'blur(10px)',
                      border: isToday
                        ? '2px solid #00d4ff'
                        : '1px solid rgba(255, 255, 255, 0.05)',
                      cursor: hasActivity ? 'pointer' : 'default',
                      '&:hover': hasActivity ? {
                        background: 'rgba(0, 212, 255, 0.15)',
                        transform: 'scale(1.02)',
                        transition: 'all 0.2s ease',
                      } : {},
                      opacity: isCurrentMonth ? 1 : 0.5,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                      <Typography
                        variant="body2"
                        fontWeight={isToday ? 700 : 500}
                        color={isToday ? 'primary' : 'text.secondary'}
                      >
                        {format(day, 'd')}
                      </Typography>
                      {hasActivity && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: '#00d4ff',
                          }}
                        />
                      )}
                    </Box>

                    {/* Events, Blocks, Orders, and Shipments for this day */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {dayEvents.slice(0, 1).map((event, idx) => (
                        <Chip
                          key={idx}
                          label={event.name}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            bgcolor: getStatusColor(event.status),
                            color: 'white',
                            '& .MuiChip-label': {
                              px: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            },
                          }}
                        />
                      ))}

                      {dayBlocks.slice(0, 1).map((block, idx) => (
                        <Chip
                          key={`block-${idx}`}
                          label={block.title}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.6rem',
                            bgcolor: getTypeColor(block.type),
                            color: 'white',
                            '& .MuiChip-label': {
                              px: 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            },
                          }}
                        />
                      ))}

                      {dayOrders.slice(0, 1).map((order, idx) => (
                        <Chip
                          key={`order-${idx}`}
                          label={`📦 ${order.customerName || 'Order'}`}
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: '0.55rem',
                            bgcolor: '#9c27b0',
                            color: 'white',
                            '& .MuiChip-label': {
                              px: 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            },
                          }}
                        />
                      ))}

                      {dayShipments.slice(0, 1).map((shipment, idx) => (
                        <Chip
                          key={`shipment-${idx}`}
                          label={`🚚 ${shipment.carrier || 'Delivery'}`}
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: '0.55rem',
                            bgcolor: '#ff5722',
                            color: 'white',
                            '& .MuiChip-label': {
                              px: 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            },
                          }}
                        />
                      ))}

                      {(dayEvents.length + dayBlocks.length + dayOrders.length + dayShipments.length) > 4 && (
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.6rem',
                            color: 'primary.main',
                            textAlign: 'center',
                            mt: 0.5,
                          }}
                        >
                          +{dayEvents.length + dayBlocks.length + dayOrders.length + dayShipments.length - 4} more
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Paper>

        {/* Legend */}
        <Paper
          sx={{
            p: 2,
            mt: 3,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle2" gutterBottom fontWeight={600}>
            Calendar Legend
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={6} sm={4} md={3}>
              <Chip label="Event" size="small" sx={{ bgcolor: '#2196f3', color: 'white', width: '100%' }} />
            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <Chip label="Keynote" size="small" sx={{ bgcolor: '#ff6b9d', color: 'white', width: '100%' }} />
            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <Chip label="Workshop" size="small" sx={{ bgcolor: '#00d4ff', color: 'white', width: '100%' }} />
            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <Chip label="Session" size="small" sx={{ bgcolor: '#4caf50', color: 'white', width: '100%' }} />
            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <Chip label="Meal" size="small" sx={{ bgcolor: '#ff9800', color: 'white', width: '100%' }} />
            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <Chip label="📦 Order" size="small" sx={{ bgcolor: '#9c27b0', color: 'white', width: '100%' }} />
            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <Chip label="🚚 Shipment" size="small" sx={{ bgcolor: '#ff5722', color: 'white', width: '100%' }} />
            </Grid>
          </Grid>
        </Paper>
      </Box>
    );
  };

  // Day Detail Dialog - Enhanced with comprehensive information
  const DayDetailDialog = () => {
    if (!selectedDay) return null;

    const { day, events: dayEvents, blocks: dayBlocks, orders: dayOrders = [], shipments: dayShipments = [] } = selectedDay;
    const totalActivities = dayEvents.length + dayBlocks.length + dayOrders.length + dayShipments.length;

    return (
      <Dialog
        open={dayDialogOpen}
        onClose={() => setDayDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {format(day, 'EEEE, MMMM d, yyyy')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {totalActivities} {totalActivities === 1 ? 'activity' : 'activities'} scheduled
              </Typography>
            </Box>
            <IconButton onClick={() => setDayDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Summary Stats */}
          {totalActivities > 0 && (
            <Paper
              sx={{
                p: 2,
                mb: 3,
                background: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                borderRadius: 2,
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {dayEvents.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Events
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {dayBlocks.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Schedule Blocks
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {dayOrders.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Orders
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {dayShipments.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Shipments
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Events */}
          {dayEvents.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventIcon color="primary" />
                Events ({dayEvents.length})
              </Typography>
              <Grid container spacing={2}>
                {dayEvents.map((event, idx) => (
                  <Grid item xs={12} key={idx}>
                    <Card
                      onClick={() => {
                        setDayDialogOpen(false);
                        navigate(`/event/${event.id}`);
                      }}
                      sx={{
                        cursor: 'pointer',
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 0.1)',
                          transform: 'translateY(-2px)',
                          boxShadow: 4,
                        },
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                              {event.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {event.description || 'No description available'}
                            </Typography>
                          </Box>
                          <Chip
                            label={event.status}
                            size="small"
                            sx={{ bgcolor: getStatusColor(event.status), color: 'white', fontWeight: 600 }}
                          />
                        </Box>
                        <Divider sx={{ my: 1, opacity: 0.1 }} />
                        <Grid container spacing={1}>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {event.location}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {event.capacity || 'N/A'} capacity
                              </Typography>
                            </Box>
                          </Grid>
                          {event.tickets && (
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TicketIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {event.tickets.sold || 0}/{event.tickets.total || 0} tickets sold
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                          {event.category && (
                            <Grid item xs={12} sm={6}>
                              <Chip label={event.category} size="small" variant="outlined" />
                            </Grid>
                          )}
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Schedule Blocks */}
          {dayBlocks.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon color="primary" />
                Daily Schedule ({dayBlocks.length} blocks)
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                Click any session to view or edit in the schedule builder
              </Typography>
              <Grid container spacing={2}>
                {dayBlocks.sort((a, b) => {
                  const timeA = a.startTime?.split(':').map(Number) || [0, 0];
                  const timeB = b.startTime?.split(':').map(Number) || [0, 0];
                  return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
                }).map((block, idx) => {
                  const event = events.find(e => e.id === block.eventId);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={idx}>
                      <Card
                        onClick={() => {
                          setDayDialogOpen(false);
                          navigate(`/schedule/${block.eventId}`);
                        }}
                        sx={{
                          cursor: 'pointer',
                          background: 'rgba(255, 255, 255, 0.05)',
                          backdropFilter: 'blur(10px)',
                          borderLeft: `4px solid ${getTypeColor(block.type)}`,
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          transition: 'all 0.3s ease',
                          height: '100%',
                          '&:hover': {
                            background: 'rgba(255, 255, 255, 0.1)',
                            transform: 'translateY(-2px)',
                            boxShadow: 3,
                          },
                        }}
                      >
                        <CardContent>
                          <Chip
                            label={block.type}
                            size="small"
                            sx={{
                              bgcolor: getTypeColor(block.type),
                              color: 'white',
                              mb: 1,
                              fontWeight: 600,
                            }}
                          />
                          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            {block.title}
                          </Typography>
                          {block.description && (
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                              {block.description.length > 80
                                ? `${block.description.substring(0, 80)}...`
                                : block.description}
                            </Typography>
                          )}
                          <Divider sx={{ my: 1, opacity: 0.1 }} />
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <ScheduleIcon sx={{ fontSize: 14 }} />
                              {block.startTime} - {block.endTime}
                            </Typography>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LocationIcon sx={{ fontSize: 14 }} />
                              {block.location}
                            </Typography>
                            {block.track && (
                              <Typography variant="caption" color="text.secondary">
                                🎯 Track: {block.track}
                              </Typography>
                            )}
                            {block.capacity && (
                              <Typography variant="caption" color="text.secondary">
                                👥 Capacity: {block.capacity} | Registered: {block.registered || 0}
                              </Typography>
                            )}
                            {block.speakers && block.speakers.length > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                🎤 {block.speakers.map(s => s.name).join(', ')}
                              </Typography>
                            )}
                          </Box>
                          {event && (
                            <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                              <Typography variant="caption" color="primary">
                                Part of: {event.name}
                              </Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}

          {/* Orders */}
          {dayOrders.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TodoIcon color="primary" />
                Orders ({dayOrders.length})
              </Typography>
              <Grid container spacing={2}>
                {dayOrders.map((order, idx) => (
                  <Grid item xs={12} sm={6} key={idx}>
                    <Card
                      onClick={() => navigate('/orders')}
                      sx={{
                        cursor: 'pointer',
                        background: 'rgba(156, 39, 176, 0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(156, 39, 176, 0.3)',
                        borderLeft: '4px solid #9c27b0',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: 'rgba(156, 39, 176, 0.2)',
                          transform: 'translateY(-2px)',
                          boxShadow: 3,
                        },
                      }}
                    >
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                          📦 {order.customerName || 'Order'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {order.items?.length || 0} items - ${order.totalAmount?.toFixed(2) || '0.00'}
                        </Typography>
                        <Divider sx={{ my: 1, opacity: 0.1 }} />
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Order ID: {order.id?.substring(0, 8)}
                          </Typography>
                          {order.deliveryAddress && (
                            <Typography variant="caption" color="text.secondary">
                              📍 {order.deliveryAddress}
                            </Typography>
                          )}
                          <Chip
                            label={order.paymentStatus || 'pending'}
                            size="small"
                            sx={{
                              mt: 1,
                              width: 'fit-content',
                              bgcolor: order.paymentStatus === 'paid' ? '#4caf50' : '#ff9800',
                              color: 'white',
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Shipments */}
          {dayShipments.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShippingIcon color="primary" />
                Shipments ({dayShipments.length})
              </Typography>
              <Grid container spacing={2}>
                {dayShipments.map((shipment, idx) => (
                  <Grid item xs={12} sm={6} key={idx}>
                    <Card
                      onClick={() => navigate('/shipments')}
                      sx={{
                        cursor: 'pointer',
                        background: 'rgba(255, 87, 34, 0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 87, 34, 0.3)',
                        borderLeft: '4px solid #ff5722',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: 'rgba(255, 87, 34, 0.2)',
                          transform: 'translateY(-2px)',
                          boxShadow: 3,
                        },
                      }}
                    >
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                          🚚 {shipment.carrier || 'Shipment'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Tracking: {shipment.trackingNumber || 'N/A'}
                        </Typography>
                        <Divider sx={{ my: 1, opacity: 0.1 }} />
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {shipment.origin && (
                            <Typography variant="caption" color="text.secondary">
                              From: {shipment.origin}
                            </Typography>
                          )}
                          {shipment.destination && (
                            <Typography variant="caption" color="text.secondary">
                              To: {shipment.destination}
                            </Typography>
                          )}
                          {shipment.deliveryDate && (
                            <Typography variant="caption" color="text.secondary">
                              📅 Expected: {format(parseISO(shipment.deliveryDate), 'PPP')}
                            </Typography>
                          )}
                          <Chip
                            label={shipment.status || 'in_transit'}
                            size="small"
                            sx={{
                              mt: 1,
                              width: 'fit-content',
                              bgcolor: shipment.status === 'delivered' ? '#4caf50' : '#2196f3',
                              color: 'white',
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {dayEvents.length === 0 && dayBlocks.length === 0 && dayOrders.length === 0 && dayShipments.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CalendarIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Activities Scheduled
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This day has no events, schedule blocks, orders, or shipments
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setDayDialogOpen(false)}
            >
              Close
            </Button>
            {dayEvents.length > 0 && (
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  setDayDialogOpen(false);
                  navigate(`/event/${dayEvents[0].id}`);
                }}
              >
                View Event Details
              </Button>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    );
  };

  // Project Detail View Component (existing code continues...)
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

          <Button
            variant="contained"
            onClick={() => navigate(`/event/${event.id}`)}
            sx={{ mt: 2 }}
          >
            View Event Details
          </Button>
        </Paper>

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
              📅 Event Timeline & Calendar
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {view === 'calendar' ? 'Monthly calendar view with all events and activities' : 'Detailed project timeline and milestones'}
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
            <ToggleButton value="calendar">
              <MonthViewIcon sx={{ mr: 1 }} />
              Calendar
            </ToggleButton>
            <ToggleButton value="project">
              <TimelineIcon sx={{ mr: 1 }} />
              Project
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Month Navigation - Show for calendar view */}
        {view === 'calendar' && (
          <Paper sx={{
            p: 2,
            mb: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
          }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                onClick={goToPreviousMonth}
                variant="outlined"
                size="small"
                startIcon={<ChevronLeft />}
              >
                Previous Month
              </Button>
              <Button onClick={goToToday} variant="contained" size="small">
                This Month
              </Button>
              <Button
                onClick={goToNextMonth}
                variant="outlined"
                size="small"
                endIcon={<ChevronRight />}
              >
                Next Month
              </Button>
            </Box>

            <Typography variant="h5" fontWeight={700}>
              {format(currentDate, 'MMMM yyyy')}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {eventsInRange.length} events this month
              </Typography>
            </Box>
          </Paper>
        )}

        {/* Project Selector - Only show in project view */}
        {view === 'project' && events.length > 0 && (
          <Paper sx={{
            p: 2,
            mb: 3,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
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
      {view === 'calendar' && <CalendarView />}
      {view === 'project' && (
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
      )}

      {/* Day Detail Dialog */}
      <DayDetailDialog />

      {/* AI Assistant FAB */}
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
