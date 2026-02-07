import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Stack
} from '@mui/material';
import * as authService from '../../services/authorizationService';

const VolunteerRequestForm = ({ eventId, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    taskType: '',
    requiredCount: 1,
    skillsRequired: [],
    timeSlot: {
      date: '',
      startTime: '',
      endTime: ''
    },
    location: '',
    description: ''
  });

  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);

  const taskTypes = [
    'registration',
    'technical_support',
    'catering',
    'logistics',
    'setup',
    'cleanup',
    'security',
    'other'
  ];

  const skills = [
    'technical',
    'communication',
    'logistics',
    'catering',
    'first_aid',
    'customer_service'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('timeSlot_')) {
      const timeKey = name.replace('timeSlot_', '');
      setFormData(prev => ({
        ...prev,
        timeSlot: {
          ...prev.timeSlot,
          [timeKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSkillsChange = (e) => {
    setFormData(prev => ({
      ...prev,
      skillsRequired: e.target.value
    }));
  };

  const handleValidate = async () => {
    setLoading(true);
    try {
      // Create volunteer request object for validation
      const volunteerRequest = {
        ...formData,
        timeSlot: {
          startTime: new Date(`${formData.timeSlot.date}T${formData.timeSlot.startTime}`),
          endTime: new Date(`${formData.timeSlot.date}T${formData.timeSlot.endTime}`)
        }
      };

      // Validate (checking for time/location conflicts)
      const validation = authService.validateVolunteerRequest(volunteerRequest, []);
      setConflicts(validation.conflicts);
      return validation.isValid;
    } catch (error) {
      console.error('Error validating volunteer request:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const isValid = await handleValidate();

    if (!isValid && conflicts.length > 0) {
      const shouldContinue = window.confirm(
        `There are ${conflicts.length} potential conflict(s). Continue anyway?`
      );
      if (!shouldContinue) return;
    }

    onSubmit({
      ...formData,
      eventId,
      timeSlot: {
        date: new Date(formData.timeSlot.date),
        startTime: formData.timeSlot.startTime,
        endTime: formData.timeSlot.endTime
      }
    });
  };

  const isFormValid = formData.taskType && formData.location && 
                     formData.timeSlot.date && formData.timeSlot.startTime && 
                     formData.timeSlot.endTime;

  return (
    <>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Request Volunteers
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2}>
          {conflicts.length > 0 && (
            <Alert severity="warning">
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Potential Conflicts:
              </Typography>
              {conflicts.map((conflict, idx) => (
                <Typography key={idx} variant="caption" display="block" sx={{ mb: 0.5 }}>
                  • {conflict.message}
                </Typography>
              ))}
            </Alert>
          )}

          <FormControl fullWidth>
            <InputLabel>Task Type</InputLabel>
            <Select
              name="taskType"
              value={formData.taskType}
              onChange={handleChange}
              label="Task Type"
            >
              {taskTypes.map(task => (
                <MenuItem key={task} value={task}>
                  {task.replace(/_/g, ' ').charAt(0).toUpperCase() + 
                   task.replace(/_/g, ' ').slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Number of Volunteers Needed"
            name="requiredCount"
            type="number"
            value={formData.requiredCount}
            onChange={handleChange}
            inputProps={{ min: 1 }}
          />

          <FormControl fullWidth>
            <InputLabel>Required Skills</InputLabel>
            <Select
              name="skillsRequired"
              multiple
              value={formData.skillsRequired}
              onChange={handleSkillsChange}
              label="Required Skills"
            >
              {skills.map(skill => (
                <MenuItem key={skill} value={skill}>
                  {skill.replace(/_/g, ' ').charAt(0).toUpperCase() + 
                   skill.replace(/_/g, ' ').slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Date"
              name="timeSlot_date"
              type="date"
              value={formData.timeSlot.date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Start Time"
              name="timeSlot_startTime"
              type="time"
              value={formData.timeSlot.startTime}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="End Time"
              name="timeSlot_endTime"
              type="time"
              value={formData.timeSlot.endTime}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
          </Box>

          <TextField
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            fullWidth
            placeholder="Where do you need the volunteers?"
          />

          <TextField
            label="Description / Notes"
            name="description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
            placeholder="Provide details about the task..."
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isFormValid || loading}
        >
          {loading ? 'Validating...' : 'Submit Request'}
        </Button>
      </DialogActions>
    </>
  );
};

export default VolunteerRequestForm;
