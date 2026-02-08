import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Avatar,
  Button,
  TextField,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Email as EmailIcon,
  AccountBalanceWallet as WalletIcon,
  Edit as EditIcon,
  CheckCircle as CheckIcon,
  ContentCopy as CopyIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import RoleSelector from './RoleSelector';
import toast from 'react-hot-toast';

const AccountPage = () => {
  const {
    user,
    userProfile,
    updateProfile,
    isWalletSynced,
    syncWalletToProfile,
    // Account-scoped wallet
    walletAddress,
    isWalletConnected,
    connectWallet,
    network
  } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [bio, setBio] = useState(userProfile?.bio || '');

  const handleSaveProfile = async () => {
    await updateProfile({
      displayName,
      bio
    });
    setEditMode(false);
  };

  const handleCopyAddress = (address) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard!');
  };

  const handleSyncWallet = async () => {
    if (isWalletConnected && walletAddress) {
      await syncWalletToProfile(walletAddress);
    }
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Please sign in to view your account
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #00d4ff 30%, #ff6b9d 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}
        >
          Account Settings
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Manage your profile and connected wallets
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 4,
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Profile Information
              </Typography>
              <Button
                variant={editMode ? 'contained' : 'outlined'}
                startIcon={editMode ? <CheckIcon /> : <EditIcon />}
                onClick={editMode ? handleSaveProfile : () => setEditMode(true)}
              >
                {editMode ? 'Save Changes' : 'Edit Profile'}
              </Button>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Avatar
                src={userProfile?.photoURL || user?.photoURL}
                sx={{
                  width: 100,
                  height: 100,
                  mr: 3,
                  border: '3px solid',
                  borderColor: 'primary.main',
                }}
              >
                {(userProfile?.displayName || user?.email)?.[0]?.toUpperCase()}
              </Avatar>
              <Box>
                {editMode ? (
                  <TextField
                    fullWidth
                    label="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                ) : (
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                    {userProfile?.displayName || user?.displayName || 'Anonymous User'}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body1" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {editMode ? (
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
              />
            ) : (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Bio
                </Typography>
                <Typography variant="body1">
                  {userProfile?.bio || 'No bio added yet.'}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Account Details
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    User ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                    {user?.uid?.slice(0, 12)}...
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Member Since
                  </Typography>
                  <Typography variant="body1">
                    {userProfile?.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Wallet Card */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              mb: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <WalletIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Wallet
                </Typography>
                {isWalletSynced ? (
                  <Chip
                    label="Synced"
                    size="small"
                    color="success"
                    icon={<CheckIcon />}
                  />
                ) : (
                  <Chip
                    label="Not Synced"
                    size="small"
                    color="warning"
                  />
                )}
              </Box>
            </Box>

            {isWalletConnected ? (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Connected Wallet
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      background: 'rgba(0, 212, 255, 0.1)',
                      border: '1px solid rgba(0, 212, 255, 0.3)',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                    >
                      {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleCopyAddress(walletAddress)}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                {network && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Network
                    </Typography>
                    <Chip
                      label={network.name}
                      size="small"
                      sx={{
                        background: 'rgba(255, 107, 157, 0.15)',
                        border: '1px solid rgba(255, 107, 157, 0.3)',
                        color: '#ff6b9d',
                      }}
                    />
                  </Box>
                )}

                {userProfile?.walletAddress && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Synced to Account
                      </Typography>
                      <Box
                        sx={{
                          p: 2,
                          background: 'rgba(76, 175, 80, 0.1)',
                          border: '1px solid rgba(76, 175, 80, 0.3)',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                        >
                          {userProfile.walletAddress?.slice(0, 6)}...{userProfile.walletAddress?.slice(-4)}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleCopyAddress(userProfile.walletAddress)}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </>
                )}

                {!isWalletSynced && (
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<SyncIcon />}
                    onClick={handleSyncWallet}
                    sx={{ mt: 2 }}
                  >
                    Sync Wallet to Account
                  </Button>
                )}
              </>
            ) : (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Connect your Web3 wallet to sync with your account
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<WalletIcon />}
                  onClick={connectWallet}
                >
                  Connect Wallet
                </Button>
              </Box>
            )}
          </Paper>

          {/* Role Selector */}
          <Box sx={{ mb: 3 }}>
            <RoleSelector />
          </Box>

          {/* Activity Card */}
          <Paper
            sx={{
              p: 3,
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Account Activity
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body1">
                  {userProfile?.updatedAt?.toDate?.()?.toLocaleString() || 'N/A'}
                </Typography>
              </Box>
              {userProfile?.walletConnectedAt && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Wallet Connected
                  </Typography>
                  <Typography variant="body1">
                    {userProfile.walletConnectedAt?.toDate?.()?.toLocaleString() || 'N/A'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AccountPage;
