# NFT Ticketing System - Complete Setup Guide

## 🎯 Overview

This guide will help you set up blockchain-based NFT ticketing for your events. Attendees will receive cryptographically secure NFT tickets that can be verified at the venue.

---

## 📋 Prerequisites

1. **Node.js** and **npm** installed
2. **MetaMask** browser extension installed
3. **Polygon Mumbai testnet** MATIC tokens (free from faucet)
4. Basic understanding of blockchain wallets

---

## 🚀 Step 1: Install Dependencies

Install required packages:

```bash
npm install --save ethers@5.7.2 hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts dotenv
```

Update your `package.json`:

```json
{
  "dependencies": {
    "ethers": "^5.7.2",
    "@openzeppelin/contracts": "^4.9.0",
    "dotenv": "^16.0.3"
  },
  "devDependencies": {
    "hardhat": "^2.19.0",
    "@nomicfoundation/hardhat-toolbox": "^2.0.0"
  }
}
```

---

## 🔐 Step 2: Configure Environment Variables

Create/update `.env` file in root:

```bash
# Blockchain Configuration
REACT_APP_CONTRACT_ADDRESS=0x... # After deployment
REACT_APP_CHAIN_ID=80001 # Mumbai testnet

# For deployment only (keep private!)
PRIVATE_KEY=your_wallet_private_key_here
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com/
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# Metadata
METADATA_BASE_URI=https://api.orchestrate.com/nft/metadata/
```

⚠️ **IMPORTANT**: Never commit your private key to Git!

Add to `.gitignore`:
```
.env
deployment.json
cache/
artifacts/
```

---

## 💎 Step 3: Get Test MATIC

1. Add Polygon Mumbai network to MetaMask:
   - Network Name: Mumbai Testnet
   - RPC URL: https://rpc-mumbai.maticvigil.com/
   - Chain ID: 80001
   - Currency Symbol: MATIC
   - Block Explorer: https://mumbai.polygonscan.com/

2. Get free test MATIC from faucet:
   - Go to: https://faucet.polygon.technology/
   - Select "Mumbai"
   - Paste your wallet address
   - Click "Submit"

---

## 🏗️ Step 4: Deploy Smart Contract

### 4.1 Compile Contract

```bash
npx hardhat compile
```

Expected output:
```
Compiled 1 Solidity file successfully
```

### 4.2 Test Locally (Optional)

```bash
npx hardhat node
```

In another terminal:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 4.3 Deploy to Mumbai Testnet

```bash
npx hardhat run scripts/deploy.js --network mumbai
```

Expected output:
```
🚀 Deploying EventTicketNFT contract...
📝 Deploying with account: 0x...
💰 Account balance: 1.5 ETH
✅ EventTicketNFT deployed to: 0x1234567890abcdef...
💾 Deployment info saved to deployment.json
💾 Contract ABI saved to src/contracts/EventTicketNFT.json
🎉 Deployment complete!
```

### 4.4 Save Contract Address

Copy the contract address and add to `.env`:
```bash
REACT_APP_CONTRACT_ADDRESS=0x1234567890abcdef...
```

---

## 🔧 Step 5: Update Event Model

Add NFT ticketing fields to your Event schema:

```javascript
// In your Event Firestore collection
{
  // ... existing fields

  // New NFT fields
  nftEnabled: false, // Toggle for this event
  contractAddress: "", // Contract address
  chainId: 80001, // Network
  organizerWallet: "", // Organizer's wallet address
}
```

---

## 🎨 Step 6: Integrate UI Components

### 6.1 Add to Event Detail Page

In `src/components/EventDetail/EventDetail.js`:

```javascript
import NFTTicketManager from '../NFTTicketManager/NFTTicketManager';
import { getUserEventRole } from '../../services/accessControlService';

// Inside component
const [showNFTManager, setShowNFTManager] = useState(false);
const [userRole, setUserRole] = useState(null);

useEffect(() => {
  if (user && event) {
    const role = getUserEventRole(event, user.uid);
    setUserRole(role);
  }
}, [user, event]);

// In render, after ScheduleBuilder or Collaboration section
{userRole === 'owner' && event.nftEnabled && (
  <Box sx={{ mt: 4 }}>
    <NFTTicketManager event={event} />
  </Box>
)}
```

### 6.2 Add NFT Ticket Purchase to Event Page

For attendees to view and purchase NFT tickets:

```javascript
import { getEventNFTTicketTiers } from '../../services/nftTicketService';
import NFTTicketPurchaseDialog from '../NFTTicketManager/NFTTicketPurchaseDialog';

// Inside component
const [nftTiers, setNftTiers] = useState([]);
const [selectedTier, setSelectedTier] = useState(null);

useEffect(() => {
  if (event?.nftEnabled) {
    loadNFTTiers();
  }
}, [event]);

const loadNFTTiers = async () => {
  const { data } = await getEventNFTTicketTiers(event.id);
  setNftTiers(data);
};

// In render
{event.nftEnabled && nftTiers.length > 0 && (
  <Box sx={{ mt: 4 }}>
    <Typography variant="h5" gutterBottom>
      NFT Tickets Available
    </Typography>
    <Grid container spacing={2}>
      {nftTiers.map((tier) => (
        <Grid item xs={12} sm={6} md={4} key={tier.id}>
          <Card>
            <CardContent>
              <Typography variant="h6">{tier.name}</Typography>
              <Typography variant="h5" color="primary">
                {tier.price} MATIC
              </Typography>
              <Typography variant="body2">
                {tier.available} / {tier.maxSupply} available
              </Typography>
              <Button
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
                onClick={() => setSelectedTier(tier)}
                disabled={tier.available === 0}
              >
                {tier.available === 0 ? 'Sold Out' : 'Buy NFT Ticket'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  </Box>
)}

<NFTTicketPurchaseDialog
  open={Boolean(selectedTier)}
  onClose={() => setSelectedTier(null)}
  tier={selectedTier}
  event={event}
/>
```

