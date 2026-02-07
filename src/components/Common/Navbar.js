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
} from '@mui/icons-material';
import { useBlockchain } from '../../context/BlockchainContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { account, isConnected, connectWallet, disconnectWallet, network } = useBlockchain();
  const [anchorEl, setAnchorEl] = useState(null);

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
    if (isConnected) {
      setAnchorEl(document.getElementById('wallet-button'));
    } else {
      connectWallet();
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
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
          {isConnected && network && (
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
            variant={isConnected ? "outlined" : "contained"}
            sx={{
              background: isConnected
                ? 'transparent'
                : 'linear-gradient(135deg, #00d4ff 0%, #00a3cc 100%)',
              border: isConnected
                ? '1px solid rgba(0, 212, 255, 0.5)'
                : 'none',
              color: isConnected ? '#00d4ff' : '#0a0a0a',
              borderRadius: 2,
              px: 3,
              py: 1,
              fontWeight: 700,
              backdropFilter: isConnected ? 'blur(10px)' : 'none',
              boxShadow: isConnected
                ? 'none'
                : '0 4px 20px rgba(0, 212, 255, 0.3)',
              '&:hover': {
                background: isConnected
                  ? 'rgba(0, 212, 255, 0.1)'
                  : 'linear-gradient(135deg, #00a3cc 0%, #007a99 100%)',
                border: isConnected
                  ? '1px solid rgba(0, 212, 255, 0.7)'
                  : 'none',
                transform: 'translateY(-1px)',
                boxShadow: '0 6px 25px rgba(0, 212, 255, 0.4)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            {isConnected ? formatAddress(account) : 'Connect Wallet'}
          </Button>

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
                navigator.clipboard.writeText(account);
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
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;