# Account & Wallet Synchronization Features

## Overview
The Orchestrate platform now includes a comprehensive account management system with Web3 wallet synchronization capabilities. Users can create accounts, sign in with Google or email/password, and sync their blockchain wallets to their accounts.

## Key Features

### 1. **Authentication System**
- **Google Sign-In**: One-click authentication using Google OAuth
- **Email/Password**: Traditional email and password authentication
- **Persistent Sessions**: Automatic reconnection on page reload
- **Secure Token Management**: Firebase Authentication handles all security

### 2. **User Profile Management**
- **Profile Information**: Display name, email, bio, profile photo
- **Account Details**: User ID, member since date, last updated timestamp
- **Edit Profile**: Update display name and bio
- **Profile Picture**: Automatic avatar generation from Google or initials

### 3. **Wallet Synchronization** ⭐
- **Automatic Sync**: When users connect their Web3 wallet, it automatically syncs to their account
- **Sync Status**: Visual indicator showing if wallet is synced or not
- **Manual Sync**: Option to manually sync wallet after connection
- **Wallet History**: Tracks when wallet was connected and last synced
- **Multi-Wallet Support**: Can sync different wallets (updates to most recent)

### 4. **Enhanced Navbar**
- **Sign In Button**: Prominent button for unauthenticated users
- **User Avatar**: Shows user profile picture when signed in
- **Account Menu**: Quick access to account settings and sign out
- **Wallet Button**: Separate button for blockchain wallet connection
- **Network Display**: Shows current blockchain network (Sepolia, Mainnet, etc.)

## User Flow

### First-Time User:
1. Click "Sign In" button in navbar
2. Choose Google sign-in or create account with email/password
3. Profile automatically created in Firestore
4. Click "Connect Wallet" to link Web3 wallet
5. Wallet address automatically synced to account
6. ✅ Complete setup - wallet and account are linked!

### Returning User:
1. Automatic sign-in if previously logged in
2. Wallet auto-connects if previously connected
3. If wallet address matches synced address → Fully synced ✅
4. If wallet address changed → Prompt to re-sync

## Technical Implementation

### New Files Created:

#### **Context Layer**
- `src/context/AuthContext.js` - Firebase authentication state management
  - Manages user sign-in/sign-out
  - Syncs wallet addresses to Firestore
  - Provides authentication state to entire app

#### **Component Layer**
- `src/components/Account/AccountPage.js` - Main account settings page
  - Profile editing (display name, bio)
  - Wallet sync status and controls
  - Account activity history
  - Visual wallet connection indicators

- `src/components/Account/AuthDialog.js` - Authentication modal
  - Tabbed interface (Sign In / Sign Up)
  - Google OAuth button
  - Email/password forms
  - Password visibility toggle
  - Beautiful glassmorphic design

### Modified Files:

#### **App.js**
- Added `AuthProvider` wrapper around `AppStateProvider`
- Added `/account` route for account settings page
- Imported `AccountPage` component

#### **Navbar.js**
- Added authentication state from `useAuth` hook
- Added account avatar/menu button when authenticated
- Added sign-in button when not authenticated
- Added account menu with "Account Settings" and "Sign Out" options
- Integrated `AuthDialog` for sign-in/sign-up

### Database Schema (Firestore):

#### **users collection**
```javascript
{
  id: userId (matches Firebase Auth UID),
  email: string,
  displayName: string,
  photoURL: string,
  bio: string,
  walletAddress: string,              // ⭐ Synced Web3 wallet
  walletConnectedAt: timestamp,       // ⭐ When wallet was connected
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## API/Services Used

### Firebase Services:
- **Firebase Authentication**: User sign-in, sign-up, session management
- **Firestore**: User profile storage and wallet address persistence
- **Real-time Updates**: Profile changes reflect immediately

### Blockchain Integration:
- **ethers.js**: Already installed (v6.13.2)
- **MetaMask**: Browser extension wallet
- **BlockchainContext**: Existing wallet connection management
- **AuthContext**: New layer that bridges Firebase Auth ↔ Blockchain

## Security Features

✅ **Secure Authentication**: Firebase Authentication with industry-standard security
✅ **Encrypted Storage**: Firestore with proper security rules
✅ **No Private Keys Stored**: Only public wallet addresses are saved
✅ **Session Management**: Automatic token refresh and expiration
✅ **CORS Protection**: Firebase handles all CORS and security headers

## User Benefits

1. **Single Identity**: One account across blockchain and traditional features
2. **Persistent History**: Orders, tickets, and events tied to account
3. **Easy Wallet Recovery**: If wallet lost, account still accessible
4. **Multi-Device**: Sign in from any device, same account
5. **Social Features**: Profile display name visible to other users (future)
6. **Analytics**: Track your event history, ticket purchases, shipments

## Navigation

- **Account Page**: `/account` - Accessible from navbar avatar menu
- **Sign In Dialog**: Click "Sign In" button in navbar when not authenticated
- **Wallet Connection**: Click "Connect Wallet" in navbar or account page

## Visual Design

All components follow the existing **glassmorphic dark theme**:
- 🎨 Gradient accents (cyan → pink)
- 💎 Frosted glass effects (backdrop blur)
- 🌙 Dark mode optimized
- ✨ Smooth animations and transitions
- 📱 Fully responsive (mobile-first)

## Future Enhancements

- [ ] ENS (Ethereum Name Service) integration
- [ ] Multi-wallet support (connect multiple wallets)
- [ ] Social profiles (public profile pages)
- [ ] NFT profile pictures (use owned NFTs as avatar)
- [ ] Wallet activity history (on-chain transactions)
- [ ] Gas fee estimates
- [ ] Token balances display

## Testing Checklist

- [ ] Sign up with email/password
- [ ] Sign in with Google
- [ ] Edit profile (display name, bio)
- [ ] Connect MetaMask wallet
- [ ] Verify wallet syncs to account
- [ ] Disconnect and reconnect wallet
- [ ] Sign out and sign back in
- [ ] Check account page displays correctly
- [ ] Verify persistence across page refreshes
- [ ] Test on mobile devices

## Troubleshooting

### Wallet not syncing?
1. Ensure you're signed in to Firebase account
2. Ensure MetaMask is connected
3. Click "Sync Wallet to Account" button on account page
4. Check browser console for errors

### Can't sign in?
1. Check Firebase configuration in `src/config/firebase.js`
2. Verify Firebase Authentication is enabled in Firebase Console
3. Check browser console for error messages
4. Try clearing browser cache and cookies

### Account page blank?
1. Ensure you're signed in (click "Sign In" in navbar)
2. Check that `AuthProvider` wraps the app in `App.js`
3. Verify `/account` route exists in `App.js`

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify Firebase configuration is correct
3. Ensure MetaMask is installed and unlocked
4. Check network connectivity

---

**Built with ❤️ using Firebase, ethers.js, and Material-UI**
