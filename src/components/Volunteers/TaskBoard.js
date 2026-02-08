import React, { useState, useMemo, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Chip,
    IconButton,
    Button,
    Paper,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Avatar,
    AvatarGroup,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemSecondaryAction,
    InputAdornment,
    Divider
} from '@mui/material';
import {
    Add as AddIcon,
    ViewList as ListIcon,
    ViewTimeline as GanttIcon,
    AccessTime as TimeIcon,
    Person as PersonIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Warning as WarningIcon,
    Search as SearchIcon,
    CheckCircle as CheckCircleIcon,
    PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { useAppState } from '../../context/AppStateContext';
import { format, parseISO, differenceInMinutes, addMinutes, startOfHour, getHours, isValid } from 'date-fns';
import {
    addTimeSlot,
    createVolunteerTask,
    updateVolunteerTask,
    deleteVolunteerTask,
    updateTimeSlot,
    deleteTimeSlot,
    assignVolunteerToTimeSlot,
    unassignVolunteerFromTimeSlot
} from '../../services/volunteerTaskService';

const TaskScheduleDialog = ({ open, onClose, task, eventId }) => {
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [requiredVolunteers, setRequiredVolunteers] = useState(1);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const timeSlotData = {
                date,
                startTime,
                endTime,
                requiredVolunteers: parseInt(requiredVolunteers),
                assignedVolunteers: []
            };

            await addTimeSlot(task.id, timeSlotData);
            onClose();
        } catch (error) {
            console.error("Failed to schedule task:", error);
            alert("Failed to schedule task");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#1e1e2d', color: 'white' } }}>
            <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                Schedule Task
                <Typography variant="subtitle2" color="text.secondary">{task?.name}</Typography>
            </DialogTitle>
            <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    label="Date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={{ input: { color: 'white' }, label: { color: 'text.secondary' }, fieldset: { borderColor: 'rgba(255,255,255,0.2)' } }}
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        label="Start Time"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ input: { color: 'white' }, label: { color: 'text.secondary' }, fieldset: { borderColor: 'rgba(255,255,255,0.2)' } }}
                    />
                    <TextField
                        label="End Time"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        sx={{ input: { color: 'white' }, label: { color: 'text.secondary' }, fieldset: { borderColor: 'rgba(255,255,255,0.2)' } }}
                    />
                </Box>
                <TextField
                    label="Volunteers Needed"
                    type="number"
                    value={requiredVolunteers}
                    onChange={(e) => setRequiredVolunteers(e.target.value)}
                    fullWidth
                    sx={{ input: { color: 'white' }, label: { color: 'text.secondary' }, fieldset: { borderColor: 'rgba(255,255,255,0.2)' } }}
                />
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
                <Button variant="contained" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Schedule Task'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const CreateTaskDialog = ({ open, onClose, eventId }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('General');
    const [priority, setPriority] = useState('medium');
    const [scheduleNow, setScheduleNow] = useState(false);
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [requiredVolunteers, setRequiredVolunteers] = useState(1);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            alert('Task name is required');
            return;
        }

        setSaving(true);
        try {
            const taskData = {
                eventId,
                name,
                description,
                category,
                priority,
                status: 'open',
                createdAt: new Date().toISOString(),
                timeSlots: []
            };

            if (scheduleNow) {
                taskData.timeSlots.push({
                    id: `slot_${Date.now()}`,
                    date,
                    startTime,
                    endTime,
                    requiredVolunteers: parseInt(requiredVolunteers),
                    assignedVolunteers: [],
                    status: 'open'
                });
            }

            await createVolunteerTask(taskData);
            onClose();
            setName('');
            setDescription('');
            setScheduleNow(false);
        } catch (error) {
            console.error("Failed to create task:", error);
            alert("Failed to create task");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#1e1e2d', color: 'white' } }}>
            <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                Create New Task
            </DialogTitle>
            <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    label="Task Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    sx={{ input: { color: 'white' }, label: { color: 'text.secondary' }, fieldset: { borderColor: 'rgba(255,255,255,0.2)' } }}
                />
                <TextField
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    fullWidth
                    multiline
                    rows={3}
                    sx={{ textarea: { color: 'white' }, label: { color: 'text.secondary' }, fieldset: { borderColor: 'rgba(255,255,255,0.2)' } }}
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        select
                        label="Category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        fullWidth
                        sx={{ select: { color: 'white' }, label: { color: 'text.secondary' }, fieldset: { borderColor: 'rgba(255,255,255,0.2)' } }}
                    >
                        <MenuItem value="General">General</MenuItem>
                        <MenuItem value="Logistics">Logistics</MenuItem>
                        <MenuItem value="Hospitality">Hospitality</MenuItem>
                        <MenuItem value="Technical">Technical</MenuItem>
                        <MenuItem value="Security">Security</MenuItem>
                    </TextField>
                    <TextField
                        select
                        label="Priority"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        fullWidth
                        sx={{ select: { color: 'white' }, label: { color: 'text.secondary' }, fieldset: { borderColor: 'rgba(255,255,255,0.2)' } }}
                    >
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="urgent">Urgent</MenuItem>
                    </TextField>
                </Box>

                <Box sx={{ mt: 2, p: 2, border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: scheduleNow ? 2 : 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TimeIcon color={scheduleNow ? "primary" : "disabled"} />
                            <Typography color={scheduleNow ? "white" : "text.secondary"}>
                                Schedule Immediately
                            </Typography>
                        </Box>
                        <Button
                            size="small"
                            variant={scheduleNow ? "contained" : "outlined"}
                            onClick={() => setScheduleNow(!scheduleNow)}
                        >
                            {scheduleNow ? "Yes" : "No"}
                        </Button>
                    </Box>

                    {scheduleNow && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                label="Date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                sx={{ input: { color: 'white' }, label: { color: 'text.secondary' }, fieldset: { borderColor: 'rgba(255,255,255,0.2)' } }}
                            />
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Start Time"
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ input: { color: 'white' }, label: { color: 'text.secondary' }, fieldset: { borderColor: 'rgba(255,255,255,0.2)' } }}
                                />
                                <TextField
                                    label="End Time"
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ input: { color: 'white' }, label: { color: 'text.secondary' }, fieldset: { borderColor: 'rgba(255,255,255,0.2)' } }}
                                />
                            </Box>
                            <TextField
                                label="Volunteers Needed"
                                type="number"
                                value={requiredVolunteers}
                                onChange={(e) => setRequiredVolunteers(e.target.value)}
                                fullWidth
                                sx={{ input: { color: 'white' }, label: { color: 'text.secondary' }, fieldset: { borderColor: 'rgba(255,255,255,0.2)' } }}
                            />
                        </Box>
                    )}
                </Box>

                <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving}>
                        {saving ? 'Creating...' : 'Create Task'}
                    </Button>
                </DialogActions>
            </DialogContent>
        </Dialog>
    );
};

