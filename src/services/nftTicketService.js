/**
 * NFT Ticket Service
 * Backend integration for NFT tickets with Firebase
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import blockchainService from './blockchainService';

const NFT_TICKETS_COLLECTION = 'nftTickets';
const NFT_TIERS_COLLECTION = 'nftTicketTiers';
const NFT_PURCHASES_COLLECTION = 'nftPurchases';

/**
 * Create NFT ticket tier for event
 */
export const createNFTTicketTier = async (eventId, tierData, organizerWallet) => {
  try {
    const { name, description, price, maxSupply, image } = tierData;

    // Create tier on blockchain
    const { tierId, transactionHash } = await blockchainService.createTicketTier(
      eventId,
      name,
      price,
      maxSupply,
      organizerWallet
    );

    // Save to Firebase
    const tierRef = collection(db, NFT_TIERS_COLLECTION);
    const docRef = await addDoc(tierRef, {
      eventId,
      tierId,
      name,
      description,
      price,
      maxSupply,
      sold: 0,
      image,
      organizerWallet,
      transactionHash,
      isActive: true,
      createdAt: serverTimestamp(),
    });

    return { id: docRef.id, tierId, error: null };
  } catch (error) {
    console.error('Error creating NFT ticket tier:', error);
    return { id: null, tierId: null, error: error.message };
  }
};

/**
 * Get all NFT ticket tiers for an event
 */
export const getEventNFTTicketTiers = async (eventId) => {
  try {
    const tiersRef = collection(db, NFT_TIERS_COLLECTION);
    const q = query(
      tiersRef,
      where('eventId', '==', eventId),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const tiers = await Promise.all(
      querySnapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();

        try {
          const blockchainData = await blockchainService.getTicketTier(data.tierId);
          return {
            id: docSnap.id,
            ...data,
            sold: blockchainData.sold,
            available: blockchainData.available,
            createdAt: data.createdAt?.toDate?.() || new Date(),
          };
        } catch (error) {
          console.error('Error fetching blockchain data for tier:', data.tierId);
          return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
          };
        }
      })
    );

    return { data: tiers, error: null };
  } catch (error) {
    console.error('Error getting NFT ticket tiers:', error);
    return { data: [], error: error.message };
  }
};

/**
 * Purchase NFT ticket
 */
export const purchaseNFTTicket = async (tierId, userId, userWallet) => {
  try {
    // Mint ticket on blockchain
    const { transactionHash } = await blockchainService.mintTicket(tierId);

    // Record purchase in Firebase
    const purchaseRef = collection(db, NFT_PURCHASES_COLLECTION);
    const docRef = await addDoc(purchaseRef, {
      tierId,
      userId,
      userWallet,
      transactionHash,
      purchasedAt: serverTimestamp(),
      checkedIn: false,
      checkedInAt: null,
    });

    // Update tier sold count
    const tierDoc = await getDocs(
      query(collection(db, NFT_TIERS_COLLECTION), where('tierId', '==', tierId))
    );

    if (!tierDoc.empty) {
      const tierDocRef = doc(db, NFT_TIERS_COLLECTION, tierDoc.docs[0].id);
      const tierData = tierDoc.docs[0].data();
      await updateDoc(tierDocRef, {
        sold: (tierData.sold || 0) + 1,
      });
    }

    return { purchaseId: docRef.id, transactionHash, error: null };
  } catch (error) {
    console.error('Error purchasing NFT ticket:', error);
    return { purchaseId: null, transactionHash: null, error: error.message };
  }
};

/**
 * Get user's NFT tickets
 */
export const getUserNFTTickets = async (userId) => {
  try {
    const purchasesRef = collection(db, NFT_PURCHASES_COLLECTION);
    const q = query(
      purchasesRef,
      where('userId', '==', userId),
      orderBy('purchasedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const tickets = await Promise.all(
      querySnapshot.docs.map(async (docSnap) => {
        const purchase = docSnap.data();

        const tierQuery = query(
          collection(db, NFT_TIERS_COLLECTION),
          where('tierId', '==', purchase.tierId)
        );
        const tierSnapshot = await getDocs(tierQuery);

        if (!tierSnapshot.empty) {
          const tierData = tierSnapshot.docs[0].data();
          const eventDoc = await getDoc(doc(db, 'events', tierData.eventId));
          const eventData = eventDoc.exists() ? eventDoc.data() : null;

          return {
            id: docSnap.id,
            ...purchase,
            tier: tierData,
            event: eventData ? { id: eventDoc.id, ...eventData } : null,
            purchasedAt: purchase.purchasedAt?.toDate?.() || new Date(),
          };
        }

        return null;
      })
    );

    return { data: tickets.filter(t => t !== null), error: null };
  } catch (error) {
    console.error('Error getting user NFT tickets:', error);
    return { data: [], error: error.message };
  }
};

/**
 * Check in attendee with NFT ticket
 */
export const checkInNFTTicket = async (eventId, attendeeWallet, tierId, userId) => {
  try {
    const verification = await blockchainService.verifyTicket(eventId, attendeeWallet, tierId);

    if (!verification.isValid) {
      return { success: false, error: verification.reason };
    }

    const { transactionHash } = await blockchainService.checkIn(eventId, attendeeWallet, tierId);

    const purchasesRef = collection(db, NFT_PURCHASES_COLLECTION);
    const q = query(
      purchasesRef,
      where('tierId', '==', tierId),
      where('userWallet', '==', attendeeWallet)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const purchaseDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, NFT_PURCHASES_COLLECTION, purchaseDoc.id), {
        checkedIn: true,
        checkedInAt: serverTimestamp(),
        checkInTransactionHash: transactionHash,
      });
    }

    return { success: true, transactionHash, error: null };
  } catch (error) {
    console.error('Error checking in NFT ticket:', error);
    return { success: false, transactionHash: null, error: error.message };
  }
};

/**
 * Get event's NFT ticket statistics
 */
export const getEventNFTTicketStats = async (eventId) => {
  try {
    const { data: tiers } = await getEventNFTTicketTiers(eventId);

    const stats = {
      totalTiers: tiers.length,
      totalCapacity: tiers.reduce((sum, tier) => sum + tier.maxSupply, 0),
      totalSold: tiers.reduce((sum, tier) => sum + tier.sold, 0),
      totalRevenue: tiers.reduce((sum, tier) => sum + (tier.sold * tier.price), 0),
      tiers: tiers.map(tier => ({
        name: tier.name,
        sold: tier.sold,
        available: tier.available,
        soldPercentage: ((tier.sold / tier.maxSupply) * 100).toFixed(1),
      })),
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error getting NFT ticket stats:', error);
    return { data: null, error: error.message };
  }
};

export default {
  createNFTTicketTier,
  getEventNFTTicketTiers,
  purchaseNFTTicket,
  getUserNFTTickets,
  checkInNFTTicket,
  getEventNFTTicketStats,
};
