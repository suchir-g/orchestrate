# Account-Scoped Wallet Architecture

## Overview
Wallets are now **locally scoped to individual accounts**. Each user account has its own associated wallet, and wallet connections are tied directly to the authenticated user rather than being globally available.

## Key Architecture Changes

### Before (Global Wallet)
- `BlockchainContext` managed wallet connections globally
- Wallet state was shared across all users
- Any user could see/use the connected wallet
- Wallet persisted even when users signed out

### After (Account-Scoped Wallet) ✅
- `AuthContext` manages wallet connections per account
- Each user account has its own wallet state
- Wallets are isolated and tied to user authentication
- Wallet automatically disconnects when user signs out
- Wallet automatically restores when user signs back in

## Technical Implementation

### AuthContext (`src/context/AuthContext.js`)

The `AuthContext` now manages both authentication AND wallet state:

#### Wallet State (Per Account)
```javascript
const [walletAddress, setWalletAddress] = useState(null);
const [walletProvider, setWalletProvider] = useState(null);
const [walletSigner, setWalletSigner] = useState(null);
const [isWalletConnected, setIsWalletConnected] = useState(false);
const [network, setNetwork] = useState(null);
const [walletLoading, setWalletLoading] = useState(false);
```

#### Key Functions

**1. `connectWallet()`**
- Requires user to be authenticated first
- Shows error if user not signed in
- Connects to MetaMask
- Automatically syncs wallet address to user's Firestore profile
- Shows success toast

**2. `disconnectWallet()`**
- Clears all wallet state
- Called automatically when user signs out

**3. `restoreWalletConnection()`**
- Automatically called when user profile loads
- Checks if saved wallet address is currently in MetaMask
- Silently restores connection without prompting user
- If wallet not available, user can manually reconnect

**4. `syncWalletToProfile(walletAddress)`**
- Saves wallet address to Firestore user profile
- Updates `walletAddress` and `walletConnectedAt` fields
- Called automatically when wallet connects

### Automatic Behaviors

#### Sign In Flow
1. User signs in with Google or email/password
2. `AuthContext` loads user profile from Firestore
3. If profile has saved `walletAddress`, attempts to restore wallet connection
4. If MetaMask has that wallet active, auto-reconnects silently
5. User sees wallet button showing connected wallet

#### Sign Out Flow
1. User clicks "Sign Out"
2. `AuthContext` calls `disconnectWallet()`
3. All wallet state cleared
4. User redirected, wallet no longer accessible

#### Account Switch Flow
1. User A signs out
2. User B signs in
3. User B's saved wallet (if any) is restored
4. User A's wallet is completely isolated and unavailable

### MetaMask Event Listeners

The context listens for MetaMask events **only when user is authenticated**:

**Account Changed**
- Detects when user switches accounts in MetaMask
- Updates wallet address in state
- Automatically syncs new address to Firestore profile

**Network Changed**
- Detects when user switches networks (Mainnet, Sepolia, etc.)
- Updates network state
- Reloads provider and network info

## UI Components Updated

### Navbar (`src/components/Common/Navbar.js`)

**Changes:**
- Removed `useBlockchain` import
- Now uses wallet state from `useAuth`
- Wallet button **only shows when user is authenticated**
- If not authenticated, wallet button is completely hidden
- Network chip only shows when wallet connected

**Button States:**
- **Not Authenticated**: No wallet button shown at all
- **Authenticated, No Wallet**: Shows "Connect Wallet" button
- **Authenticated, Wallet Connected**: Shows wallet address (0x1234...5678)

### AccountPage (`src/components/Account/AccountPage.js`)

**Changes:**
- Removed `useBlockchain` import
- Now uses wallet state from `useAuth`
- Shows wallet sync status
- Displays synced wallet address vs connected wallet address
- Manual sync button if addresses don't match

### TicketManager (`src/components/Blockchain/TicketManager.js`)

**Changes:**
- Replaced `useBlockchain` with `useAuth`
- Replaced `isConnected` with `isWalletConnected`
- Replaced `signer` with `walletSigner`
- All blockchain features now require user to be signed in AND have wallet connected

## User Experience

### First-Time User Flow
1. User visits site → Sees "Sign In" button
2. User clicks "Sign In" → Auth dialog opens
3. User signs in with Google → Account created
4. Wallet button now appears in navbar → User clicks "Connect Wallet"
5. MetaMask prompts for connection → User approves
6. Wallet address automatically saved to account ✅
7. User sees "Synced" badge on account page