const EditTaskDialog = ({ open, onClose, task }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('General');
    const [priority, setPriority] = useState('medium');
    const [saving, setSaving] = useState(false);

    // Update state when task changes or dialog opens
    useEffect(() => {
        if (open && task) {
            setName(task.name || '');
            setDescription(task.description || '');
            setCategory(task.category || 'General');
            setPriority(task.priority || 'medium');
        }
    }, [task, open]);

    const handleSave = async () => {
        if (!name.trim()) {
            alert('Task name is required');
            return;
        }

        setSaving(true);
        try {
            await updateVolunteerTask(task.id, {
                name,
                description,
                category,
                priority
            });
            onClose();
        } catch (error) {
            console.error("Failed to update task:", error);
            alert("Failed to update task");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
            setSaving(true);
            try {
                await deleteVolunteerTask(task.id);
                onClose();
            } catch (error) {
                console.error("Failed to delete task:", error);
                alert("Failed to delete task");
            } finally {
                setSaving(false);
            }
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#1e1e2d', color: 'white' } }}>
            <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Edit Task
                <IconButton onClick={handleDelete} color="error" size="small">
                    <DeleteIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    label="Task Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    sx={{ input: { color: 'white' }, label: { color: 'text.secondary' }, fieldset: { borderColor: 'rgba(255,255,255,0.2)' } }}
                />
                <TextField
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    fullWidth
                    multiline
                    rows={3}
                    sx={{ textarea: { color: 'white' }, label: { color: 'text.secondary' }, fieldset: { borderColor: 'rgba(255,255,255,0.2)' } }}
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        select
                        label="Category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        fullWidth
                        sx={{ select: { color: 'white' }, label: { color: 'text.secondary' }, fieldset: { borderColor: 'rgba(255,255,255,0.2)' } }}
                    >
                        <MenuItem value="General">General</MenuItem>
                        <MenuItem value="Logistics">Logistics</MenuItem>
                        <MenuItem value="Hospitality">Hospitality</MenuItem>
                        <MenuItem value="Technical">Technical</MenuItem>
                        <MenuItem value="Security">Security</MenuItem>
                    </TextField>
                    <TextField
                        select
                        label="Priority"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        fullWidth
                        sx={{ select: { color: 'white' }, label: { color: 'text.secondary' }, fieldset: { borderColor: 'rgba(255,255,255,0.2)' } }}
                    >
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="urgent">Urgent</MenuItem>
                    </TextField>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
                <Button variant="contained" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const EditTimeSlotDialog = ({ open, onClose, task, slot }) => {
    const { volunteers } = useAppState();
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [requiredVolunteers, setRequiredVolunteers] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [saving, setSaving] = useState(false);

    // Update state when slot changes or dialog opens
    useEffect(() => {
        if (open && slot) {
            setDate(slot.date || '');
            setStartTime(slot.startTime || '');
            setEndTime(slot.endTime || '');
            setRequiredVolunteers(slot.requiredVolunteers || 1);
            setSearchQuery('');
        }
    }, [slot, open]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateTimeSlot(task.id, slot.id, {
                date,
                startTime,
                endTime,
                requiredVolunteers: parseInt(requiredVolunteers)
            });
            onClose();
        } catch (error) {
            console.error("Failed to update time slot:", error);
            alert("Failed to update time slot");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this time slot?")) {
            setSaving(true);
            try {
                await deleteTimeSlot(task.id, slot.id);
                onClose();
            } catch (error) {
                console.error("Failed to delete time slot:", error);
                alert("Failed to delete time slot");
            } finally {
                setSaving(false);
            }
        }
    };

    const handleAssign = async (volunteerId) => {
        setSaving(true);
        try {
            await assignVolunteerToTimeSlot(task.id, slot.id, volunteerId);
        } catch (error) {
            console.error("Failed to assign volunteer:", error);
            alert("Failed to assign volunteer");
        } finally {
            setSaving(false);
        }
    };

    const handleUnassign = async (volunteerId) => {
        if (!window.confirm("Remove this volunteer from the task?")) return;
        setSaving(true);
        try {
            await unassignVolunteerFromTimeSlot(task.id, slot.id, volunteerId);
        } catch (error) {
            console.error("Failed to unassign volunteer:", error);
            alert("Failed to unassign volunteer");
        } finally {
            setSaving(false);
        }
    };

    const assignedVolunteerIds = slot?.assignedVolunteers || [];
    const unavailableVolunteerIds = [];
    // Ideally we would check for conflicts here, but for now just filter out already assigned
    // We could calculate conflicts using other tasks' time slots vs this slot's time

    // Simple filter for now
    const availableVolunteers = volunteers.filter(v =>
        !assignedVolunteerIds.includes(v.id) &&
        (
            (v.name && v.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (v.role && v.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (v.skills && v.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())))
        )
    );

    const isFull = assignedVolunteerIds.length >= requiredVolunteers;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#1e1e2d', color: 'white', maxHeight: '90vh' } }}>
            <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Edit Schedule
                <IconButton onClick={handleDelete} color="error" size="small">
                    <DeleteIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Time & Requirements Section */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="subtitle2" color="primary">Time & Requirements</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                label="Date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                sx={{ input: { color: 'white' }, label: { color: 'text.secondary' }, fieldset: { borderColor: 'rgba(255,255,255,0.2)' } }}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                label="Start Time"
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                sx={{ input: { color: 'white' }, label: { color: 'text.secondary' }, fieldset: { borderColor: 'rgba(255,255,255,0.2)' } }}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                label="End Time"
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                sx={{ input: { color: 'white' }, label: { color: 'text.secondary' }, fieldset: { borderColor: 'rgba(255,255,255,0.2)' } }}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                label="Volunteers Needed"
                                type="number"
                                value={requiredVolunteers}
                                onChange={(e) => setRequiredVolunteers(e.target.value)}
                                fullWidth
                                sx={{ input: { color: 'white' }, label: { color: 'text.secondary' }, fieldset: { borderColor: 'rgba(255,255,255,0.2)' } }}
                            />
                        </Grid>
                    </Grid>
                </Box>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

                {/* Assigned Volunteers Section */}
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" color="primary">
                            Assigned Volunteers ({assignedVolunteerIds.length}/{requiredVolunteers})
                        </Typography>
                        {isFull && (
                            <Chip
                                size="small"
                                label="Full"
                                color="success"
                                icon={<CheckCircleIcon />}
                                variant="outlined"
                            />
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, minHeight: 40, p: 1, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1, border: '1px dashed rgba(255,255,255,0.1)' }}>
                        {assignedVolunteerIds.map(id => {
                            const vol = volunteers.find(v => v.id === id);
                            return (
                                <Chip
                                    key={id}
                                    avatar={<Avatar src={vol?.photoURL}>{vol?.name?.[0]}</Avatar>}
                                    label={
                                        <Box>
                                            <Typography variant="body2">{vol?.name || 'Unknown'}</Typography>
                                            {vol?.role && <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.6rem' }}>{vol.role}</Typography>}
                                        </Box>
                                    }
                                    onDelete={() => handleUnassign(id)}
                                    color="default"
                                    sx={{
                                        bgcolor: 'rgba(0, 212, 255, 0.15)',
                                        color: 'white',
                                        height: 'auto',
                                        py: 0.5,
                                        '& .MuiChip-avatar': { width: 28, height: 28 }
                                    }}
                                />
                            );
                        })}
                        {assignedVolunteerIds.length === 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 1, px: 1, fontStyle: 'italic' }}>
                                No volunteers assigned yet. Use the list below to add them.
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* Available Volunteers Selection */}
                <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
                    <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>Add Volunteers</Typography>

                    <TextField
                        placeholder="Search by name, role, or skills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        fullWidth
                        size="small"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ mb: 1, input: { color: 'white' }, fieldset: { borderColor: 'rgba(255,255,255,0.2)' } }}
                    />

                    <List sx={{
                        flexGrow: 1,
                        overflow: 'auto',
                        maxHeight: 200,
                        bgcolor: 'rgba(255,255,255,0.02)',
                        borderRadius: 1,
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        {availableVolunteers.length > 0 ? (
                            availableVolunteers.map(vol => (
                                <ListItem
                                    key={vol.id}
                                    sx={{
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar src={vol.photoURL} sx={{ width: 32, height: 32 }}>
                                            {vol.name?.[0]}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Typography variant="body2" sx={{ color: 'white' }}>
                                                {vol.name}
                                            </Typography>
                                        }
                                        secondary={
                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                                {vol.role && (
                                                    <Chip label={vol.role} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', color: 'text.secondary', borderColor: 'rgba(255,255,255,0.1)' }} />
                                                )}
                                                {(vol.skills || []).slice(0, 2).map((skill, i) => (
                                                    <Chip key={i} label={skill} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(255,255,255,0.05)', color: 'text.secondary' }} />
                                                ))}
                                            </Box>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleAssign(vol.id)}
                                            disabled={isFull || saving}
                                            sx={{ color: isFull ? 'text.disabled' : '#00d4ff' }}
                                        >
                                            <PersonAddIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))
                        ) : (
                            <Box sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="caption" color="text.secondary">
                                    {searchQuery ? 'No matching volunteers found' : 'No available volunteers'}
                                </Typography>
                            </Box>
                        )}
                    </List>
                </Box>

            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Close</Button>
                <Button variant="contained" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const TaskBoard = ({ eventId }) => {
    const { volunteerTasks, volunteers } = useAppState();
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'gantt'
    const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
    const [createTaskOpen, setCreateTaskOpen] = useState(false);
    const [editTaskOpen, setEditTaskOpen] = useState(false);
    const [editTimeSlotOpen, setEditTimeSlotOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);

    const handleViewChange = (event, newView) => {
        if (newView !== null) setViewMode(newView);
    };

    const handleOpenSchedule = (task) => {
        setSelectedTask(task);
        setScheduleDialogOpen(true);
    };

    const handleEditTask = (task) => {
        setSelectedTask(task);
        setEditTaskOpen(true);
    };

    const handleEditTimeSlot = (task, slot) => {
        setSelectedTask(task);
        setSelectedSlot(slot);
        setEditTimeSlotOpen(true);
    };

    const ListView = () => (
        <Grid container spacing={2}>
            {volunteerTasks.map(task => (
                <Grid item xs={12} md={4} key={task.id}>
                    <Card sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        height: '100%',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-4px)' }
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>
                                    {task.name}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEditTask(task); }} sx={{ color: 'text.secondary', p: 0.5 }}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <Chip
                                        label={task.priority}
                                        size="small"
                                        color={task.priority === 'urgent' ? 'error' : task.priority === 'high' ? 'warning' : 'default'}
                                        variant="outlined"
                                    />
                                </Box>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                                {task.description}
                            </Typography>

                            <Box sx={{ mt: 'auto' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Assignments ({task.timeSlots?.length || 0} slots)
                                    </Typography>
                                    <IconButton size="small" onClick={() => handleOpenSchedule(task)} sx={{ color: '#00d4ff' }}>
                                        <AddIcon fontSize="small" />
                                    </IconButton>
                                </Box>

                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {(task.timeSlots || []).map(slot => (
                                        <Tooltip key={slot.id} title={`${slot.startTime} - ${slot.endTime} (${slot.assignedVolunteers?.length}/${slot.requiredVolunteers})`}>
                                            <Chip
                                                size="small"
                                                icon={<TimeIcon />}
                                                label={`${slot.startTime}`}
                                                color={slot.status === 'filled' ? 'success' : 'default'}
                                                onClick={(e) => { e.stopPropagation(); handleEditTimeSlot(task, slot); }}
                                                sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer' }}
                                            />
                                        </Tooltip>
                                    ))}
                                    {(!task.timeSlots || task.timeSlots.length === 0) && (
                                        <Chip label="Unscheduled" size="small" color="warning" variant="outlined" onClick={() => handleOpenSchedule(task)} />
                                    )}
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );

    const GanttView = () => {
        const { minTime, maxTime, dayStartHour } = useMemo(() => {
            let min = 8 * 60; // Default 8 AM
            let max = 20 * 60; // Default 8 PM

            volunteerTasks.forEach(task => {
                (task.timeSlots || []).forEach(slot => {
                    if (slot.startTime && slot.endTime) {
                        const [startH, startM] = slot.startTime.split(':').map(Number);
                        const [endH, endM] = slot.endTime.split(':').map(Number);
                        const startMinutes = startH * 60 + startM;
                        const endMinutes = endH * 60 + endM;
                        if (startMinutes < min) min = startMinutes;
                        if (endMinutes > max) max = endMinutes;
                    }
                });
            });

            min = Math.floor(min / 60) * 60;
            max = Math.ceil(max / 60) * 60;
            if (max <= min) max = min + 60;

            return { minTime: min, maxTime: max, dayStartHour: min / 60 };
        }, [volunteerTasks]);

        const totalMinutes = maxTime - minTime;
        const totalHours = (maxTime - minTime) / 60;

        const getPosition = (timeStr) => {
            const [h, m] = timeStr.split(':').map(Number);
            const minutes = h * 60 + m;
            return ((minutes - minTime) / totalMinutes) * 100;
        };

        const getWidth = (startStr, endStr) => {
            const [sh, sm] = startStr.split(':').map(Number);
            const [eh, em] = endStr.split(':').map(Number);
            const start = sh * 60 + sm;
            const end = eh * 60 + em;
            return ((end - start) / totalMinutes) * 100;
        };

        const SlotAvatars = ({ slot }) => {
            const assigned = slot.assignedVolunteers || [];
            if (assigned.length === 0) return null;

            return (
                <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 20, height: 20, fontSize: '0.7rem' } }}>
                    {assigned.map(id => {
                        const vol = volunteers.find(v => v.id === id);
                        return (
                            <Tooltip key={id} title={vol?.name || 'Unknown'}>
                                <Avatar alt={vol?.name} src={vol?.photoURL}>
                                    {vol?.name?.[0]}
                                </Avatar>
                            </Tooltip>
                        );
                    })}
                </AvatarGroup>
            );
        };

        const scheduledTasks = volunteerTasks.filter(t => t.timeSlots && t.timeSlots.length > 0);
        const unscheduledTasks = volunteerTasks.filter(t => !t.timeSlots || t.timeSlots.length === 0);

        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Paper sx={{
                    p: 2,
                    overflowX: 'auto',
                    bgcolor: 'rgba(23, 23, 35, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    minHeight: 400
                }}>
                    <Box sx={{ minWidth: 800 }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', ml: '200px', mb: 2, borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 1 }}>
                            {Array.from({ length: totalHours + 1 }).map((_, i) => (
                                <Box key={i} sx={{ position: 'relative', flex: 1, textAlign: 'left' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', transform: 'translateX(-50%)' }}>
                                        {format(addMinutes(new Date().setHours(dayStartHour, 0, 0, 0), i * 60), 'h a')}
                                    </Typography>
                                    <Box sx={{ position: 'absolute', left: 0, bottom: -8, width: 1, height: 5, bgcolor: 'rgba(255,255,255,0.1)' }} />
                                </Box>
                            ))}
                        </Box>

                        {/* Scheduled Tasks */}
                        {scheduledTasks.map(task => (
                            <Box key={task.id} sx={{ display: 'flex', mb: 2, alignItems: 'center' }}>
                                <Box sx={{ width: '200px', flexShrink: 0, pr: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }} noWrap title={task.name}>
                                        {task.name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {task.category || 'General'}
                                        </Typography>
                                        <IconButton size="small" onClick={() => handleEditTask(task)} sx={{ p: 0.5, color: 'text.secondary' }}>
                                            <EditIcon fontSize="inherit" />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleOpenSchedule(task)} sx={{ p: 0.5, color: '#00d4ff' }}>
                                            <AddIcon fontSize="inherit" />
                                        </IconButton>
                                    </Box>
                                </Box>

                                <Box sx={{ flexGrow: 1, position: 'relative', height: 40, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1 }}>
                                    {Array.from({ length: totalHours }).map((_, i) => (
                                        <Box key={i} sx={{
                                            position: 'absolute',
                                            left: `${(i / totalHours) * 100}%`,
                                            top: 0,
                                            bottom: 0,
                                            width: 1,
                                            bgcolor: 'rgba(255,255,255,0.03)'
                                        }} />
                                    ))}

                                    {task.timeSlots.map(slot => (
                                        <Box
                                            key={slot.id}
                                            sx={{
                                                position: 'absolute',
                                                left: `${getPosition(slot.startTime)}%`,
                                                width: `${getWidth(slot.startTime, slot.endTime)}%`,
                                                top: 4,
                                                bottom: 4,
                                                bgcolor: slot.status === 'filled' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(0, 212, 255, 0.2)',
                                                border: `1px solid ${slot.status === 'filled' ? '#4caf50' : '#00d4ff'}`,
                                                borderRadius: 1,
                                                px: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: 'rgba(0, 212, 255, 0.3)' }
                                            }}
                                            onClick={() => handleEditTimeSlot(task, slot)}
                                        >
                                            <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }} noWrap>
                                                {slot.startTime}
                                            </Typography>
                                            <SlotAvatars slot={slot} />
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                {unscheduledTasks.length > 0 && (
                    <Paper sx={{ p: 2, bgcolor: 'rgba(255, 152, 0, 0.05)', border: '1px solid rgba(255, 152, 0, 0.2)' }}>
                        <Typography variant="subtitle2" color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <WarningIcon fontSize="small" />
                            Unscheduled Tasks ({unscheduledTasks.length}) - Click to Schedule
                        </Typography>
                        <Grid container spacing={1}>
                            {unscheduledTasks.map(task => (
                                <Grid item key={task.id}>
                                    <Chip
                                        label={task.name}
                                        onClick={() => handleOpenSchedule(task)}
                                        variant="outlined"
                                        color="warning"
                                        icon={<AddIcon />}
                                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255, 152, 0, 0.1)' } }}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                )}
            </Box>
        );
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Task Management</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={handleViewChange}
                        size="small"
                        sx={{
                            '& .MuiToggleButton-root': {
                                borderColor: 'rgba(255,255,255,0.1)',
                                color: 'text.secondary',
                                '&.Mui-selected': {
                                    color: 'white',
                                    bgcolor: 'rgba(0, 212, 255, 0.2)'
                                }
                            }
                        }}
                    >
                        <ToggleButton value="list">
                            <ListIcon sx={{ mr: 1 }} /> List
                        </ToggleButton>
                        <ToggleButton value="gantt">
                            <GanttIcon sx={{ mr: 1 }} /> Schedule
                        </ToggleButton>
                    </ToggleButtonGroup>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateTaskOpen(true)}
                        sx={{
                            background: 'linear-gradient(135deg, #00d4ff 0%, #00a3cc 100%)',
                            color: '#0a0a0a'
                        }}
                    >
                        Add Task
                    </Button>
                </Box>
            </Box>

            {volunteerTasks.length === 0 ? (
                <Paper
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                >
                    <Typography color="text.secondary">
                        No tasks found. Use "Predict Needs" to generate an initial plan.
                    </Typography>
                </Paper>
            ) : (
                viewMode === 'list' ? <ListView /> : <GanttView />
            )}

            <TaskScheduleDialog
                open={scheduleDialogOpen}
                onClose={() => setScheduleDialogOpen(false)}
                task={selectedTask}
                eventId={eventId}
            />

            <CreateTaskDialog
                open={createTaskOpen}
                onClose={() => setCreateTaskOpen(false)}
                eventId={eventId}
            />

            <EditTaskDialog
                open={editTaskOpen}
                onClose={() => setEditTaskOpen(false)}
                task={selectedTask}
            />

            <EditTimeSlotDialog
                open={editTimeSlotOpen}
                onClose={() => setEditTimeSlotOpen(false)}
                task={selectedTask}
                slot={selectedSlot}
            />
        </Box>
    );
};

export default TaskBoard;
