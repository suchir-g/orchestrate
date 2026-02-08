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
  Chip,
  LinearProgress,
  Skeleton,
} from '@mui/material';
import {
  Token as TokenIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material';
import QRCode from 'react-qr-code';
import { useBlockchain } from '../../context/BlockchainContext';
import { useAppState } from '../../context/AppStateContext';
import toast from 'react-hot-toast';

const TicketManager = () => {
  const { isConnected } = useBlockchain();
  const { events } = useAppState();
  const [openQRDialog, setOpenQRDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [nftTickets, setNftTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load NFT ticket tiers from events
  useEffect(() => {
    if (!events || events.length === 0) {
      setLoading(false);
      setNftTickets([]);
      return;
    }

    // Extract ticket tiers from all events
    const allTicketTiers = [];
    events.forEach(event => {
      if (event.ticketTiers && Array.isArray(event.ticketTiers)) {
        event.ticketTiers.forEach(tier => {
          allTicketTiers.push({
            id: `${event.id}_${tier.name}`,
            eventId: event.id,
            eventName: event.name,
            eventDate: event.date,
            tierName: tier.name,
            price: tier.price,
            totalSupply: tier.supply || 0,
            sold: tier.sold || 0,
            available: (tier.supply || 0) - (tier.sold || 0),
            contractAddress: event.contractAddress || '0x742d35Cc8E5f7A4c5b7a3E4c8F5B9E1D2C3F4A5B',
          });
        });
      }
    });

    setNftTickets(allTicketTiers);
    setLoading(false);
  }, [events]);


  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          🎫 NFT Ticket Manager
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          View all NFT ticket tiers across your events with real-time supply tracking
        </Typography>
      </Box>

      {!isConnected && (
        <Card sx={{ mb: 3, bgcolor: 'warning.dark', color: 'warning.contrastText' }}>
          <CardContent>
            <Typography variant="h6">🔐 Wallet Connection Required</Typography>
            <Typography>
              Please connect your wallet to interact with blockchain tickets.
            </Typography>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <Card sx={{ height: '100%', p: 2 }}>
                <Skeleton variant="text" width="60%" height={30} />
                <Skeleton variant="text" width="40%" sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="70%" />
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : nftTickets.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <TokenIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No NFT Tickets Found
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Create events with ticket tiers to see them here
            </Typography>
            <Button variant="contained" href="/events">
              Go to Events
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {nftTickets.map((ticket) => (
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
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {ticket.eventName}
                      </Typography>
                      <Chip
                        icon={<TokenIcon />}
                        label={ticket.tierName}
                        color="primary"
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>

                  <Typography color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    📅 {new Date(ticket.eventDate).toLocaleDateString()}
                  </Typography>

                  <Typography variant="h5" sx={{ my: 2, color: 'primary.main' }}>
                    ${ticket.price}
                  </Typography>

                  {/* Supply Tracking */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Supply
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {ticket.sold} / {ticket.totalSupply} sold
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(ticket.sold / ticket.totalSupply) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 1,
                        bgcolor: 'rgba(0, 212, 255, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: ticket.available === 0 ? 'error.main' : 'primary.main'
                        }
                      }}
                    />
                    <Typography
                      variant="caption"
                      color={ticket.available === 0 ? 'error.main' : 'success.main'}
                      sx={{ mt: 0.5, display: 'block' }}
                    >
                      {ticket.available > 0
                        ? `${ticket.available} tickets available`
                        : 'SOLD OUT'}
                    </Typography>
                  </Box>

                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Contract: {ticket.contractAddress.slice(0, 10)}...{ticket.contractAddress.slice(-8)}
                  </Typography>

                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<QrCodeIcon />}
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setOpenQRDialog(true);
                      }}
                      fullWidth
                    >
                      View QR
                    </Button>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => {
                        navigator.clipboard.writeText(ticket.contractAddress);
                        toast.success('Contract address copied!');
                      }}
                    >
                      Copy
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* QR Code Dialog */}
      <Dialog open={openQRDialog} onClose={() => setOpenQRDialog(false)} maxWidth="sm">
        <DialogTitle>🎫 NFT Ticket QR Code</DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          {selectedTicket && (
            <>
              <Typography variant="h6" gutterBottom>
                {selectedTicket.eventName}
              </Typography>
              <Chip label={selectedTicket.tierName} color="primary" sx={{ mb: 2 }} />

              <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 2, mb: 2, display: 'inline-block' }}>
                <QRCode
                  value={JSON.stringify({
                    eventId: selectedTicket.eventId,
                    eventName: selectedTicket.eventName,
                    tierName: selectedTicket.tierName,
                    eventDate: selectedTicket.eventDate,
                    contractAddress: selectedTicket.contractAddress,
                    price: selectedTicket.price,
                  })}
                  size={200}
                />
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Scan this QR code for ticket verification
              </Typography>
              <Typography variant="caption" color="text.secondary">
                📅 {new Date(selectedTicket.eventDate).toLocaleDateString()} • ${selectedTicket.price}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenQRDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TicketManager;