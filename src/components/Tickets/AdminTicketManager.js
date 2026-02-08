import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  IconButton,
  InputAdornment,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  QrCode as QrCodeIcon,
  Link as LinkIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import QRCode from 'react-qr-code';
import { useAppState } from '../../context/AppStateContext';
import toast from 'react-hot-toast';

const AdminTicketManager = () => {
  const { events = [], tickets = [] } = useAppState();
  const [selectedEventId, setSelectedEventId] = useState('');
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openQRDialog, setOpenQRDialog] = useState(false);
  const [newTicketTier, setNewTicketTier] = useState({
    name: '',
    description: '',
    totalSupply: '',
    price: 0, // Always 0 for now (free)
  });

  const selectedEvent = events.find(e => e.id === selectedEventId);
  // Get ticket tiers from the event itself, not from separate tickets collection
  const eventTickets = selectedEvent?.ticketTiers || [];

  // Get public claim link for this event
  const getClaimLink = (eventId) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/claim-ticket/${eventId}`;
  };

  const handleCopyLink = () => {
    const link = getClaimLink(selectedEventId);
    navigator.clipboard.writeText(link);
    toast.success('Ticket claim link copied!');
  };

  const handleShowQR = () => {
    setOpenQRDialog(true);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${selectedEvent?.name}-ticket-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success('QR code downloaded!');
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handleCreateTier = () => {
    if (!newTicketTier.name || !newTicketTier.totalSupply) {
      toast.error('Please fill in all required fields');
      return;
    }

    // TODO: Integrate with actual ticket creation service
    toast.success(`Ticket tier "${newTicketTier.name}" created!`);

    setNewTicketTier({
      name: '',
      description: '',
      totalSupply: '',
      price: 0,
    });
    setOpenCreateDialog(false);
  };

  // Calculate stats for selected event
  const totalTickets = eventTickets.reduce((sum, t) => sum + (t.supply || 0), 0);
  const claimedTickets = eventTickets.reduce((sum, t) => sum + (t.sold || 0), 0);
  const availableTickets = totalTickets - claimedTickets;
  const claimRate = totalTickets > 0 ? (claimedTickets / totalTickets * 100).toFixed(1) : 0;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          🎫 Ticket Management Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Create ticket tiers, share claim links, and track ticket claims
        </Typography>
      </Box>

      {/* Event Selector */}
      <Paper sx={{
        p: 3,
        mb: 3,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
      }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
          <FormControl fullWidth>
            <InputLabel>Select Event</InputLabel>
            <Select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              label="Select Event"
            >
              <MenuItem value="">
                <em>Select an event...</em>
              </MenuItem>
              {events.map((event) => (
                <MenuItem key={event.id} value={event.id}>
                  {event.name} - {new Date(event.date).toLocaleDateString()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedEventId && (
            <Button
              variant="contained"
              startIcon={<ShareIcon />}
              onClick={handleCopyLink}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Copy Claim Link
            </Button>
          )}
        </Box>

        {selectedEventId && (
          <Box sx={{ mt: 2, p: 2, background: 'rgba(0, 212, 255, 0.1)', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Public Claim Link:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ flex: 1, wordBreak: 'break-all' }}>
                {getClaimLink(selectedEventId)}
              </Typography>
              <IconButton size="small" onClick={handleCopyLink}>
                <CopyIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        )}
      </Paper>

      {!selectedEventId ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Select an event to manage tickets
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose an event from the dropdown above to create ticket tiers and share claim links
          </Typography>
        </Box>
      ) : (
        <>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card sx={{
                background: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
              }}>
                <CardContent>
                  <Typography variant="h4" color="primary.main">
                    {totalTickets}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Tickets
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{
                background: 'rgba(76, 175, 80, 0.1)',
                border: '1px solid rgba(76, 175, 80, 0.3)',
              }}>
                <CardContent>
                  <Typography variant="h4" color="success.main">
                    {claimedTickets}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tickets Claimed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{
                background: 'rgba(255, 152, 0, 0.1)',
                border: '1px solid rgba(255, 152, 0, 0.3)',
              }}>
                <CardContent>
                  <Typography variant="h4" color="warning.main">
                    {availableTickets}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{
                background: 'rgba(255, 107, 157, 0.1)',
                border: '1px solid rgba(255, 107, 157, 0.3)',
              }}>
                <CardContent>
                  <Typography variant="h4" color="secondary.main">
                    {claimRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Claim Rate
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Action Bar */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Ticket Tiers for {selectedEvent?.name}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreateDialog(true)}
            >
              Create Ticket Tier
            </Button>
          </Box>

          {/* Ticket Tiers Table */}
          {eventTickets.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No ticket tiers created yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first ticket tier to start accepting attendees
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenCreateDialog(true)}
              >
                Create First Ticket Tier
              </Button>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Tier Name</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell align="center"><strong>Total Supply</strong></TableCell>
                    <TableCell align="center"><strong>Claimed</strong></TableCell>
                    <TableCell align="center"><strong>Available</strong></TableCell>
                    <TableCell align="center"><strong>Progress</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {eventTickets.map((ticket, index) => {
                    const claimed = ticket.sold || 0;
                    const total = ticket.supply || 0;
                    const available = total - claimed;
                    const progress = total > 0 ? (claimed / total * 100) : 0;

                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <Box>
                            <Typography variant="body1" fontWeight="bold">
                              {ticket.name}
                            </Typography>
                            <Chip
                              label={ticket.price === 0 ? 'FREE' : `$${ticket.price}`}
                              size="small"
                              color="success"
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>{ticket.description || 'Standard ticket'}</TableCell>
                        <TableCell align="center">
                          <Typography variant="h6">{total}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="h6" color="success.main">{claimed}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="h6" color={available === 0 ? 'error.main' : 'warning.main'}>
                            {available}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ minWidth: 100 }}>
                            <LinearProgress
                              variant="determinate"
                              value={progress}
                              sx={{
                                height: 8,
                                borderRadius: 1,
                                bgcolor: 'rgba(255, 255, 255, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: available === 0 ? 'error.main' : 'success.main'
                                }
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {progress.toFixed(0)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={handleShowQR}
                            title="Show QR Code"
                          >
                            <QrCodeIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* QR Code Dialog */}
      <Dialog open={openQRDialog} onClose={() => setOpenQRDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          📱 Ticket Claim QR Code
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          {selectedEvent && (
            <>
              <Typography variant="h6" gutterBottom>
                {selectedEvent.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Scan this QR code to go directly to the ticket claim page
              </Typography>

              <Box sx={{
                bgcolor: 'white',
                p: 3,
                borderRadius: 2,
                display: 'inline-block',
                mb: 3
              }}>
                <QRCode
                  id="qr-code-svg"
                  value={getClaimLink(selectedEventId)}
                  size={256}
                  level="H"
                />
              </Box>

              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Or share this link:
              </Typography>
              <Paper sx={{
                p: 2,
                bgcolor: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                wordBreak: 'break-all'
              }}>
                <Typography variant="body2" fontFamily="monospace">
                  {getClaimLink(selectedEventId)}
                </Typography>
              </Paper>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenQRDialog(false)}>Close</Button>
          <Button
            onClick={handleDownloadQR}
            variant="outlined"
            startIcon={<DownloadIcon />}
          >
            Download QR
          </Button>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(getClaimLink(selectedEventId));
              toast.success('Link copied!');
            }}
            variant="contained"
            startIcon={<CopyIcon />}
          >
            Copy Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Ticket Tier Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>🎫 Create New Ticket Tier</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Tier Name *"
              value={newTicketTier.name}
              onChange={(e) => setNewTicketTier({ ...newTicketTier, name: e.target.value })}
              placeholder="e.g., General Admission, VIP, Early Bird"
              fullWidth
            />

            <TextField
              label="Description"
              value={newTicketTier.description}
              onChange={(e) => setNewTicketTier({ ...newTicketTier, description: e.target.value })}
              placeholder="Brief description of this ticket tier"
              multiline
              rows={2}
              fullWidth
            />

            <TextField
              label="Total Supply *"
              type="number"
              value={newTicketTier.totalSupply}
              onChange={(e) => setNewTicketTier({ ...newTicketTier, totalSupply: e.target.value })}
              placeholder="How many tickets available?"
              fullWidth
            />

            <Box sx={{ p: 2, background: 'rgba(76, 175, 80, 0.1)', borderRadius: 1 }}>
              <Typography variant="body2" color="success.main">
                ✓ All tickets are FREE for now
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateTier} variant="contained">
            Create Tier
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminTicketManager;
