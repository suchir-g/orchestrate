import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ethers } from 'ethers';
import { auth, db } from '../config/firebase';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  logout as firebaseLogout
} from '../services/firebaseAuthService';
import { getDefaultUserRole } from '../utils/roleConstants';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Account-scoped wallet state
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletProvider, setWalletProvider] = useState(null);
  const [walletSigner, setWalletSigner] = useState(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [network, setNetwork] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Load user profile from Firestore
        await loadUserProfile(firebaseUser.uid);
      } else {
        setUserProfile(null);
        // Disconnect wallet when user signs out
        disconnectWallet();
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Auto-restore wallet connection when user profile loads
  useEffect(() => {
    if (userProfile?.walletAddress && !isWalletConnected) {
      // Attempt to reconnect to the saved wallet
      restoreWalletConnection();
    }
  }, [userProfile]);

  // Listen for account changes in MetaMask
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined' && user) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== walletAddress) {
          // Account changed in MetaMask
          setWalletAddress(accounts[0]);
          // Update profile with new address
          if (user) {
            syncWalletToProfile(accounts[0]);
          }
        }
      };

      const handleChainChanged = async () => {
        // Reload provider and network info when chain changes
        if (walletProvider) {
          const network = await walletProvider.getNetwork();
          setNetwork({
            name: network.name === 'unknown' ? 'localhost' : network.name,
            chainId: network.chainId.toString()
          });
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [user, walletAddress, walletProvider]);

  // Connect wallet (account-scoped)
  const connectWallet = async () => {
    if (!user) {
      toast.error('Please sign in first to connect your wallet');
      return { error: 'Not authenticated' };
    }

    if (typeof window.ethereum === 'undefined') {
      toast.error('Please install MetaMask to use wallet features');
      return { error: 'MetaMask not installed' };
    }

    try {
      setWalletLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      setWalletProvider(provider);
      setWalletSigner(signer);
      setWalletAddress(accounts[0]);
      setNetwork({
        name: network.name === 'unknown' ? 'localhost' : network.name,
        chainId: network.chainId.toString()
      });
      setIsWalletConnected(true);

      // Sync to user profile
      await syncWalletToProfile(accounts[0]);

      toast.success('Wallet connected and synced to your account!');
      return { error: null };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
      return { error: error.message };
    } finally {
      setWalletLoading(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setWalletAddress(null);
    setWalletProvider(null);
    setWalletSigner(null);
    setIsWalletConnected(false);
    setNetwork(null);
  };

  // Restore wallet connection from saved profile
  const restoreWalletConnection = async () => {
    if (!userProfile?.walletAddress) return;
    if (typeof window.ethereum === 'undefined') return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_accounts", []); // Don't prompt user

      // Check if the saved wallet is currently connected in MetaMask
      if (accounts.includes(userProfile.walletAddress)) {
        const signer = await provider.getSigner();
        const network = await provider.getNetwork();

        setWalletProvider(provider);
        setWalletSigner(signer);
        setWalletAddress(userProfile.walletAddress);
        setNetwork({
          name: network.name === 'unknown' ? 'localhost' : network.name,
          chainId: network.chainId.toString()
        });
        setIsWalletConnected(true);
      }
    } catch (error) {
      console.error('Error restoring wallet connection:', error);
      // Silently fail - user can manually reconnect
    }
  };

  // Load user profile from Firestore
  const loadUserProfile = async (uid) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const profile = userDoc.data();
        // Ensure role exists, add default if missing
        if (!profile.role) {
          const defaultRole = getDefaultUserRole();
          await setDoc(userDocRef, { role: defaultRole }, { merge: true });
          profile.role = defaultRole;
        }
        setUserProfile({ id: userDoc.id, ...profile });
      } else {
        // Create initial profile if it doesn't exist
        const initialProfile = {
          email: auth.currentUser?.email,
          displayName: auth.currentUser?.displayName || '',
          photoURL: auth.currentUser?.photoURL || '',
          walletAddress: null,
          role: getDefaultUserRole(), // Default role for new users
          organizationId: null, // Optional organization membership
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await setDoc(userDocRef, initialProfile);
        setUserProfile({ id: uid, ...initialProfile });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast.error('Failed to load user profile');
    }
  };

  // Sync wallet address to user profile
  const syncWalletToProfile = async (walletAddress) => {
    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const updateData = {
        walletAddress: walletAddress,
        walletConnectedAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(userDocRef, updateData, { merge: true });
      setUserProfile(prev => ({ ...prev, ...updateData }));
      toast.success('Wallet synced to your account!');
    } catch (error) {
      console.error('Error syncing wallet:', error);
      toast.error('Failed to sync wallet to account');
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    if (!user) return { error: 'No user signed in' };

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      await setDoc(userDocRef, updateData, { merge: true });
      setUserProfile(prev => ({ ...prev, ...updateData }));
      toast.success('Profile updated successfully!');
      return { error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      return { error: error.message };
    }
  };

  // Update user role (admin only)
  const updateUserRole = async (newRole) => {
    if (!user) return { error: 'No user signed in' };

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { role: newRole, updatedAt: new Date() }, { merge: true });
      setUserProfile(prev => ({ ...prev, role: newRole }));
      toast.success('Role updated successfully!');
      return { error: null };
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
      return { error: error.message };
    }
  };

  // Sign in with Google
  const signInGoogle = async () => {
    try {
      const { user: firebaseUser, error } = await signInWithGoogle();
      if (error) {
        toast.error(error);
        return { error };
      }
      toast.success('Signed in successfully!');
      return { user: firebaseUser, error: null };
    } catch (error) {
      toast.error('Failed to sign in with Google');
      return { error: error.message };
    }
  };

  // Sign in with email/password
  const signInEmail = async (email, password) => {
    try {
      const { user: firebaseUser, error } = await signInWithEmail(email, password);
      if (error) {
        toast.error(error);
        return { error };
      }
      toast.success('Signed in successfully!');
      return { user: firebaseUser, error: null };
    } catch (error) {
      toast.error('Failed to sign in');
      return { error: error.message };
    }
  };

  // Sign up with email/password
  const signUpEmail = async (email, password, displayName) => {
    try {
      const { user: firebaseUser, error } = await signUpWithEmail(email, password, displayName);
      if (error) {
        toast.error(error);
        return { error };
      }
      toast.success('Account created successfully!');
      return { user: firebaseUser, error: null };
    } catch (error) {
      toast.error('Failed to create account');
      return { error: error.message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await firebaseLogout();
      setUser(null);
      setUserProfile(null);
      toast.success('Signed out successfully!');
      // Refresh and navigate back to home to clear any stateful listeners/views
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
      return { error: null };
    } catch (error) {
      toast.error('Failed to sign out');
      return { error: error.message };
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signInGoogle,
    signInEmail,
    signUpEmail,
    logout,
    updateProfile,
    updateUserRole,
    syncWalletToProfile,
    isAuthenticated: !!user,
    userRole: userProfile?.role || null,
    // Account-scoped wallet properties
    walletAddress,
    walletProvider,
    walletSigner,
    isWalletConnected,
    network,
    walletLoading,
    connectWallet,
    disconnectWallet,
    isWalletSynced: !!(userProfile?.walletAddress && isWalletConnected && userProfile.walletAddress === walletAddress)
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
