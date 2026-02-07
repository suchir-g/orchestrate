import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Fab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  CalendarMonth as CalendarIcon,
  ViewWeek as WeekIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  LockOutlined as LockIcon,
} from '@mui/icons-material';
import { useAppState } from '../../context/AppStateContext';
import { useAuth } from '../../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import * as authService from '../../services/authorizationService';
import {
  getAllScheduleBlocks,
  getScheduleBlocksByDay,
  deleteScheduleBlock,
} from '../../services/scheduleService';
import toast from 'react-hot-toast';
import ScheduleBlockForm from './ScheduleBlockForm';
import HourByHourGrid from './HourByHourGrid';

const ScheduleBuilder = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { events, scheduleBlocks, setScheduleBlocks, deleteScheduleBlock: deleteScheduleBlockAction, setLoading } = useAppState();
  const { userRoles } = useAuth();

  const [currentEvent, setCurrentEvent] = useState(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [dayBlocks, setDayBlocks] = useState([]);
  
  // Permission check
  const userRole = userRoles[eventId];
  const canEdit = userRole === 'admin';

  // Load current event
  useEffect(() => {
    if (eventId && events.length > 0) {
      const event = events.find(e => e.id === eventId);
      setCurrentEvent(event);

      // Set default day to 1
      if (event && event.durationDays) {
        setSelectedDay(1);
      }
    }
  }, [eventId, events]);

  // Load schedule blocks for the event
  useEffect(() => {
    const loadScheduleBlocks = async () => {
      if (!eventId) return;

      setLoading({ scheduleBlocks: true });
      const { data, error } = await getAllScheduleBlocks(eventId);

      if (error) {
        toast.error('Failed to load schedule blocks');
        console.error(error);
      } else {
        setScheduleBlocks(data || []);
      }

      setLoading({ scheduleBlocks: false });
    };

    loadScheduleBlocks();
  }, [eventId, setScheduleBlocks, setLoading]);

  // Filter blocks by selected day
  useEffect(() => {
    if (scheduleBlocks && scheduleBlocks.length > 0) {
      const filtered = scheduleBlocks.filter(block => block.day === selectedDay);
      setDayBlocks(filtered);
    } else {
      setDayBlocks([]);
    }
  }, [scheduleBlocks, selectedDay]);

  const handleDayChange = (event, newDay) => {
    setSelectedDay(newDay);
  };

  const handleAddBlock = () => {
    setSelectedBlock(null);
    setOpenDialog(true);
  };

  const handleEditBlock = (block) => {
    setSelectedBlock(block);
    setOpenDialog(true);
  };

  const handleDeleteBlock = async (blockId) => {
    if (!window.confirm('Are you sure you want to delete this schedule block?')) {
      return;
    }

    const { error } = await deleteScheduleBlock(blockId);

    if (error) {
      toast.error('Failed to delete schedule block');
      console.error(error);
    } else {
      deleteScheduleBlockAction(blockId);
      toast.success('Schedule block deleted successfully');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBlock(null);
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

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Permission Alert */}
      {!canEdit && (
        <Alert severity="info" sx={{ mb: 3 }} icon={<LockIcon />}>
          You are viewing the schedule in read-only mode. Only administrators can modify the schedule.
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(`/event/${eventId}`)}
          sx={{ mb: 2 }}
        >
          Back to Event Details
        </Button>

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
          Schedule Builder
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {currentEvent.name} - {currentEvent?.durationDays} Day{currentEvent?.durationDays > 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Day Tabs */}
      <Paper
        sx={{
          mb: 3,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Tabs
            value={selectedDay}
            onChange={handleDayChange}
            sx={{
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
              '& .Mui-selected': {
                color: '#00d4ff !important',
              },
            }}
          >
            {Array.from({ length: currentEvent?.durationDays || 1 }, (_, i) => i + 1).map(day => (
              <Tab
                key={day}
                label={`Day ${day}`}
                value={day}
                icon={<CalendarIcon />}
                iconPosition="start"
              />
            ))}
          </Tabs>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant={viewMode === 'grid' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('grid')}
              startIcon={<WeekIcon />}
            >
              Grid View
            </Button>
            <Button
              variant={viewMode === 'list' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('list')}
            >
              List View
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Schedule Content */}
      {viewMode === 'grid' ? (
        <HourByHourGrid
          dayBlocks={dayBlocks}
          currentDay={selectedDay}
          eventId={eventId}
          onEditBlock={handleEditBlock}
          onDeleteBlock={handleDeleteBlock}
        />
      ) : (
        <Grid container spacing={3}>
          {dayBlocks.length === 0 ? (
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 4,
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                  No schedule blocks for Day {selectedDay}
                </Typography>
                {canEdit && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddBlock}
                  >
                    Add Schedule Block
                  </Button>
                )}
              </Paper>
            </Grid>
          ) : (
            dayBlocks.map(block => (
              <Grid item xs={12} md={6} lg={4} key={block.id}>
                <Card
                  sx={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderLeft: `4px solid ${getTypeColor(block.type)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box>
                        <Chip
                          label={block.type}
                          size="small"
                          sx={{
                            backgroundColor: getTypeColor(block.type),
                            color: 'white',
                            mb: 1
                          }}
                        />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {block.title}
                        </Typography>
                      </Box>
                      {canEdit && (
                        <Box>
                          <IconButton
                            size="small"
                            onClick={() => handleEditBlock(block)}
                            sx={{ color: '#00d4ff' }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteBlock(block.id)}
                            sx={{ color: '#ff6b9d' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      )}
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {block.description || 'No description'}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        ⏰ {block.startTime} - {block.endTime}
                      </Typography>
                      <Typography variant="body2">
                        📍 {block.location}
                      </Typography>
                      {block.track && (
                        <Typography variant="body2">
                          🎯 Track: {block.track}
                        </Typography>
                      )}
                      {block.speakers && block.speakers.length > 0 && (
                        <Typography variant="body2">
                          🎤 {block.speakers.map(s => s.name).join(', ')}
                        </Typography>
                      )}
                      {block.capacity && (
                        <Typography variant="body2">
                          👥 {block.registered || 0} / {block.capacity} registered
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      <Chip
                        label={block.status || 'scheduled'}
                        color={getStatusColor(block.status)}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Floating Add Button */}
      {canEdit && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            background: 'linear-gradient(45deg, #00d4ff 30%, #ff6b9d 90%)',
          }}
          onClick={handleAddBlock}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Schedule Block Form Dialog */}
      <ScheduleBlockForm
        open={openDialog}
        onClose={handleCloseDialog}
        eventId={eventId}
        currentDay={selectedDay}
        block={selectedBlock}
      />
    </Container>
  );
};

export default ScheduleBuilder;
