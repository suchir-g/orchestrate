import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Divider,
  Avatar,
  Chip,
  Badge,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Event as EventIcon,
  LocalShipping as ShippingIcon,
  Analytics as AnalyticsIcon,
  Token as TokenIcon,
  AccountBalanceWallet as WalletIcon,
  ViewTimeline as TimelineIcon,
  Message as MessageIcon,
  ChevronLeft as CollapseIcon,
  ChevronRight as ExpandIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import AuthDialog from '../Account/AuthDialog';
import { getUnreadThreadCount, listenToUserThreads } from '../../services/enhancedMessagingService';

const DRAWER_WIDTH = 240;
const DRAWER_WIDTH_COLLAPSED = 65;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    userProfile,
    logout,
    isAuthenticated,
    walletAddress,
    isWalletConnected,
    connectWallet,
    disconnectWallet,
    network
  } = useAuth();

  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountMenuAnchor, setAccountMenuAnchor] = useState(null);
  const [walletMenuAnchor, setWalletMenuAnchor] = useState(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Listen to unread message count
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    getUnreadThreadCount(user.uid).then(count => setUnreadCount(count));

    const unsubscribe = listenToUserThreads(user.uid, (threads) => {
      const unread = threads.filter(t => {
        const userUnread = t.unreadCount?.[user.uid] || 0;
        return userUnread > 0 && t.status === 'open';
      }).length;
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  const navigationItems = [
    { path: '/events', label: 'Events', icon: <EventIcon /> },
    { path: '/messages', label: 'Messages', icon: <MessageIcon />, badge: unreadCount },
    { path: '/timeline', label: 'Timeline', icon: <TimelineIcon /> },
    { path: '/orders', label: 'Orders', icon: <ShippingIcon /> },
    { path: '/shipments', label: 'Shipments', icon: <ShippingIcon /> },
    { path: '/tickets', label: 'Blockchain Tickets', icon: <TokenIcon /> },
    { path: '/analytics', label: 'Analytics & Predictions', icon: <AnalyticsIcon /> },
  ];

  const handleAccountMenuOpen = (event) => {
    setAccountMenuAnchor(event.currentTarget);
  };

  const handleAccountMenuClose = () => {
    setAccountMenuAnchor(null);
  };

  const handleWalletMenuOpen = (event) => {
    setWalletMenuAnchor(event.currentTarget);
  };

  const handleWalletMenuClose = () => {
    setWalletMenuAnchor(null);
  };

  const handleLogout = async () => {
    await logout();
    handleAccountMenuClose();
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo & Toggle */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: 64,
        }}
      >
        {!collapsed && (
          <Box
            onClick={() => {
              navigate('/');
              setMobileOpen(false);
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': { opacity: 0.8 },
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                background: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 1.5,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'white' }}>
                O
              </Typography>
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: 'white',
                fontSize: '1.1rem',
              }}
            >
              Orchestrate
            </Typography>
          </Box>
        )}
        <IconButton
          onClick={toggleCollapsed}
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': { color: 'white', bgcolor: 'rgba(255, 255, 255, 0.1)' },
            display: { xs: 'none', sm: 'flex' },
          }}
        >
          {collapsed ? <ExpandIcon /> : <CollapseIcon />}
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      {/* Navigation Items */}
      <List sx={{ flex: 1, py: 2 }}>
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            const icon = item.badge > 0 ? (
              <Badge badgeContent={item.badge} color="error">
                {item.icon}
              </Badge>
            ) : item.icon;

            return (
              <Tooltip
                key={item.path}
                title={collapsed ? item.label : ''}
                placement="right"
                arrow
              >
                <ListItem disablePadding sx={{ px: 1, mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => {
                      navigate(item.path);
                      setMobileOpen(false);
                    }}
                    sx={{
                      borderRadius: 2,
                      minHeight: 48,
                      justifyContent: collapsed ? 'center' : 'initial',
                      px: collapsed ? 0 : 2.5,
                      bgcolor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                      border: isActive ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: collapsed ? 0 : 2,
                        justifyContent: 'center',
                        color: isActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
                      }}
                    >
                      {icon}
                    </ListItemIcon>
                    {!collapsed && (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              </Tooltip>
            );
          })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      {/* Bottom Section - Wallet & Account */}
      <Box sx={{ p: 1 }}>
          {isAuthenticated && (
            <>
              {/* Wallet Section */}
              {isWalletConnected && !collapsed && network && (
                <Chip
                  label={network.name || 'Unknown Network'}
                  size="small"
                  sx={{
                    width: '100%',
                    mb: 1,
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontSize: '0.7rem',
                  }}
                />
              )}

              <Tooltip title={collapsed ? (isWalletConnected ? 'Wallet' : 'Connect Wallet') : ''} placement="right" arrow>
                <ListItemButton
                  onClick={isWalletConnected ? handleWalletMenuOpen : connectWallet}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    justifyContent: collapsed ? 'center' : 'initial',
                    px: collapsed ? 0 : 2,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    minHeight: 48,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.08)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: collapsed ? 0 : 2,
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    <WalletIcon />
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={isWalletConnected ? formatAddress(walletAddress) : 'Connect Wallet'}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'white',
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>

              {/* Account Section */}
              <Tooltip title={collapsed ? 'Account' : ''} placement="right" arrow>
                <ListItemButton
                  onClick={handleAccountMenuOpen}
                  sx={{
                    borderRadius: 2,
                    justifyContent: collapsed ? 'center' : 'initial',
                    px: collapsed ? 0 : 2,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    minHeight: 48,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.08)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: collapsed ? 0 : 1.5,
                      justifyContent: 'center',
                    }}
                  >
                    <Avatar
                      src={userProfile?.photoURL || user?.photoURL}
                      sx={{ width: 32, height: 32 }}
                    >
                      {(userProfile?.displayName || user?.email)?.[0]?.toUpperCase()}
                    </Avatar>
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={userProfile?.displayName || user?.email}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'white',
                        noWrap: true,
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </>
          )}

          {!isAuthenticated && (
            <Tooltip title={collapsed ? 'Sign In' : ''} placement="right" arrow>
              <ListItemButton
                onClick={() => setAuthDialogOpen(true)}
                sx={{
                  borderRadius: 2,
                  justifyContent: collapsed ? 'center' : 'initial',
                  px: collapsed ? 0 : 2,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  minHeight: 48,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: collapsed ? 0 : 2,
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <AccountIcon />
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary="Sign In"
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'white',
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          )}
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <IconButton
        onClick={() => setMobileOpen(true)}
        sx={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 1300,
          display: { xs: 'flex', sm: 'none' },
          bgcolor: 'rgba(10, 10, 10, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          '&:hover': {
            bgcolor: 'rgba(20, 20, 20, 0.9)',
          },
        }}
      >
        <MenuIcon sx={{ color: 'white' }} />
      </IconButton>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            background: 'rgba(10, 10, 10, 0.98)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH,
            boxSizing: 'border-box',
            background: 'rgba(10, 10, 10, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'width 0.3s ease-in-out',
            overflowX: 'hidden',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Wallet Menu */}
        <Menu
          anchorEl={walletMenuAnchor}
          open={Boolean(walletMenuAnchor)}
          onClose={handleWalletMenuClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          slotProps={{
            paper: {
              sx: {
                background: 'rgba(26, 26, 26, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 2,
              }
            }
          }}
        >
          <MenuItem
            onClick={() => {
              navigator.clipboard.writeText(walletAddress);
              handleWalletMenuClose();
            }}
          >
            Copy Address
          </MenuItem>
          <MenuItem
            onClick={() => {
              disconnectWallet();
              handleWalletMenuClose();
            }}
            sx={{ color: 'error.main' }}
          >
            Disconnect
          </MenuItem>
        </Menu>

        {/* Account Menu */}
        <Menu
          anchorEl={accountMenuAnchor}
          open={Boolean(accountMenuAnchor)}
          onClose={handleAccountMenuClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          slotProps={{
            paper: {
              sx: {
                background: 'rgba(26, 26, 26, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 2,
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
          >
            <AccountIcon sx={{ mr: 1.5, fontSize: 20 }} />
            Account Settings
          </MenuItem>
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} />
            Sign Out
          </MenuItem>
        </Menu>
      {/* Auth Dialog */}
      <AuthDialog open={authDialogOpen} onClose={() => setAuthDialogOpen(false)} />
    </>
  );
};

export default Sidebar;
