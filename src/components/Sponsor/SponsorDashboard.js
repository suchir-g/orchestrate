import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  Paper,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as CheckIcon,
  AccessTime as ClockIcon,
  Close as CloseIcon,
  LocalShipping as ShippingIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useAppState } from '../../context/AppStateContext';
import ItemRequestForm from './ItemRequestForm';
import VolunteerRequestForm from './VolunteerRequestForm';
import RequestStatusTracker from './RequestStatusTracker';

const SponsorDashboard = ({ eventId }) => {
  const { userProfile } = useAuth();
  const { state } = useAppState();
  
  const [sponsorData, setSponsorData] = useState({
    itemRequests: [],
    volunteerRequests: [],
    providedItems: []
  });

  const [openItemForm, setOpenItemForm] = useState(false);
  const [openVolunteerForm, setOpenVolunteerForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSponsorData();
  }, [eventId]);

  const loadSponsorData = async () => {
    try {
      setLoading(true);
      // TODO: Load from Firestore
      // For now, using empty state
      setSponsorData({
        itemRequests: [],
        volunteerRequests: [],
        providedItems: []
      });
    } catch (error) {
      console.error('Error loading sponsor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemRequestSubmit = async (itemData) => {
    try {
      // TODO: Save to Firestore
      setSponsorData(prev => ({
        ...prev,
        itemRequests: [...prev.itemRequests, { ...itemData, id: Date.now(), status: 'pending' }]
      }));
      setOpenItemForm(false);
    } catch (error) {
      console.error('Error submitting item request:', error);
    }
  };

  const handleVolunteerRequestSubmit = async (volunteerData) => {
    try {
      // TODO: Save to Firestore
      setSponsorData(prev => ({
        ...prev,
        volunteerRequests: [...prev.volunteerRequests, { ...volunteerData, id: Date.now(), status: 'pending' }]
      }));
      setOpenVolunteerForm(false);
    } catch (error) {
      console.error('Error submitting volunteer request:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckIcon />;
      case 'rejected':
        return <CloseIcon />;
      case 'pending':
        return <ClockIcon />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      {/* Header */}
      <Box sx={{ marginBottom: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, marginBottom: 1 }}>
          Sponsor Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your event contributions and volunteer requests
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ marginBottom: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #00d4ff 0%, #0088cc 100%)',
              color: '#fff'
            }}
          >
            <CardContent>
              <Typography variant="h3" sx={{ fontWeight: 700, marginBottom: 1 }}>
                {sponsorData.providedItems.length}
              </Typography>
              <Typography variant="body2">Items Provided</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #ff6b9d 0%, #cc4670 100%)',
              color: '#fff'
            }}
          >
            <CardContent>
              <Typography variant="h3" sx={{ fontWeight: 700, marginBottom: 1 }}>
                {sponsorData.itemRequests.filter(r => r.status === 'pending').length}
              </Typography>
              <Typography variant="body2">Pending Requests</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)',
              color: '#fff'
            }}
          >
            <CardContent>
              <Typography variant="h3" sx={{ fontWeight: 700, marginBottom: 1 }}>
                {sponsorData.itemRequests.filter(r => r.status === 'approved').length}
              </Typography>
              <Typography variant="body2">Approved Items</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #ffa500 0%, #ff8c00 100%)',
              color: '#fff'
            }}
          >
            <CardContent>
              <Typography variant="h3" sx={{ fontWeight: 700, marginBottom: 1 }}>
                {sponsorData.volunteerRequests.length}
              </Typography>
              <Typography variant="body2">Volunteer Requests</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Item Requests */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Item Contributions"
              action={
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenItemForm(true)}
                  size="small"
                >
                  Add Item
                </Button>
              }
            />
            <Divider />
            <CardContent>
              {sponsorData.providedItems.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#1a1a1a' }}>
                        <TableCell>Item</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Qty</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sponsorData.providedItems.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>{item.itemName}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            <Chip
                              label={item.status}
                              color={getStatusColor(item.status)}
                              icon={getStatusIcon(item.status)}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                  No items provided yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Volunteer Requests */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Volunteer Requests"
              action={
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenVolunteerForm(true)}
                  size="small"
                >
                  Request Volunteers
                </Button>
              }
            />
            <Divider />
            <CardContent>
              {sponsorData.volunteerRequests.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#1a1a1a' }}>
                        <TableCell>Task</TableCell>
                        <TableCell>Needed</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sponsorData.volunteerRequests.map(request => (
                        <TableRow key={request.id}>
                          <TableCell>{request.taskType}</TableCell>
                          <TableCell>{request.requiredCount}</TableCell>
                          <TableCell>{request.timeSlot?.startTime}</TableCell>
                          <TableCell>
                            <Chip
                              label={request.status}
                              color={getStatusColor(request.status)}
                              icon={getStatusIcon(request.status)}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                  No volunteer requests yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Request Status Tracker */}
        <Grid item xs={12}>
          <RequestStatusTracker
            itemRequests={sponsorData.itemRequests}
            volunteerRequests={sponsorData.volunteerRequests}
          />
        </Grid>
      </Grid>

      {/* Item Request Form Dialog */}
      <Dialog
        open={openItemForm}
        onClose={() => setOpenItemForm(false)}
        maxWidth="sm"
        fullWidth
      >
        <ItemRequestForm
          eventId={eventId}
          onSubmit={handleItemRequestSubmit}
          onCancel={() => setOpenItemForm(false)}
        />
      </Dialog>

      {/* Volunteer Request Form Dialog */}
      <Dialog
        open={openVolunteerForm}
        onClose={() => setOpenVolunteerForm(false)}
        maxWidth="sm"
        fullWidth
      >
        <VolunteerRequestForm
          eventId={eventId}
          onSubmit={handleVolunteerRequestSubmit}
          onCancel={() => setOpenVolunteerForm(false)}
        />
      </Dialog>
    </Box>
  );
};

export default SponsorDashboard;
