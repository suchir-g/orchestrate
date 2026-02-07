/**
 * Event Team Component
 * Displays organizers, volunteers, and sponsors for an event
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Message as MessageIcon,
  AdminPanelSettings as AdminIcon,
  Event as OrganizerIcon,
  VolunteerActivism as VolunteerIcon,
  CardGiftcard as SponsorIcon,
} from '@mui/icons-material';
import { getEventTeamMembers } from '../../services/userProfileService';

const EventTeam = ({ event, onMessageUser, userEventRole }) => {
  const [teamMembers, setTeamMembers] = useState({
    organizers: [],
    volunteers: [],
    sponsors: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeamMembers = async () => {
      if (!event) return;

      setLoading(true);
      const { organizers, volunteers, sponsors } = await getEventTeamMembers(event);
      setTeamMembers({ organizers, volunteers, sponsors });
      setLoading(false);
    };

    loadTeamMembers();
  }, [event]);

  const getRoleIcon = (role) => {
    switch (role) {
      case 'organizer':
        return <OrganizerIcon />;
      case 'volunteer':
        return <VolunteerIcon />;
      case 'sponsor':
        return <SponsorIcon />;
      default:
        return <PersonIcon />;
    }
  };

  const TeamMemberCard = ({ member, role }) => (
    <Card sx={{ height: '100%', bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ width: 48, height: 48, mr: 2 }}>
            {member.displayName?.[0] || member.email?.[0] || '?'}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {member.displayName || 'Unnamed User'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {member.email}
            </Typography>
          </Box>
          <Tooltip title="Send Message">
            <IconButton
              size="small"
              color="primary"
              onClick={() => onMessageUser && onMessageUser(member, role)}
            >
              <MessageIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Chip
          icon={getRoleIcon(role)}
          label={role.charAt(0).toUpperCase() + role.slice(1)}
          size="small"
          color={role === 'organizer' ? 'primary' : role === 'volunteer' ? 'success' : 'secondary'}
        />
      </CardContent>
    </Card>
  );

  const canSeeVolunteers = ['owner', 'organizer', 'volunteer', 'admin'].includes(userEventRole);

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>Loading team members...</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Organizers Section - Visible to ALL */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <OrganizerIcon />
          Event Organizers ({teamMembers.organizers.length})
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Contact these people for general event inquiries
        </Typography>

        {teamMembers.organizers.length === 0 ? (
          <Typography color="text.secondary">No organizers listed</Typography>
        ) : (
          <Grid container spacing={2}>
            {teamMembers.organizers.map((organizer) => (
              <Grid item xs={12} md={6} lg={4} key={organizer.id}>
                <TeamMemberCard member={organizer} role="organizer" />
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Volunteers Section - Visible to volunteers, organizers, admins */}
      {canSeeVolunteers && teamMembers.volunteers.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VolunteerIcon />
            Volunteers ({teamMembers.volunteers.length})
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Team members helping with the event
          </Typography>

          <Grid container spacing={2}>
            {teamMembers.volunteers.map((volunteer) => (
              <Grid item xs={12} md={6} lg={4} key={volunteer.id}>
                <TeamMemberCard member={volunteer} role="volunteer" />
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Sponsors Section - Visible to ALL */}
      {teamMembers.sponsors.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SponsorIcon />
            Sponsors ({teamMembers.sponsors.length})
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Supporting this event
          </Typography>

          <Grid container spacing={2}>
            {teamMembers.sponsors.map((sponsor) => (
              <Grid item xs={12} md={6} lg={4} key={sponsor.id}>
                <TeamMemberCard member={sponsor} role="sponsor" />
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default EventTeam;
