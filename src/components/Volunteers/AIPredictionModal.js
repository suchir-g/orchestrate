import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress,
    List,
    ListItem,
    Chip,
    Grid,
    Paper,
    Alert,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    OutlinedInput,
    Checkbox,
    ListItemText,
    Tooltip,
    Badge
} from '@mui/material';
import {
    AutoAwesome as AIIcon,
    People as PeopleIcon,
    CheckCircle as CheckIcon,
    Save as SaveIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { predictVolunteerNeeds } from '../../services/openaiService';
import { getEvent } from '../../services/firebaseDbService';
import { createVolunteerTask, getAllVolunteerTasks } from '../../services/volunteerTaskService';
import { getAllVolunteers, assignVolunteerToTask, createVolunteer, getVolunteer } from '../../services/volunteerService';
import { getEventTeams } from '../../services/accessControlService';

const AIPredictionModal = ({ open, onClose, eventId }) => {
    const [loading, setLoading] = useState(false);
    const [prediction, setPrediction] = useState(null);
    const [eventData, setEventData] = useState(null);
    const [error, setError] = useState(null);
    const [existingTaskNames, setExistingTaskNames] = useState(new Set());

    // Interactive State
    const [editableRoles, setEditableRoles] = useState([]);
    const [availableVolunteers, setAvailableVolunteers] = useState([]);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        const fetchEventAndPredict = async () => {
            if (open && eventId) {
                setLoading(true);
                setError(null);
                setPrediction(null);
                setSaveSuccess(false);
                setExistingTaskNames(new Set());

                try {
                    // 1. Fetch latest event data, Team Members, AND Existing Tasks
                    const [
                        { data: event },
                        { volunteers: teamVolunteers },
                        { data: currentTasks }
                    ] = await Promise.all([
                        getEvent(eventId),
                        getEventTeams(eventId),
                        getAllVolunteerTasks(eventId)
                    ]);

                    if (!event) throw new Error('Failed to load event data');

                    setEventData(event);
                    setAvailableVolunteers(teamVolunteers || []);

                    // Store existing task names for deduplication
                    if (currentTasks) {
                        setExistingTaskNames(new Set(currentTasks.map(t => t.name.toLowerCase())));
                    }

                    // 2. Call AI Service
                    const result = await predictVolunteerNeeds(event);
                    setPrediction(result);

                    // Initialize editable state
                    if (result && result.roles) {
                        const rolesWithAssignments = result.roles.map((role, index) => {
                            const isDuplicate = existingTaskNames.has(role.role.toLowerCase());
                            return {
                                ...role,
                                id: `role_${index}`,
                                assignedVolunteers: [],
                                isDuplicate, // Flag duplicates
                                selected: !isDuplicate // Auto-deselect duplicates
                            };
                        });
                        setEditableRoles(rolesWithAssignments);
                    }

                } catch (err) {
                    console.error("AI Prediction failed:", err);
                    setError("Failed to generate prediction. Please try again later.");
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchEventAndPredict();
    }, [open, eventId]);

    const handleRoleChange = (index, field, value) => {
        const updated = [...editableRoles];
        updated[index] = { ...updated[index], [field]: value };
        setEditableRoles(updated);
    };

    const handleApplyPlan = async () => {
        setSaving(true);
        try {
            // Create tasks for each accepted role (only selected ones)
            const rolesToCreate = editableRoles.filter(r => r.selected);

            for (const role of rolesToCreate) {
                const taskData = {
                    eventId,
                    name: role.role,
                    description: role.responsibilities.join(', '),
                    priority: 'medium',
                    category: 'General',
                    status: 'open',
                    requirements: role.responsibilities,
                    timeSlots: [],
                    createdAt: new Date().toISOString()
                };

                const { error: taskError, id: taskId } = await createVolunteerTask(taskData);

                if (taskError) {
                    console.error(`Failed to create task for ${role.role}:`, taskError);
                    continue;
                }

                // Assign selected volunteers
                if (role.assignedVolunteers && role.assignedVolunteers.length > 0) {
                    for (const volId of role.assignedVolunteers) {
                        // Sync: Ensure volunteer exists in volunteers collection before assigning
                        const { data: existingVol } = await getVolunteer(volId);

                        if (!existingVol) {
                            const teamMember = availableVolunteers.find(v => v.id === volId);
                            if (teamMember) {
                                await createVolunteer({
                                    id: volId,
                                    eventId,
                                    name: teamMember.displayName || 'Unknown Volunteer',
                                    email: teamMember.email || '',
                                    role: 'General Volunteer',
                                    status: 'confirmed',
                                    joinedAt: new Date().toISOString()
                                });
                            }
                        }

                        // Assign task
                        await assignVolunteerToTask(volId, taskId, null, 'General');
                    }
                }
            }

            setSaveSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (err) {
            setError("Failed to apply plan. Please try again.");
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const ITEM_HEIGHT = 48;
    const ITEM_PADDING_TOP = 8;
    const MenuProps = {
        PaperProps: {
            style: {
                maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
                width: 250,
            },
        },
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <AIIcon sx={{ color: '#00d4ff' }} />
                <Typography variant="h6" sx={{ color: 'white' }}>
                    AI Volunteer Planner
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ mt: 2 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: '#00d4ff', mb: 2 }} />
                        <Typography color="text.secondary">Analyzing event details & Checking for duplicates...</Typography>
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
                ) : saveSuccess ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                        <CheckIcon sx={{ color: '#4caf50', fontSize: 60, mb: 2 }} />
                        <Typography variant="h5" color="white">Plan Applied!</Typography>
                        <Typography color="text.secondary">Tasks created successfully.</Typography>
                    </Box>
                ) : prediction ? (
                    <Box>
                        {/* Summary */}
                        <Paper
                            sx={{
                                p: 2,
                                mb: 3,
                                background: 'rgba(0, 212, 255, 0.05)',
                                border: '1px solid rgba(0, 212, 255, 0.2)'
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle1" sx={{ color: '#00d4ff', fontWeight: 600 }}>
                                    Strategic Overview
                                </Typography>
                                <Chip
                                    label={`${availableVolunteers.length} Team Members Available`}
                                    color="success"
                                    variant="outlined"
                                    size="small"
                                />
                            </Box>
                            <Typography variant="body2" color="white" sx={{ mt: 1 }}>
                                {prediction.summary}
                            </Typography>
                        </Paper>

                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                                    Role Allocation
                                </Typography>

                                <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {editableRoles.map((role, index) => (
                                        <Paper
                                            key={role.id}
                                            sx={{
                                                p: 2,
                                                background: role.selected ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 0, 0, 0.05)',
                                                border: role.isDuplicate ? '1px solid rgba(255, 0, 0, 0.3)' : 'none',
                                                '&:hover': { background: role.selected ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 0, 0, 0.08)' },
                                                opacity: role.selected ? 1 : 0.7
                                            }}
                                        >
                                            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Checkbox
                                                    checked={role.selected}
                                                    onChange={(e) => handleRoleChange(index, 'selected', e.target.checked)}
                                                    sx={{ color: 'text.secondary', '&.Mui-checked': { color: '#00d4ff' } }}
                                                />
                                                {role.isDuplicate && (
                                                    <Chip
                                                        icon={<WarningIcon />}
                                                        label="Potential Duplicate"
                                                        color="error"
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ ml: 1 }}
                                                    />
                                                )}
                                            </Box>

                                            <Grid container spacing={2} alignItems="center">
                                                {/* Role Name */}
                                                <Grid item xs={12} md={3}>
                                                    <TextField
                                                        label="Role"
                                                        value={role.role}
                                                        onChange={(e) => handleRoleChange(index, 'role', e.target.value)}
                                                        fullWidth
                                                        variant="outlined"
                                                        size="small"
                                                        disabled={!role.selected}
                                                        sx={{ input: { color: 'white' } }}
                                                    />
                                                </Grid>

                                                {/* Count */}
                                                <Grid item xs={6} md={1}>
                                                    <TextField
                                                        label="#"
                                                        type="number"
                                                        value={role.count}
                                                        onChange={(e) => handleRoleChange(index, 'count', parseInt(e.target.value) || 0)}
                                                        fullWidth
                                                        variant="outlined"
                                                        size="small"
                                                        disabled={!role.selected}
                                                        sx={{ input: { color: 'white' } }}
                                                    />
                                                </Grid>

                                                {/* Assignment Dropdown */}
                                                <Grid item xs={12} md={4}>
                                                    <FormControl fullWidth size="small" disabled={!role.selected}>
                                                        <InputLabel>Assign Team Members</InputLabel>
                                                        <Select
                                                            multiple
                                                            value={role.assignedVolunteers}
                                                            onChange={(e) => handleRoleChange(index, 'assignedVolunteers', e.target.value)}
                                                            input={<OutlinedInput label="Assign Team Members" />}
                                                            renderValue={(selected) => (
                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                    {selected.map((value) => {
                                                                        const vol = availableVolunteers.find(v => v.id === value);
                                                                        return <Chip key={value} label={vol ? vol.displayName : value} size="small" />;
                                                                    })}
                                                                </Box>
                                                            )}
                                                            MenuProps={MenuProps}
                                                        >
                                                            {availableVolunteers.map((vol) => (
                                                                <MenuItem key={vol.id} value={vol.id}>
                                                                    <Checkbox checked={role.assignedVolunteers.indexOf(vol.id) > -1} />
                                                                    <ListItemText primary={vol.displayName} />
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </Grid>

                                                {/* Reasoning */}
                                                <Grid item xs={12} md={4}>
                                                    <TextField
                                                        label="Notes"
                                                        value={role.reasoning}
                                                        onChange={(e) => handleRoleChange(index, 'reasoning', e.target.value)}
                                                        fullWidth
                                                        variant="outlined"
                                                        size="small"
                                                        disabled={!role.selected}
                                                        sx={{ input: { color: 'text.secondary' } }}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    ))}
                                </List>
                            </Grid>
                        </Grid>
                    </Box>
                ) : null}
            </DialogContent>

            <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleApplyPlan}
                    disabled={loading || saving || !prediction || !editableRoles.some(r => r.selected)}
                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    sx={{
                        background: 'linear-gradient(45deg, #00d4ff 30%, #2196f3 90%)',
                        boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)'
                    }}
                >
                    {saving ? 'Processing...' : 'Create Selected Tasks'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AIPredictionModal;
