import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  IconButton,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Event as EventIcon,
  LocalShipping as ShippingIcon,
  Analytics as AnalyticsIcon,
  Token as TokenIcon,
  AccountBalanceWallet as WalletIcon,
  MoreVert as MoreIcon,
  ViewTimeline as TimelineIcon,
  CalendarMonth as ScheduleIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import AuthDialog from '../Account/AuthDialog';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    userProfile,
    logout,
    isAuthenticated,
    // Account-scoped wallet from AuthContext
    walletAddress,
    isWalletConnected,
    connectWallet,
    disconnectWallet,
    network
  } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [accountMenuAnchor, setAccountMenuAnchor] = useState(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const navigationItems = [
    { path: '/events', label: 'Events', icon: <EventIcon /> },
    { path: '/timeline', label: 'Timeline', icon: <TimelineIcon /> },
    { path: '/orders', label: 'Orders', icon: <ShippingIcon /> },
    { path: '/shipments', label: 'Shipments', icon: <ShippingIcon /> },
    { path: '/tickets', label: 'Blockchain Tickets', icon: <TokenIcon /> },
    { path: '/analytics', label: 'Analytics', icon: <AnalyticsIcon /> },
    { path: '/predictions', label: 'Predictions', icon: <AnalyticsIcon /> },
    // TODO: Make this conditional based on selected hackathon event
    // For now, this will navigate to schedule builder (needs eventId as URL parameter)
  ];

  const handleWalletClick = () => {
    if (isWalletConnected) {
      setAnchorEl(document.getElementById('wallet-button'));
    } else {
      connectWallet();
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAccountMenuOpen = (event) => {
    setAccountMenuAnchor(event.currentTarget);
  };

  const handleAccountMenuClose = () => {
    setAccountMenuAnchor(null);
  };

  const handleLogout = async () => {
    await logout();
    handleAccountMenuClose();
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: 'rgba(10, 10, 10, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 212, 255, 0.1)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
      }}
    >
      <Toolbar sx={{ py: 1 }}>
        <Box
          onClick={() => navigate('/')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            mr: 4,
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #00d4ff 0%, #ff6b9d 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1.5,
              boxShadow: '0 4px 20px rgba(0, 212, 255, 0.3)',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: '0 6px 25px rgba(0, 212, 255, 0.5)',
              },
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0a0a0a' }}>
              O
            </Typography>
          </Box>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #00d4ff 0%, #ff6b9d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            Orchestrate
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1, display: 'flex', gap: 0.5 }}>
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                startIcon={item.icon}
                onClick={() => navigate(item.path)}
                sx={{
                  color: isActive ? '#00d4ff' : 'rgba(255, 255, 255, 0.7)',
                  background: isActive
                    ? 'rgba(0, 212, 255, 0.15)'
                    : 'transparent',
                  border: isActive
                    ? '1px solid rgba(0, 212, 255, 0.3)'
                    : '1px solid transparent',
                  borderRadius: 2,
                  px: 2,
                  py: 0.75,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  backdropFilter: isActive ? 'blur(10px)' : 'none',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    background: 'rgba(0, 212, 255, 0.1)',
                    color: '#00d4ff',
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    transform: 'translateY(-1px)',
                  },
                  '& .MuiButton-startIcon': {
                    color: isActive ? '#00d4ff' : 'inherit',
                  },
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Only show wallet button if user is authenticated */}
          {isAuthenticated && (
            <>
              {isWalletConnected && network && (
                <Chip
                  label={network.name || 'Unknown Network'}
                  size="small"
                  sx={{
                    background: 'rgba(255, 107, 157, 0.15)',
                    border: '1px solid rgba(255, 107, 157, 0.3)',
                    color: '#ff6b9d',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)',
                  }}
                />
              )}

              <Button
                id="wallet-button"
                startIcon={<WalletIcon />}
                onClick={handleWalletClick}
                variant={isWalletConnected ? "outlined" : "contained"}
                sx={{
                  background: isWalletConnected
                    ? 'transparent'
                    : 'linear-gradient(135deg, #00d4ff 0%, #00a3cc 100%)',
                  border: isWalletConnected
                    ? '1px solid rgba(0, 212, 255, 0.5)'
                    : 'none',
                  color: isWalletConnected ? '#00d4ff' : '#0a0a0a',
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontWeight: 700,
                  backdropFilter: isWalletConnected ? 'blur(10px)' : 'none',
                  boxShadow: isWalletConnected
                    ? 'none'
                    : '0 4px 20px rgba(0, 212, 255, 0.3)',
                  '&:hover': {
                    background: isWalletConnected
                      ? 'rgba(0, 212, 255, 0.1)'
                      : 'linear-gradient(135deg, #00a3cc 0%, #007a99 100%)',
                    border: isWalletConnected
                      ? '1px solid rgba(0, 212, 255, 0.7)'
                      : 'none',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 25px rgba(0, 212, 255, 0.4)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                {isWalletConnected ? formatAddress(walletAddress) : 'Connect Wallet'}
              </Button>
            </>
          )}

          {/* Account Button */}
          {isAuthenticated ? (
            <IconButton
              onClick={handleAccountMenuOpen}
              sx={{
                border: '2px solid rgba(0, 212, 255, 0.5)',
                '&:hover': {
                  background: 'rgba(0, 212, 255, 0.1)',
                  border: '2px solid rgba(0, 212, 255, 0.7)',
                }
              }}
            >
              <Avatar
                src={userProfile?.photoURL || user?.photoURL}
                sx={{ width: 32, height: 32 }}
              >
                {(userProfile?.displayName || user?.email)?.[0]?.toUpperCase()}
              </Avatar>
            </IconButton>
          ) : (
            <Button
              variant="outlined"
              startIcon={<AccountIcon />}
              onClick={() => setAuthDialogOpen(true)}
              sx={{
                border: '1px solid rgba(255, 107, 157, 0.5)',
                color: '#ff6b9d',
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 700,
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  background: 'rgba(255, 107, 157, 0.1)',
                  border: '1px solid rgba(255, 107, 157, 0.7)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              Sign In
            </Button>
          )}

          {/* Wallet Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1.5,
                  background: 'rgba(26, 26, 26, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 212, 255, 0.2)',
                  borderRadius: 2,
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
                }
              }
            }}
          >
            <MenuItem
              onClick={() => {
                navigator.clipboard.writeText(walletAddress);
                handleMenuClose();
              }}
              sx={{
                fontWeight: 600,
                '&:hover': {
                  background: 'rgba(0, 212, 255, 0.1)',
                  color: '#00d4ff',
                }
              }}
            >
              Copy Address
            </MenuItem>
            <MenuItem
              onClick={() => {
                disconnectWallet();
                handleMenuClose();
              }}
              sx={{
                fontWeight: 600,
                color: '#ff6b9d',
                '&:hover': {
                  background: 'rgba(255, 107, 157, 0.1)',
                }
              }}
            >
              Disconnect
            </MenuItem>
          </Menu>

          {/* Account Menu */}
          <Menu
            anchorEl={accountMenuAnchor}
            open={Boolean(accountMenuAnchor)}
            onClose={handleAccountMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1.5,
                  background: 'rgba(26, 26, 26, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 107, 157, 0.2)',
                  borderRadius: 2,
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
                  minWidth: 200,
                }
              }
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Typography variant="body2" color="text.secondary">
                Signed in as
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                {userProfile?.displayName || user?.email}
              </Typography>
            </Box>
            <MenuItem
              onClick={() => {
                navigate('/account');
                handleAccountMenuClose();
              }}
              sx={{
                fontWeight: 600,
                '&:hover': {
                  background: 'rgba(255, 107, 157, 0.1)',
                  color: '#ff6b9d',
                }
              }}
            >
              <AccountIcon sx={{ mr: 1.5, fontSize: 20 }} />
              Account Settings
            </MenuItem>
            <MenuItem
              onClick={handleLogout}
              sx={{
                fontWeight: 600,
                color: '#ff6b9d',
                '&:hover': {
                  background: 'rgba(255, 107, 157, 0.1)',
                }
              }}
            >
              <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} />
              Sign Out
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      {/* Auth Dialog */}
      <AuthDialog open={authDialogOpen} onClose={() => setAuthDialogOpen(false)} />
    </AppBar>
  );
};

export default Navbar;