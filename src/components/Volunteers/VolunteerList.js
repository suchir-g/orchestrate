import React, { useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Grid,
    Avatar,
    Chip,
    IconButton,
    TextField,
    InputAdornment,
    Menu,
    MenuItem,
    Dialog
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    MoreVert as MoreIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { useAppState } from '../../context/AppStateContext';
import { deleteVolunteer } from '../../services/volunteerService';
import VolunteerForm from './VolunteerForm';
import { format } from 'date-fns';

const VolunteerList = ({ eventId }) => {
    const { volunteers } = useAppState();
    const [searchQuery, setSearchQuery] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editingVolunteer, setEditingVolunteer] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedVolunteerId, setSelectedVolunteerId] = useState(null);

    const handleMenuOpen = (event, id) => {
        setAnchorEl(event.currentTarget);
        setSelectedVolunteerId(id);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedVolunteerId(null);
    };

    const handleEdit = () => {
        const volunteer = volunteers.find(v => v.id === selectedVolunteerId);
        setEditingVolunteer(volunteer);
        setFormOpen(true);
        handleMenuClose();
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this volunteer?')) {
            await deleteVolunteer(selectedVolunteerId);
        }
        handleMenuClose();
    };

    const handleFormClose = () => {
        setFormOpen(false);
        setEditingVolunteer(null);
    };

    // Deduplicate volunteers by ID or Email
    const uniqueVolunteers = volunteers.reduce((acc, current) => {
        const x = acc.find(item => item.id === current.id || (item.email && item.email === current.email));
        if (!x) {
            return acc.concat([current]);
        } else {
            return acc;
        }
    }, []);

    const filteredVolunteers = uniqueVolunteers.filter(v =>
        (v.name && v.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.email && v.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.role && v.role.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'success';
            case 'pending': return 'warning';
            case 'rejected': return 'error';
            default: return 'default';
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <TextField
                    placeholder="Search volunteers..."
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ width: 300 }}
                />
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setFormOpen(true)}
                    sx={{
                        background: 'linear-gradient(135deg, #00d4ff 0%, #00a3cc 100%)',
                        color: '#0a0a0a'
                    }}
                >
                    Add Volunteer
                </Button>
            </Box>

            <Grid container spacing={2}>
                {filteredVolunteers.map((volunteer) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={volunteer.id}>
                        <Card
                            sx={{
                                height: '100%',
                                background: 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                                }
                            }}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                                        <Avatar
                                            src={volunteer.photoURL}
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                bgcolor: 'primary.main',
                                                color: 'primary.contrastText',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {volunteer.name ? volunteer.name[0].toUpperCase() : 'V'}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                {volunteer.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <EmailIcon sx={{ fontSize: 14 }} />
                                                {volunteer.email}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <IconButton onClick={(e) => handleMenuOpen(e, volunteer.id)} size="small">
                                        <MoreIcon />
                                    </IconButton>
                                </Box>

                                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                    <Chip
                                        label={volunteer.status || 'Pending'}
                                        size="small"
                                        color={getStatusColor(volunteer.status)}
                                        variant="outlined"
                                    />
                                    {volunteer.role && (
                                        <Chip label={volunteer.role} size="small" variant="outlined" />
                                    )}
                                </Box>

                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {(volunteer.skills || []).slice(0, 3).map((skill, index) => (
                                        <Chip
                                            key={index}
                                            label={skill}
                                            size="small"
                                            sx={{
                                                fontSize: '0.7rem',
                                                bgcolor: 'rgba(255, 255, 255, 0.05)'
                                            }}
                                        />
                                    ))}
                                    {(volunteer.skills || []).length > 3 && (
                                        <Chip
                                            label={`+${volunteer.skills.length - 3}`}
                                            size="small"
                                            sx={{ fontSize: '0.7rem' }}
                                        />
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Actions Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleEdit}>Edit</MenuItem>
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>Delete</MenuItem>
            </Menu>

            {/* Add/Edit Dialog */}
            <VolunteerForm
                open={formOpen}
                onClose={handleFormClose}
                eventId={eventId}
                volunteer={editingVolunteer}
            />
        </Box>
    );
};

export default VolunteerList;
