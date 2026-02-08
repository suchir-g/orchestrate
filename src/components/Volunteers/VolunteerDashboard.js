import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Tabs,
    Tab,
    Button,
    Grid,
    Paper,
    Chip,
    IconButton,
    CircularProgress
} from '@mui/material';
import {
    Add as AddIcon,
    FilterList as FilterIcon,
    Assignment as TaskIcon,
    People as PeopleIcon,
    Dashboard as DashboardIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useAppState } from '../../context/AppStateContext';
import { getEvent } from '../../services/firebaseDbService';
import VolunteerList from './VolunteerList';
import TaskBoard from './TaskBoard';
import AIPredictionModal from './AIPredictionModal';
import { AutoAwesome as AIIcon } from '@mui/icons-material';

const VolunteerDashboard = ({ isEmbedded = false }) => {
    const { eventId: paramEventId } = useParams();
    // If embedded, we might get eventId from props or context, but usually useParams still works if route is /event/:eventId/volunteers
    // However, if we just render it inside EventDetail, we need to make sure we have access to eventId.
    // Let's assume useParams works or we pass it.

    // Actually, if embedded in EventDetail, the URL is /event/:eventId, so useParams().eventId is correct.
    const eventId = paramEventId;

    const navigate = useNavigate();
    const {
        volunteers,
        volunteerTasks,
        setSelectedEventId,
        loading
    } = useAppState();

    const [currentTab, setCurrentTab] = useState(0);
    const [eventData, setEventData] = useState(null);
    const [initializing, setInitializing] = useState(true);
    const [predictionModalOpen, setPredictionModalOpen] = useState(false);

    // Initialize dashboard
    useEffect(() => {
        const init = async () => {
            if (eventId) {
                // Set selected event ID in global context to trigger listeners
                setSelectedEventId(eventId);

                // Fetch event details for header
                const { data, error } = await getEvent(eventId);
                if (data) {
                    setEventData(data);
                } else {
                    console.error("Failed to load event:", error);
                }
            }
            setInitializing(false);
        };
        init();

        // Cleanup when leaving dashboard
        return () => {
            setSelectedEventId(null);
        };
    }, [eventId, setSelectedEventId]);

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    if (initializing) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: isEmbedded ? '100%' : '100vh',
            overflow: 'hidden'
        }}>
            {/* Header - Only verify if NOT embedded */}
            {!isEmbedded && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(26, 26, 26, 0.95)',
                        backdropFilter: 'blur(20px)',
                        zIndex: 10
                    }}
                >
                    <Container maxWidth="xl">
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <IconButton onClick={() => navigate('/events')} sx={{ mr: 2 }}>
                                <ArrowBackIcon />
                            </IconButton>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
                                    Volunteer Management
                                </Typography>
                                <Typography variant="subtitle1" color="text.secondary">
                                    {eventData?.name || 'Loading Event...'}
                                </Typography>
                            </Box>
                            <Box sx={{ flexGrow: 1 }} />
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                {/* Stats Chips */}
                                <Chip
                                    icon={<PeopleIcon />}
                                    label={`${volunteers.length} Volunteers`}
                                    variant="outlined"
                                    sx={{ borderColor: 'rgba(0, 212, 255, 0.5)', color: '#00d4ff' }}
                                />
                                <Chip
                                    icon={<TaskIcon />}
                                    label={`${volunteerTasks.length} Tasks`}
                                    variant="outlined"
                                    sx={{ borderColor: 'rgba(255, 107, 157, 0.5)', color: '#ff6b9d' }}
                                />
                            </Box>
                        </Box>

                        <Tabs
                            value={currentTab}
                            onChange={handleTabChange}
                            sx={{
                                '& .MuiTab-root': {
                                    color: 'text.secondary',
                                    '&.Mui-selected': { color: '#00d4ff' }
                                },
                                '& .MuiTabs-indicator': { backgroundColor: '#00d4ff' }
                            }}
                        >
                            <Tab icon={<PeopleIcon />} iconPosition="start" label="Volunteers" />
                            <Tab icon={<TaskIcon />} iconPosition="start" label="Tasks" />
                            <Tab icon={<DashboardIcon />} iconPosition="start" label="Stats & Reports" disabled />
                        </Tabs>
                    </Container>
                </Paper>
            )}

            {/* Embedded Header / Tabs */}
            {isEmbedded && (
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Tabs
                            value={currentTab}
                            onChange={handleTabChange}
                            sx={{
                                '& .MuiTab-root': {
                                    color: 'text.secondary',
                                    '&.Mui-selected': { color: '#00d4ff' }
                                },
                                '& .MuiTabs-indicator': { backgroundColor: '#00d4ff' }
                            }}
                        >
                            <Tab icon={<PeopleIcon />} iconPosition="start" label="Volunteers" />
                            <Tab icon={<TaskIcon />} iconPosition="start" label="Tasks" />
                            <Tab icon={<DashboardIcon />} iconPosition="start" label="Stats & Reports" disabled />
                        </Tabs>

                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Button
                                variant="contained"
                                startIcon={<AIIcon />}
                                onClick={() => setPredictionModalOpen(true)}
                                sx={{
                                    background: 'linear-gradient(45deg, #00d4ff 30%, #2196f3 90%)',
                                    boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
                                    mr: 2
                                }}
                            >
                                Predict Needs
                            </Button>

                            <Chip
                                icon={<PeopleIcon />}
                                label={`${volunteers.length} Volunteers`}
                                variant="outlined"
                                sx={{ borderColor: 'rgba(0, 212, 255, 0.5)', color: '#00d4ff' }}
                            />
                            <Chip
                                icon={<TaskIcon />}
                                label={`${volunteerTasks.length} Tasks`}
                                variant="outlined"
                                sx={{ borderColor: 'rgba(255, 107, 157, 0.5)', color: '#ff6b9d' }}
                            />
                        </Box>
                    </Box>
                </Box>
            )}

            {/* Main Content */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: isEmbedded ? 0 : 3 }}>
                <Container maxWidth={isEmbedded ? false : "xl"} disableGutters={isEmbedded}>
                    {currentTab === 0 && <VolunteerList eventId={eventId} />}
                    {currentTab === 1 && <TaskBoard eventId={eventId} />}
                </Container>
            </Box>

            {/* AI Prediction Modal */}
            <AIPredictionModal
                open={predictionModalOpen}
                onClose={() => setPredictionModalOpen(false)}
                eventId={eventId}
            />
        </Box>
    );
};

export default VolunteerDashboard;