---

## ✅ Step 7: Test the System

### 7.1 Enable NFT for an Event

1. Go to event detail page as organizer
2. In event settings/edit, toggle `nftEnabled: true`
3. Add your wallet address as `organizerWallet`
4. Save event

### 7.2 Connect Wallet

1. Scroll to NFT Ticket Management section
2. Click "Connect Wallet"
3. Approve MetaMask connection
4. Switch to Mumbai network if prompted

### 7.3 Create Ticket Tier

1. Click "Create Tier"
2. Fill in:
   - Name: "General Admission"
   - Description: "Standard entry"
   - Price: 0.01 (MATIC)
   - Max Supply: 100
3. Click "Create Tier"
4. Approve transaction in MetaMask
5. Wait ~5 seconds for confirmation

### 7.4 Purchase Ticket (as Attendee)

1. Log out and log in as different user
2. View the same event
3. See "NFT Tickets Available" section
4. Click "Buy NFT Ticket"
5. Connect wallet
6. Click "Purchase Ticket"
7. Approve transaction (~0.01 MATIC + $0.001 gas)
8. Ticket minted to your wallet!

### 7.5 Verify Ticket

View in MetaMask:
1. Open MetaMask
2. Go to "NFTs" tab
3. See your event ticket NFT

View on Blockchain:
1. Go to: https://mumbai.polygonscan.com/
2. Search your wallet address
3. See NFT token transfer

---

## 🔍 Step 8: Check-In System (Optional)

For venue staff to scan and verify tickets:

Create `src/components/NFTTicketManager/TicketVerifier.js`:

```javascript
import React, { useState } from 'react';
import { TextField, Button, Alert } from '@mui/material';
import blockchainService from '../../services/blockchainService';

const TicketVerifier = ({ eventId }) => {
  const [attendeeWallet, setAttendeeWallet] = useState('');
  const [tierId, setTierId] = useState('');
  const [result, setResult] = useState(null);

  const handleVerify = async () => {
    const verification = await blockchainService.verifyTicket(
      eventId,
      attendeeWallet,
      tierId
    );

    setResult(verification);

    if (verification.isValid) {
      // Check in
      await blockchainService.checkIn(eventId, attendeeWallet, tierId);
    }
  };

  return (
    <Box>
      <TextField
        label="Attendee Wallet Address"
        value={attendeeWallet}
        onChange={(e) => setAttendeeWallet(e.target.value)}
        fullWidth
      />
      <TextField
        label="Ticket Tier ID"
        value={tierId}
        onChange={(e) => setTierId(e.target.value)}
        fullWidth
      />
      <Button onClick={handleVerify}>Verify & Check In</Button>

      {result && (
        <Alert severity={result.isValid ? 'success' : 'error'}>
          {result.isValid ? 'Valid ticket! Checked in.' : result.reason}
        </Alert>
      )}
    </Box>
  );
};
```

---

## 🐛 Troubleshooting

### Issue: "MetaMask not detected"
**Solution**: Install MetaMask extension and refresh page

### Issue: "Insufficient funds"
**Solution**: Get test MATIC from faucet (see Step 3)

### Issue: "Wrong network"
**Solution**: MetaMask will prompt to switch to Mumbai. Click "Switch Network"

### Issue: "Transaction failed"
**Solution**:
- Check wallet has enough MATIC for gas
- Try again with higher gas limit
- Check contract is deployed correctly

### Issue: "Contract not initialized"
**Solution**:
- Verify `REACT_APP_CONTRACT_ADDRESS` in `.env`
- Restart development server
- Check contract address on Polygonscan

---

## 💰 Cost Breakdown

**Mumbai Testnet (FREE)**:
- Deploy contract: FREE (test MATIC)
- Create tier: FREE
- Mint ticket: FREE
- Check-in: FREE

**Polygon Mainnet (PRODUCTION)**:
- Deploy contract: ~$2-5
- Create tier: ~$0.01-0.02
- Mint ticket: ~$0.01-0.02
- Check-in: ~$0.01

---

## 🔒 Security Best Practices

1. **Never commit private keys**
2. **Use environment variables** for sensitive data
3. **Audit smart contract** before mainnet deployment
4. **Test thoroughly** on testnet first
5. **Implement rate limiting** on API endpoints
6. **Validate all inputs** on frontend and backend
7. **Use HTTPS** for all connections
8. **Backup wallet** seed phrase securely

---

## 📊 Next Steps

1. **Metadata Server**: Host NFT metadata (images, descriptions) on IPFS or server
2. **Email Notifications**: Send email when ticket is minted
3. **QR Codes**: Generate QR codes for easy check-in
4. **Analytics**: Track sales, revenue, check-ins
5. **Secondary Market**: Allow ticket resale with royalties
6. **Multi-tier Events**: Support multiple ticket types
7. **Refunds**: Implement refund mechanism

---

## 🎉 You're Done!

You now have a fully functional NFT ticketing system! Organizers can:
- Create NFT ticket tiers on blockchain
- Set prices and supply limits
- Track sales and revenue

Attendees can:
- Purchase NFT tickets with cryptocurrency
- Own cryptographically secure tickets
- Prove attendance with blockchain records

---

## 📞 Support

- Smart Contract Issues: Check Polygonscan for transaction errors
- MetaMask Issues: https://metamask.io/support/
- General Issues: Check browser console for errors

---

**Happy Ticketing! 🎫✨**
