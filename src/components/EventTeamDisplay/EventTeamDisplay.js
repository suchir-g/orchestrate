/**
 * Event Team Display Component
 * Shows clear lists of organizers and volunteers for an event
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
} from '@mui/material';
import {
  Shield as OrganizerIcon,
  Group as VolunteerIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Message as MessageIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { getEventTeams } from '../../services/accessControlService';
import { createTestTeamData } from '../../utils/testTeamData';
import toast from 'react-hot-toast';

const EventTeamDisplay = ({ event, onMessageClick }) => {
  const [organizers, setOrganizers] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingTestData, setAddingTestData] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    const loadTeams = async () => {
      if (!event) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const { organizers: orgs, volunteers: vols, error: err } = await getEventTeams(event.id);

      if (err) {
        setError(err);
      } else {
        setOrganizers(orgs);
        setVolunteers(vols);
      }

      setLoading(false);
    };

    loadTeams();
  }, [event]);

  const handleAddTestData = async () => {
    if (!event) return;
    
    setAddingTestData(true);
    const result = await createTestTeamData(event.id);
    
    if (result.success) {
      toast.success(result.message);
      // Reload teams
      const { organizers: orgs, volunteers: vols } = await getEventTeams(event.id);
      setOrganizers(orgs);
      setVolunteers(vols);
    } else {
      toast.error(result.message);
    }
    
    setAddingTestData(false);
  };

  if (!event) return null;

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">Loading teams...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load teams: {error}
      </Alert>
    );
  }

  const handleMessageClick = (member) => {
    if (onMessageClick) {
      onMessageClick(member);
    }
  };

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
      {/* Add Test Data Button */}
      <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' }, mb: 1 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddTestData}
          disabled={addingTestData}
        >
          {addingTestData ? 'Adding Test Data...' : 'Add Test Team Data'}
        </Button>
      </Box>

      {/* Organizers Card */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <OrganizerIcon color="primary" />
            <Typography variant="h6">
              Organizers
              <Chip label={organizers.length} size="small" sx={{ ml: 1 }} color="primary" />
            </Typography>
          </Box>

          {organizers.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No organizers assigned
            </Typography>
          ) : (
            <List sx={{ p: 0 }}>
              {organizers.map((org, idx) => (
                <React.Fragment key={org.id}>
                  <ListItem 
                    sx={{ py: 1, px: 0, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    onClick={() => setSelectedMember(org)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {(org.displayName || org.id)[0].toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">{org.displayName || org.id}</Typography>
                          {org.isCreator && (
                            <Chip label="Creator" size="small" variant="outlined" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          Added {org.addedAt ? new Date(org.addedAt).toLocaleDateString() : 'recently'}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {idx < organizers.length - 1 && <Divider sx={{ my: 0.5 }} />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Volunteers Card */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <VolunteerIcon color="success" />
            <Typography variant="h6">
              Volunteers
              <Chip label={volunteers.length} size="small" sx={{ ml: 1 }} color="success" />
            </Typography>
          </Box>

          {volunteers.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No volunteers assigned
            </Typography>
          ) : (
            <List sx={{ p: 0 }}>
              {volunteers.map((vol, idx) => (
                <React.Fragment key={vol.id}>
                  <ListItem 
                    sx={{ py: 1, px: 0, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    onClick={() => setSelectedMember(vol)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {(vol.displayName || vol.id)[0].toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2">{vol.displayName || vol.id}</Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          Added {vol.addedAt ? new Date(vol.addedAt).toLocaleDateString() : 'recently'}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {idx < volunteers.length - 1 && <Divider sx={{ my: 0.5 }} />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Member Details Modal */}
      <Dialog open={!!selectedMember} onClose={() => setSelectedMember(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Member Details</Typography>
            <Button 
              size="small" 
              variant="text" 
              onClick={() => setSelectedMember(null)}
            >
              <CloseIcon />
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedMember && (
            <Paper sx={{ p: 3, textAlign: 'center', mb: 2 }}>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  mx: 'auto', 
                  mb: 2,
                  fontSize: '2rem'
                }}
              >
                {(selectedMember.displayName || selectedMember.id)[0].toUpperCase()}
              </Avatar>
              <Typography variant="h6" gutterBottom>
                {selectedMember.displayName || 'Unknown'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedMember.id}
              </Typography>
              <Chip 
                label={selectedMember.role || 'Member'} 
                color="primary" 
                sx={{ mt: 1 }}
              />
              {selectedMember.isCreator && (
                <Chip 
                  label="Event Creator" 
                  color="warning" 
                  sx={{ ml: 1, mt: 1 }}
                />
              )}
            </Paper>
          )}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Role
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {selectedMember?.role === 'organizer' ? 'Organizer' : selectedMember?.role === 'volunteer' ? 'Volunteer' : selectedMember?.role || 'Member'}
            </Typography>
            
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Added
            </Typography>
            <Typography variant="body2">
              {selectedMember?.addedAt ? new Date(selectedMember.addedAt).toLocaleDateString('en-US', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              }) : 'Recently'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            variant="outlined" 
            startIcon={<MessageIcon />}
            onClick={() => {
              handleMessageClick(selectedMember);
              setSelectedMember(null);
            }}
          >
            Message
          </Button>
          <Button onClick={() => setSelectedMember(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventTeamDisplay;
