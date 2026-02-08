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
    FormControl,
    InputLabel,
    Select,
    Chip,
    Box,
    Typography
} from '@mui/material';
import { createVolunteer, updateVolunteer } from '../../services/volunteerService';
import toast from 'react-hot-toast';

const VolunteerForm = ({ open, onClose, eventId, volunteer }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'general',
        status: 'pending',
        skills: [],
        notes: ''
    });
    const [newSkill, setNewSkill] = useState('');

    useEffect(() => {
        if (volunteer) {
            setFormData({
                name: volunteer.name || '',
                email: volunteer.email || '',
                phone: volunteer.phone || '',
                role: volunteer.role || 'general',
                status: volunteer.status || 'pending',
                skills: volunteer.skills || [],
                notes: volunteer.notes || ''
            });
        } else {
            setFormData({
                name: '',
                email: '',
                phone: '',
                role: 'general',
                status: 'pending',
                skills: [],
                notes: ''
            });
        }
    }, [volunteer, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddSkill = (e) => {
        if (e.key === 'Enter' && newSkill.trim()) {
            e.preventDefault();
            if (!formData.skills.includes(newSkill.trim())) {
                setFormData(prev => ({
                    ...prev,
                    skills: [...prev.skills, newSkill.trim()]
                }));
            }
            setNewSkill('');
        }
    };

    const handleDeleteSkill = (skillToDelete) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter(skill => skill !== skillToDelete)
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.email) {
            toast.error('Name and Email are required');
            return;
        }

        try {
            if (volunteer) {
                await updateVolunteer(volunteer.id, formData);
                toast.success('Volunteer updated successfully');
            } else {
                await createVolunteer({
                    ...formData,
                    eventId,
                    createdAt: new Date().toISOString()
                });
                toast.success('Volunteer added successfully');
            }
            onClose();
        } catch (error) {
            console.error('Error saving volunteer:', error);
            toast.error('Failed to save volunteer');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {volunteer ? 'Edit Volunteer' : 'Add New Volunteer'}
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Full Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Role</InputLabel>
                            <Select
                                name="role"
                                value={formData.role}
                                label="Role"
                                onChange={handleChange}
                            >
                                <MenuItem value="general">General Volunteer</MenuItem>
                                <MenuItem value="lead">Team Lead</MenuItem>
                                <MenuItem value="logistics">Logistics</MenuItem>
                                <MenuItem value="registration">Registration</MenuItem>
                                <MenuItem value="technical">Technical Support</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                name="status"
                                value={formData.status}
                                label="Status"
                                onChange={handleChange}
                            >
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="confirmed">Confirmed</MenuItem>
                                <MenuItem value="rejected">Rejected</MenuItem>
                                <MenuItem value="waitlist">Waitlist</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Skills (Press Enter to add)"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyDown={handleAddSkill}
                            placeholder="e.g., First Aid, Coding, Heavy Lifting"
                        />
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                            {formData.skills.map((skill, index) => (
                                <Chip
                                    key={index}
                                    label={skill}
                                    onDelete={() => handleDeleteSkill(skill)}
                                />
                            ))}
                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Notes"
                            name="notes"
                            multiline
                            rows={3}
                            value={formData.notes}
                            onChange={handleChange}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default VolunteerForm;
