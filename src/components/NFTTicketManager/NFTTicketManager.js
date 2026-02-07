/**
 * NFT Ticket Manager Component
 * For event organizers to create and manage NFT ticket tiers
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  AccountBalanceWallet as WalletIcon,
  Token as TokenIcon,
  QrCode as QrCodeIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import blockchainService from '../../services/blockchainService';
import {
  createNFTTicketTier,
  getEventNFTTicketTiers,
  getEventNFTTicketStats,
} from '../../services/nftTicketService';
import ContractABI from '../../contracts/EventTicketNFT.json';
import toast from 'react-hot-toast';

const NFTTicketManager = ({ event }) => {
  const { user } = useAuth();
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [tiers, setTiers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTier, setNewTier] = useState({
    name: '',
    description: '',
    price: '',
    maxSupply: '',
    image: '',
  });

  useEffect(() => {
    if (event.id) {
      loadTiers();
      loadStats();
    }
  }, [event.id]);

  const loadTiers = async () => {
    setLoading(true);
    const { data } = await getEventNFTTicketTiers(event.id);
    setTiers(data);
    setLoading(false);
  };

  const loadStats = async () => {
    const { data } = await getEventNFTTicketStats(event.id);
    setStats(data);
  };

  const handleConnectWallet = async () => {
    try {
      setLoading(true);
      const wallet = await blockchainService.connectWallet();
      setWalletAddress(wallet.address);
      setWalletConnected(true);
      toast.success(`Wallet connected: ${blockchainService.formatAddress(wallet.address)}`);

      // Initialize contract
      const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
      if (!contractAddress) {
        toast.error('Contract address not configured');
        return;
      }

      await blockchainService.initContract(contractAddress, ContractABI.abi);
    } catch (error) {
      toast.error('Failed to connect wallet');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTier = async () => {
    if (!walletConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!newTier.name || !newTier.price || !newTier.maxSupply) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      // Create tier on blockchain and Firebase
      const { tierId, error } = await createNFTTicketTier(
        event.id,
        {
          name: newTier.name,
          description: newTier.description,
          price: parseFloat(newTier.price),
          maxSupply: parseInt(newTier.maxSupply),
          image: newTier.image,
        },
        walletAddress
      );

      if (error) {
        toast.error('Failed to create ticket tier: ' + error);
        return;
      }

      toast.success('Ticket tier created successfully!');
      setCreateDialogOpen(false);
      setNewTier({ name: '', description: '', price: '', maxSupply: '', image: '' });
      loadTiers();
      loadStats();
    } catch (error) {
      toast.error('Failed to create ticket tier');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TokenIcon />
          NFT Ticket Management
        </Typography>

        {!walletConnected ? (
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <WalletIcon />}
            onClick={handleConnectWallet}
            disabled={loading}
          >
            Connect Wallet
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip
              icon={<WalletIcon />}
              label={blockchainService.formatAddress(walletAddress)}
              color="success"
              variant="filled"
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Tier
            </Button>
          </Box>
        )}
      </Box>

      {!walletConnected && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Connect your MetaMask wallet to create and manage NFT tickets for this event.
        </Alert>
      )}

      {/* Stats */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Tiers
                </Typography>
                <Typography variant="h4">{stats.totalTiers}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Capacity
                </Typography>
                <Typography variant="h4">{stats.totalCapacity}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Tickets Sold
                </Typography>
                <Typography variant="h4">{stats.totalSold}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Revenue (MATIC)
                </Typography>
                <Typography variant="h4">{stats.totalRevenue.toFixed(2)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Ticket Tiers */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        Ticket Tiers
      </Typography>

      {loading && tiers.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : tiers.length === 0 ? (
        <Alert severity="info">
          No NFT ticket tiers created yet. {walletConnected && 'Click "Create Tier" to get started!'}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {tiers.map((tier) => (
            <Grid item xs={12} sm={6} md={4} key={tier.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Typography variant="h6">{tier.name}</Typography>
                    <Chip
                      label={tier.isActive ? 'Active' : 'Inactive'}
                      color={tier.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {tier.description || 'No description'}
                  </Typography>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Price
                    </Typography>
                    <Typography variant="h5">{tier.price} MATIC</Typography>
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Availability
                    </Typography>
                    <Typography variant="body1">
                      {tier.sold} / {tier.maxSupply} sold
                    </Typography>
                    <Box
                      sx={{
                        width: '100%',
                        height: 8,
                        bgcolor: 'rgba(0,0,0,0.1)',
                        borderRadius: 4,
                        mt: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: `${(tier.sold / tier.maxSupply) * 100}%`,
                          height: '100%',
                          bgcolor: 'primary.main',
                          borderRadius: 4,
                        }}
                      />
                    </Box>
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    Tier ID: #{tier.tierId}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Tier Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Create NFT Ticket Tier
            <IconButton onClick={() => setCreateDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Tier Name"
              placeholder="e.g., VIP, General Admission"
              value={newTier.name}
              onChange={(e) => setNewTier({ ...newTier, name: e.target.value })}
              required
              fullWidth
            />

            <TextField
              label="Description"
              placeholder="Describe this ticket tier"
              value={newTier.description}
              onChange={(e) => setNewTier({ ...newTier, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />

            <TextField
              label="Price (MATIC)"
              type="number"
              placeholder="0.1"
              value={newTier.price}
              onChange={(e) => setNewTier({ ...newTier, price: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">MATIC</InputAdornment>,
              }}
              required
              fullWidth
            />

            <TextField
              label="Max Supply"
              type="number"
              placeholder="100"
              value={newTier.maxSupply}
              onChange={(e) => setNewTier({ ...newTier, maxSupply: e.target.value })}
              helperText="Total number of tickets available"
              required
              fullWidth
            />

            <TextField
              label="Image URL (optional)"
              placeholder="https://..."
              value={newTier.image}
              onChange={(e) => setNewTier({ ...newTier, image: e.target.value })}
              helperText="NFT image URL (IPFS recommended)"
              fullWidth
            />

            <Alert severity="info">
              Creating a ticket tier requires a small gas fee (~$0.02 on Polygon)
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateTier}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Creating...' : 'Create Tier'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default NFTTicketManager;
