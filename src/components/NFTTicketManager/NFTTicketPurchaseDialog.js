/**
 * NFT Ticket Purchase Dialog
 * For attendees to buy NFT tickets
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  IconButton,
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  Close as CloseIcon,
  OpenInNew as ExternalIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import blockchainService from '../../services/blockchainService';
import { purchaseNFTTicket } from '../../services/nftTicketService';
import ContractABI from '../../contracts/EventTicketNFT.json';
import toast from 'react-hot-toast';

const NFTTicketPurchaseDialog = ({ open, onClose, tier, event }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [txHash, setTxHash] = useState(null);

  const handleConnectWallet = async () => {
    try {
      setLoading(true);
      const wallet = await blockchainService.connectWallet();
      setWalletAddress(wallet.address);
      setWalletConnected(true);
      toast.success(`Wallet connected: ${blockchainService.formatAddress(wallet.address)}`);

      // Initialize contract
      const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
      await blockchainService.initContract(contractAddress, ContractABI.abi);
    } catch (error) {
      toast.error('Failed to connect wallet');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!walletConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);

      // Check if user already owns this ticket
      const alreadyOwns = await blockchainService.ownsTicket(tier.tierId, walletAddress);
      if (alreadyOwns) {
        toast.error('You already own this ticket!');
        return;
      }

      // Purchase ticket
      const { transactionHash, error } = await purchaseNFTTicket(
        tier.tierId,
        user.uid,
        walletAddress
      );

      if (error) {
        toast.error('Purchase failed: ' + error);
        return;
      }

      setTxHash(transactionHash);
      toast.success('Ticket purchased successfully!');

      // Wait a moment then close
      setTimeout(() => {
        onClose();
        window.location.reload(); // Refresh to show new ticket
      }, 3000);
    } catch (error) {
      toast.error('Purchase failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!tier) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Purchase NFT Ticket
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {tier.name}
            </Typography>

            {tier.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {tier.description}
              </Typography>
            )}

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Event
              </Typography>
              <Typography variant="body1">{event?.name}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Price
              </Typography>
              <Typography variant="h4" color="primary">
                {tier.price} MATIC
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ≈ ${(parseFloat(tier.price) * 0.8).toFixed(2)} USD
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Availability
              </Typography>
              <Typography variant="body1">
                {tier.available} / {tier.maxSupply} remaining
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {!walletConnected ? (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              Connect your MetaMask wallet to purchase this NFT ticket
            </Alert>

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={20} /> : <WalletIcon />}
              onClick={handleConnectWallet}
              disabled={loading}
            >
              Connect MetaMask
            </Button>
          </>
        ) : (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">
                  Wallet: {blockchainService.formatAddress(walletAddress)}
                </Typography>
              </Box>
            </Alert>

            {txHash ? (
              <Alert severity="success" icon={false}>
                <Typography variant="body2" gutterBottom>
                  Purchase successful! 🎉
                </Typography>
                <Button
                  size="small"
                  endIcon={<ExternalIcon />}
                  href={blockchainService.getExplorerUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Transaction
                </Button>
              </Alert>
            ) : (
              <>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  You will be charged {tier.price} MATIC + gas fees (~$0.01)
                </Alert>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handlePurchase}
                  disabled={loading || tier.available === 0}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Processing...' : 'Purchase Ticket'}
                </Button>
              </>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {txHash ? 'Close' : 'Cancel'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NFTTicketPurchaseDialog;