### Returning User Flow
1. User visits site → Automatically signed in (if session exists)
2. Wallet automatically reconnects (if MetaMask has same account)
3. User immediately sees connected wallet in navbar ✅
4. Can use all blockchain features (tickets, NFTs, etc.)

### Multi-User Flow
1. **User A** signs in → Connects wallet 0xAAAA...
2. User A signs out
3. **User B** signs in → Sees their own wallet 0xBBBB... (or none if never connected)
4. User B's actions are completely isolated from User A ✅
5. User B cannot access User A's wallet or data

## Database Schema

### Firestore `users` Collection

```javascript
{
  id: userId,                       // Firebase Auth UID
  email: "user@example.com",
  displayName: "John Doe",
  photoURL: "https://...",
  bio: "Event organizer",

  // Wallet fields (account-scoped)
  walletAddress: "0x742d35...",    // Connected wallet address
  walletConnectedAt: Timestamp,     // When wallet was first connected

  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Security & Privacy

✅ **Isolated Accounts**: Each user's wallet is completely isolated
✅ **No Cross-Contamination**: User A cannot see or use User B's wallet
✅ **Automatic Cleanup**: Wallet state cleared on sign out
✅ **No Private Keys Stored**: Only public addresses saved
✅ **Session-Based**: Wallet connection tied to authentication session

## Benefits of Account-Scoped Wallets

1. **User Privacy**: Each user's wallet is private to their account
2. **Multi-User Support**: Multiple users can use same device without conflicts
3. **Better UX**: Users expect wallet to be tied to their account
4. **Easier Debugging**: Wallet issues are isolated per user
5. **Data Consistency**: Orders, tickets, and events properly associated with user+wallet
6. **Audit Trail**: Can track which user performed which blockchain actions

## Migration from Global Wallet

### Removed
- ❌ `BlockchainProvider` wrapper in `App.js` (can be removed if not needed)
- ❌ Global wallet state accessible to all users
- ❌ `useBlockchain` hook in components (replaced with `useAuth`)

### Added
- ✅ Wallet state in `AuthContext`
- ✅ Account-scoped wallet management
- ✅ Automatic wallet restore on sign-in
- ✅ Automatic wallet cleanup on sign-out
- ✅ MetaMask event listeners scoped to authenticated users

## API Reference

### useAuth Hook

```javascript
const {
  // Authentication
  user,                    // Firebase user object
  userProfile,             // Firestore user profile
  isAuthenticated,         // Boolean: user signed in
  signInGoogle,            // Function: sign in with Google
  signInEmail,             // Function: sign in with email/password
  signUpEmail,             // Function: create account
  logout,                  // Function: sign out

  // Account-scoped wallet
  walletAddress,           // String: connected wallet address
  walletProvider,          // ethers.BrowserProvider instance
  walletSigner,            // ethers.Signer instance
  isWalletConnected,       // Boolean: wallet connected
  network,                 // Object: { name, chainId }
  walletLoading,           // Boolean: wallet operation in progress
  connectWallet,           // Function: connect wallet
  disconnectWallet,        // Function: disconnect wallet
  isWalletSynced,          // Boolean: wallet synced to profile

  // Profile management
  updateProfile,           // Function: update user profile
  syncWalletToProfile      // Function: manually sync wallet
} = useAuth();
```

## Testing Checklist

- [ ] Sign in → Wallet button appears
- [ ] Sign out → Wallet button disappears
- [ ] Connect wallet → Address saved to Firestore
- [ ] Refresh page → Wallet auto-reconnects
- [ ] Switch MetaMask account → New address synced
- [ ] Sign out → Wallet disconnected
- [ ] Sign in as different user → Different wallet restored
- [ ] TicketManager requires wallet connection
- [ ] Account page shows sync status correctly

## Future Enhancements

- [ ] Support multiple wallets per account
- [ ] Wallet nicknames (e.g., "Main Wallet", "Trading Wallet")
- [ ] Wallet transaction history
- [ ] Gas fee tracking per account
- [ ] Multi-chain support (Polygon, BSC, etc.)
- [ ] Hardware wallet support (Ledger, Trezor)
- [ ] WalletConnect support (mobile wallets)

---

**Status**: ✅ Fully Implemented
**Version**: 1.0
**Last Updated**: February 2026
