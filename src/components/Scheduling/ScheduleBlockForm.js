import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAppState } from '../../context/AppStateContext';
import {
  createScheduleBlock,
  updateScheduleBlock,
  checkTimeSlotConflict,
  isValidTimeFormat,
  isValidTimeRange,
} from '../../services/scheduleService';
import toast from 'react-hot-toast';

const ScheduleBlockForm = ({ open, onClose, eventId, currentDay, block }) => {
  const { addScheduleBlock, updateScheduleBlock: updateScheduleBlockAction } = useAppState();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'session',
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    track: 'Main',
    capacity: '',
    requiresRegistration: false,
    speakers: [],
    volunteersRequired: 0,
    status: 'scheduled',
  });

  const [speakers, setSpeakers] = useState([{ name: '', title: '', bio: '' }]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Load block data when editing
  useEffect(() => {
    if (block) {
      setFormData({
        title: block.title || '',
        description: block.description || '',
        type: block.type || 'session',
        startTime: block.startTime || '09:00',
        endTime: block.endTime || '10:00',
        location: block.location || '',
        track: block.track || 'Main',
        capacity: block.capacity || '',
        requiresRegistration: block.requiresRegistration || false,
        speakers: block.speakers || [],
        volunteersRequired: block.volunteersRequired || 0,
        status: block.status || 'scheduled',
      });
      setSpeakers(block.speakers && block.speakers.length > 0 ? block.speakers : [{ name: '', title: '', bio: '' }]);
    } else {
      // Reset form for new block
      setFormData({
        title: '',
        description: '',
        type: 'session',
        startTime: '09:00',
        endTime: '10:00',
        location: '',
        track: 'Main',
        capacity: '',
        requiresRegistration: false,
        speakers: [],
        volunteersRequired: 0,
        status: 'scheduled',
      });
      setSpeakers([{ name: '', title: '', bio: '' }]);
    }
    setErrors({});
  }, [block, open]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSpeakerChange = (index, field, value) => {
    const updatedSpeakers = [...speakers];
    updatedSpeakers[index][field] = value;
    setSpeakers(updatedSpeakers);
  };

  const handleAddSpeaker = () => {
    setSpeakers([...speakers, { name: '', title: '', bio: '' }]);
  };

  const handleRemoveSpeaker = (index) => {
    const updatedSpeakers = speakers.filter((_, i) => i !== index);
    setSpeakers(updatedSpeakers);
  };

  const validateForm = async () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.startTime || !isValidTimeFormat(formData.startTime)) {
      newErrors.startTime = 'Valid start time is required (HH:MM)';
    }

    if (!formData.endTime || !isValidTimeFormat(formData.endTime)) {
      newErrors.endTime = 'Valid end time is required (HH:MM)';
    }

    if (formData.startTime && formData.endTime && !isValidTimeRange(formData.startTime, formData.endTime)) {
      newErrors.endTime = 'End time must be after start time';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (formData.requiresRegistration && !formData.capacity) {
      newErrors.capacity = 'Capacity is required when registration is enabled';
    }

    // Check for time slot conflicts
    if (formData.location && formData.startTime && formData.endTime && !newErrors.startTime && !newErrors.endTime) {
      setLoading(true);
      const { hasConflict, conflictingBlocks } = await checkTimeSlotConflict(
        eventId,
        formData.location,
        currentDay,
        formData.startTime,
        formData.endTime,
        block?.id // Exclude current block when editing
      );
      setLoading(false);

      if (hasConflict) {
        newErrors.timeSlot = `Conflict detected with: ${conflictingBlocks.map(b => b.title).join(', ')}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!await validateForm()) {
      return;
    }

    setLoading(true);

    // Filter out empty speakers
    const filteredSpeakers = speakers.filter(s => s.name.trim() !== '');

    const blockData = {
      ...formData,
      eventId,
      day: currentDay,
      date: new Date().toISOString(), // Should be calculated from event start date + day
      speakers: filteredSpeakers,
      capacity: formData.capacity ? parseInt(formData.capacity) : null,
      volunteersRequired: parseInt(formData.volunteersRequired) || 0,
      registered: block?.registered || 0,
      attended: block?.attended || 0,
      assignedVolunteers: block?.assignedVolunteers || [],
      registeredUsers: block?.registeredUsers || [],
    };

    try {
      if (block) {
        // Update existing block
        const { error } = await updateScheduleBlock(block.id, blockData);
        if (error) {
          toast.error('Failed to update schedule block');
          console.error(error);
        } else {
          updateScheduleBlockAction({ id: block.id, ...blockData });
          toast.success('Schedule block updated successfully');
          onClose();
        }
      } else {
        // Create new block
        const { id, error } = await createScheduleBlock(blockData);
        if (error) {
          toast.error('Failed to create schedule block');
          console.error(error);
        } else {
          addScheduleBlock({ id, ...blockData });
          toast.success('Schedule block created successfully');
          onClose();
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const blockTypes = [
    { value: 'session', label: 'Session' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'keynote', label: 'Keynote' },
    { value: 'break', label: 'Break' },
    { value: 'meal', label: 'Meal' },
    { value: 'networking', label: 'Networking' },
  ];

  const statusOptions = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {block ? 'Edit Schedule Block' : 'Add Schedule Block'} - Day {currentDay}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Title */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              error={!!errors.title}
              helperText={errors.title}
              required
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={2}
            />
          </Grid>

          {/* Type and Track */}
          <Grid item xs={6}>
            <TextField
              fullWidth
              select
              label="Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
            >
              {blockTypes.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Track"
              name="track"
              value={formData.track}
              onChange={handleChange}
              helperText="e.g., Main, Track A, Track B"
            />
          </Grid>

          {/* Time */}
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Start Time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              error={!!errors.startTime}
              helperText={errors.startTime || 'Format: HH:MM'}
              placeholder="09:00"
              required
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="End Time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              error={!!errors.endTime}
              helperText={errors.endTime || 'Format: HH:MM'}
              placeholder="10:00"
              required
            />
          </Grid>

          {/* Time Slot Conflict Warning */}
          {errors.timeSlot && (
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 0, 0, 0.3)',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" color="error">
                  ⚠️ {errors.timeSlot}
                </Typography>
              </Box>
            </Grid>
          )}

          {/* Location */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              error={!!errors.location}
              helperText={errors.location}
              required
            />
          </Grid>

          {/* Capacity and Registration */}
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Capacity"
              name="capacity"
              type="number"
              value={formData.capacity}
              onChange={handleChange}
              error={!!errors.capacity}
              helperText={errors.capacity}
            />
          </Grid>

          <Grid item xs={6}>
            <FormControlLabel
              control={
                <Checkbox
                  name="requiresRegistration"
                  checked={formData.requiresRegistration}
                  onChange={handleChange}
                />
              }
              label="Requires Registration"
            />
          </Grid>

          {/* Volunteers Required */}
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Volunteers Required"
              name="volunteersRequired"
              type="number"
              value={formData.volunteersRequired}
              onChange={handleChange}
            />
          </Grid>

          {/* Status */}
          <Grid item xs={6}>
            <TextField
              fullWidth
              select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              {statusOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Speakers */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              Speakers
            </Typography>
            {speakers.map((speaker, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={speaker.name}
                      onChange={(e) => handleSpeakerChange(index, 'name', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Title"
                      value={speaker.title}
                      onChange={(e) => handleSpeakerChange(index, 'title', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Bio"
                      value={speaker.bio}
                      onChange={(e) => handleSpeakerChange(index, 'bio', e.target.value)}
                      multiline
                      rows={2}
                    />
                  </Grid>
                  {speakers.length > 1 && (
                    <Grid item xs={12}>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleRemoveSpeaker(index)}
                      >
                        Remove Speaker
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </Box>
            ))}
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddSpeaker}
              variant="outlined"
            >
              Add Speaker
            </Button>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Saving...' : (block ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScheduleBlockForm;
