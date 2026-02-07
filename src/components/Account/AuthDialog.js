import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  Google as GoogleIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const AuthDialog = ({ open, onClose }) => {
  const { signInGoogle, signInEmail, signUpEmail } = useAuth();
  const [tab, setTab] = useState(0); // 0 = Sign In, 1 = Sign Up
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    // Clear form when switching tabs
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await signInGoogle();
    setLoading(false);
    if (!error) {
      onClose();
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (tab === 0) {
      // Sign In
      const { error } = await signInEmail(email, password);
      setLoading(false);
      if (!error) {
        onClose();
      }
    } else {
      // Sign Up
      const { error } = await signUpEmail(email, password, displayName);
      setLoading(false);
      if (!error) {
        onClose();
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: 'rgba(26, 26, 26, 0.98)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Welcome to Orchestrate
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Tabs
            value={tab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 600,
              },
              '& .Mui-selected': {
                color: '#00d4ff !important',
              },
            }}
          >
            <Tab label="Sign In" />
            <Tab label="Sign Up" />
          </Tabs>
        </Box>

        {/* Google Sign In */}
        <Button
          fullWidth
          variant="outlined"
          size="large"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleSignIn}
          disabled={loading}
          sx={{
            mb: 3,
            py: 1.5,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            '&:hover': {
              border: '1px solid rgba(0, 212, 255, 0.5)',
              background: 'rgba(0, 212, 255, 0.05)',
            }
          }}
        >
          Continue with Google
        </Button>

        <Divider sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            OR
          </Typography>
        </Divider>

        {/* Email/Password Form */}
        <Box component="form" onSubmit={handleEmailAuth}>
          {tab === 1 && (
            <TextField
              fullWidth
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
          )}

          <TextField
            fullWidth
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={{ mb: 3 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={{
              py: 1.5,
              background: 'linear-gradient(135deg, #00d4ff 0%, #00a3cc 100%)',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #00a3cc 0%, #007a99 100%)',
              }
            }}
          >
            {loading ? 'Processing...' : tab === 0 ? 'Sign In' : 'Create Account'}
          </Button>
        </Box>

        {tab === 0 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              size="small"
              sx={{ color: 'text.secondary', textTransform: 'none' }}
            >
              Forgot password?
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
