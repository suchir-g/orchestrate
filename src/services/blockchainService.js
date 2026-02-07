/**
 * Blockchain Service
 * Handles Web3 interactions, wallet connection, and smart contract operations
 */

import { ethers } from 'ethers';

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || null;
    this.chainId = process.env.REACT_APP_CHAIN_ID || '80001'; // Mumbai testnet
  }

  isMetaMaskInstalled() {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }

  async connectWallet() {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    try {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      await this.provider.send('eth_requestAccounts', []);

      this.signer = this.provider.getSigner();
      const address = await this.signer.getAddress();
      const balance = await this.provider.getBalance(address);
      const network = await this.provider.getNetwork();

      const expectedChainId = parseInt(this.chainId);
      if (network.chainId !== expectedChainId) {
        await this.switchNetwork(expectedChainId);
      }

      return {
        address,
        balance: ethers.utils.formatEther(balance),
        network: network.name,
        chainId: network.chainId,
      };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw new Error('Failed to connect wallet: ' + error.message);
    }
  }

  async switchNetwork(chainId) {
    const chainIdHex = '0x' + chainId.toString(16);

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        const networkParams = this.getNetworkParams(chainId);
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [networkParams],
        });
      } else {
        throw switchError;
      }
    }
  }

  getNetworkParams(chainId) {
    const networks = {
      80001: {
        chainId: '0x13881',
        chainName: 'Mumbai Testnet',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
        blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
      },
      137: {
        chainId: '0x89',
        chainName: 'Polygon Mainnet',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpcUrls: ['https://polygon-rpc.com/'],
        blockExplorerUrls: ['https://polygonscan.com/'],
      },
    };
    return networks[chainId];
  }

  async initContract(contractAddress, abi) {
    if (!this.provider) {
      await this.connectWallet();
    }

    this.contract = new ethers.Contract(
      contractAddress,
      abi,
      this.signer
    );

    return this.contract;
  }

  async createTicketTier(eventId, name, priceInMatic, maxSupply, organizerAddress) {
    if (!this.contract) throw new Error('Contract not initialized');

    const priceInWei = ethers.utils.parseEther(priceInMatic.toString());

    const tx = await this.contract.createTicketTier(
      eventId,
      name,
      priceInWei,
      maxSupply,
      organizerAddress
    );

    const receipt = await tx.wait();
    const event = receipt.events?.find(e => e.event === 'TicketTierCreated');
    const tierId = event?.args?.tierId?.toNumber();

    return {
      tierId,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  }

  async mintTicket(tierId) {
    if (!this.contract) throw new Error('Contract not initialized');

    const tier = await this.contract.getTicketTier(tierId);
    const price = tier.price;

    const tx = await this.contract.mintTicket(tierId, {
      value: price,
      gasLimit: 300000,
    });

    const receipt = await tx.wait();

    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  }

  async ownsTicket(tierId, address) {
    if (!this.contract) throw new Error('Contract not initialized');

    const balance = await this.contract.balanceOf(address, tierId);
    return balance.toNumber() > 0;
  }

  async getTicketTier(tierId) {
    if (!this.contract) throw new Error('Contract not initialized');

    const tier = await this.contract.getTicketTier(tierId);

    return {
      tierId: tier.tierId.toNumber(),
      eventId: tier.eventId,
      name: tier.name,
      price: ethers.utils.formatEther(tier.price),
      maxSupply: tier.maxSupply.toNumber(),
      sold: tier.sold.toNumber(),
      isActive: tier.isActive,
      organizer: tier.organizer,
      available: tier.maxSupply.toNumber() - tier.sold.toNumber(),
    };
  }

  async verifyTicket(eventId, attendeeAddress, tierId) {
    if (!this.contract) throw new Error('Contract not initialized');

    const result = await this.contract.verifyTicket(eventId, attendeeAddress, tierId);

    return {
      isValid: result.isValid,
      reason: result.reason,
    };
  }

  async checkIn(eventId, attendeeAddress, tierId) {
    if (!this.contract) throw new Error('Contract not initialized');

    const tx = await this.contract.checkIn(eventId, attendeeAddress, tierId);
    const receipt = await tx.wait();

    return {
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  }

  async hasCheckedIn(eventId, address) {
    if (!this.contract) throw new Error('Contract not initialized');

    return await this.contract.hasCheckedIn(eventId, address);
  }

  onAccountChange(callback) {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        callback(accounts[0]);
      });
    }
  }

  onNetworkChange(callback) {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', (chainId) => {
        callback(parseInt(chainId, 16));
      });
    }
  }

  async getGasPrice() {
    if (!this.provider) await this.connectWallet();

    const gasPrice = await this.provider.getGasPrice();
    return ethers.utils.formatUnits(gasPrice, 'gwei');
  }

  disconnect() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
  }

  getExplorerUrl(txHash, chainId = null) {
    const chain = chainId || parseInt(this.chainId);
    const baseUrls = {
      80001: 'https://mumbai.polygonscan.com/tx/',
      137: 'https://polygonscan.com/tx/',
    };
    return (baseUrls[chain] || '') + txHash;
  }

  formatAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}

export default new BlockchainService();
