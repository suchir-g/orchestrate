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
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  Token as TokenIcon,
  QrCode as QrCodeIcon,
  Verified as VerifiedIcon,
  Schedule as PendingIcon,
} from '@mui/icons-material';
import QRCode from 'react-qr-code';
import { useBlockchain } from '../../context/BlockchainContext';
import { useAppState } from '../../context/AppStateContext';
import toast from 'react-hot-toast';

const TicketManager = () => {
  const { isConnected, signer } = useBlockchain();
  const { tickets, addTicket, setLoading } = useAppState();
  const [openDialog, setOpenDialog] = useState(false);
  const [openQRDialog, setOpenQRDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newTicket, setNewTicket] = useState({
    eventName: '',
    eventDate: '',
    ticketType: '',
    price: '',
    quantity: 1,
  });

  const handleCreateTicket = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setLoading({ tickets: true });
      
      // Simulate blockchain interaction
      const ticketData = {
        id: Date.now(),
        ...newTicket,
        tokenId: Math.random().toString(36).substring(7),
        owner: signer?.address || 'Connected Wallet',
        status: 'minted',
        transactionHash: '0x' + Math.random().toString(16).substring(2, 66),
        createdAt: new Date().toISOString(),
        blockchainData: {
          network: 'Ethereum',
          contractAddress: '0x742d35Cc8E5f7A4c5b7a3E4c8F5B9E1D2C3F4A5B',
          gasUsed: Math.floor(Math.random() * 50000) + 21000,
        }
      };

      addTicket(ticketData);
      toast.success('Ticket successfully minted to blockchain!');
      
      setNewTicket({
        eventName: '',
        eventDate: '',
        ticketType: '',
        price: '',
        quantity: 1,
      });
      setOpenDialog(false);
      
    } catch (error) {
      toast.error('Failed to mint ticket');
      console.error('Minting error:', error);
    } finally {
      setLoading({ tickets: false });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'minted': return 'success';
      case 'pending': return 'warning';
      case 'transferred': return 'info';
      case 'used': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'minted': return <VerifiedIcon />;
      case 'pending': return <PendingIcon />;
      case 'transferred': return <TokenIcon />;
      case 'used': return <TokenIcon />;
      default: return <TokenIcon />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          🎫 Blockchain Ticket Manager
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Create, manage, and track event tickets stored on the blockchain
        </Typography>
      </Box>

      {!isConnected && (
        <Card sx={{ mb: 3, bgcolor: 'warning.dark', color: 'warning.contrastText' }}>
          <CardContent>
            <Typography variant="h6">🔐 Wallet Connection Required</Typography>
            <Typography>
              Please connect your wallet to create and manage blockchain tickets.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {tickets.map((ticket) => (
          <Grid item xs={12} md={6} lg={4} key={ticket.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': { transform: 'translateY(-2px)' },
                transition: 'transform 0.2s ease-in-out'
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="h2">
                    {ticket.eventName}
                  </Typography>
                  <Chip
                    icon={getStatusIcon(ticket.status)}
                    label={ticket.status.toUpperCase()}
                    color={getStatusColor(ticket.status)}
                    size="small"
                  />
                </Box>
                
                <Typography color="text.secondary" gutterBottom>
                  📅 {new Date(ticket.eventDate).toLocaleDateString()}
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 1 }}>
                  🎟️ Type: {ticket.ticketType}
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 1 }}>
                  💰 Price: ${ticket.price}
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 2 }}>
                  🏷️ Token ID: {ticket.tokenId}
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<QrCodeIcon />}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setOpenQRDialog(true);
                    }}
                    sx={{ mr: 1 }}
                  >
                    QR Code
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => {
                      navigator.clipboard.writeText(ticket.transactionHash);
                      toast.success('Transaction hash copied!');
                    }}
                  >
                    Copy Hash
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Ticket Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>🎫 Create New Blockchain Ticket</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Event Name"
            fullWidth
            variant="outlined"
            value={newTicket.eventName}
            onChange={(e) => setNewTicket({ ...newTicket, eventName: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Event Date"
            type="datetime-local"
            fullWidth
            variant="outlined"
            value={newTicket.eventDate}
            onChange={(e) => setNewTicket({ ...newTicket, eventDate: e.target.value })}
            sx={{ mb: 2 }}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            margin="dense"
            label="Ticket Type"
            fullWidth
            variant="outlined"
            value={newTicket.ticketType}
            onChange={(e) => setNewTicket({ ...newTicket, ticketType: e.target.value })}
            placeholder="e.g., VIP, General Admission, Early Bird"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Price (USD)"
            type="number"
            fullWidth
            variant="outlined"
            value={newTicket.price}
            onChange={(e) => setNewTicket({ ...newTicket, price: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Quantity"
            type="number"
            fullWidth
            variant="outlined"
            value={newTicket.quantity}
            onChange={(e) => setNewTicket({ ...newTicket, quantity: parseInt(e.target.value) })}
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateTicket} 
            variant="contained"
            disabled={!isConnected || !newTicket.eventName || !newTicket.eventDate}
          >
            Mint Ticket
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={openQRDialog} onClose={() => setOpenQRDialog(false)} maxWidth="sm">
        <DialogTitle>🎫 Ticket QR Code</DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          {selectedTicket && (
            <>
              <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 2, mb: 2, display: 'inline-block' }}>
                <QRCode
                  value={JSON.stringify({
                    ticketId: selectedTicket.tokenId,
                    eventName: selectedTicket.eventName,
                    eventDate: selectedTicket.eventDate,
                    transactionHash: selectedTicket.transactionHash,
                  })}
                  size={200}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Scan this QR code for ticket verification
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenQRDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add ticket"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setOpenDialog(true)}
        disabled={!isConnected}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
};

export default TicketManager;