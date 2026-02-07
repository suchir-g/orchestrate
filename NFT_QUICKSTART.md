# NFT Ticketing - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install --save ethers@5.7.2 @openzeppelin/contracts dotenv
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

### Step 2: Setup Environment
Copy `.env.example` to `.env` and add:
```bash
cp .env.example .env
```

Edit `.env`:
```
REACT_APP_CHAIN_ID=80001
PRIVATE_KEY=your_metamask_private_key
```

### Step 3: Get Test MATIC
1. Install MetaMask extension
2. Add Mumbai testnet network
3. Get free test MATIC: https://faucet.polygon.technology/

### Step 4: Deploy Contract
```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network mumbai
```

Copy the contract address from output and add to `.env`:
```
REACT_APP_CONTRACT_ADDRESS=0x...
```

### Step 5: Test It!

**As Organizer:**
1. Create or edit an event
2. Enable NFT ticketing
3. Go to event page
4. Click "Connect Wallet" in NFT section
5. Create ticket tier (e.g., "VIP" - 0.01 MATIC - 100 tickets)

**As Attendee:**
1. View event page
2. See available NFT tickets
3. Click "Buy NFT Ticket"
4. Connect wallet
5. Purchase ticket

Done! 🎉

---

## 📁 Files Created

### Smart Contracts
- `contracts/EventTicketNFT.sol` - ERC1155 ticket contract
- `hardhat.config.js` - Hardhat configuration
- `scripts/deploy.js` - Deployment script

### Services
- `src/services/blockchainService.js` - Web3/MetaMask integration
- `src/services/nftTicketService.js` - Firebase + blockchain integration

### Components
- `src/components/NFTTicketManager/NFTTicketManager.js` - Organizer dashboard
- `src/components/NFTTicketManager/NFTTicketPurchaseDialog.js` - Purchase UI

### Config
- `.env.example` - Environment variables template
- `src/contracts/EventTicketNFT.json` - Contract ABI (auto-generated)

---

## 🎯 Key Features

✅ **Cryptographically Secure** - Blockchain-based tickets can't be counterfeited
✅ **No Scalping** - Smart contracts can enforce price caps
✅ **Proof of Attendance** - Tickets become digital collectibles
✅ **Instant Verification** - Check-in via blockchain query
✅ **Low Cost** - ~$0.01 per ticket on Polygon
✅ **Organizer Revenue** - Direct payments to organizer wallet

---

## 💡 Usage Examples

### Create Ticket Tier
```javascript
const { tierId } = await createNFTTicketTier(
  eventId,
  {
    name: "VIP Pass",
    description: "Front row access + meet & greet",
    price: 0.5, // MATIC
    maxSupply: 50,
    image: "ipfs://..."
  },
  organizerWallet
);
```

### Purchase Ticket
```javascript
const { transactionHash } = await purchaseNFTTicket(
  tierId,
  userId,
  buyerWallet
);
```

### Verify at Entrance
```javascript
const { isValid, reason } = await blockchainService.verifyTicket(
  eventId,
  attendeeWallet,
  tierId
);

if (isValid) {
  await blockchainService.checkIn(eventId, attendeeWallet, tierId);
  // Grant entry
}
```

---

## 🔧 Troubleshooting

**Problem**: "MetaMask not detected"
**Fix**: Install MetaMask extension

**Problem**: "Wrong network"
**Fix**: Switch to Mumbai in MetaMask

**Problem**: "Insufficient funds"
**Fix**: Get test MATIC from faucet

**Problem**: "Transaction failed"
**Fix**: Increase gas limit or check wallet balance

---

## 📖 Full Documentation

See [NFT_TICKETING_SETUP.md](./NFT_TICKETING_SETUP.md) for complete documentation.

---

## 🎫 How It Works

1. **Organizer creates event** → Enables NFT ticketing
2. **Organizer creates tiers** → VIP, GA, etc. with prices
3. **Attendee buys ticket** → Pays with MATIC, receives NFT
4. **Smart contract mints NFT** → Ticket stored on blockchain
5. **Attendee shows ticket** → QR code or wallet address
6. **Staff verifies** → Checks blockchain ownership
7. **Check-in recorded** → Ticket marked as used on-chain

---

**Ready to deploy to production?**
Change `REACT_APP_CHAIN_ID` to `137` (Polygon mainnet) and redeploy! 🚀
