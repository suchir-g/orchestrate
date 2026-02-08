/**
 * Account Service
 * Manages the 'accounts' collection - stores user account details
 */

import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

const COLLECTION = 'accounts';

/**
 * Create or update a user account
 * @param {string} userId - User ID (Firebase Auth UID)
 * @param {Object} accountData - Account details (email, displayName, photoURL, etc.)
 * @returns {Promise<Object>} { success, error }
 */
export const createOrUpdateAccount = async (userId, accountData) => {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    const accountRef = doc(db, COLLECTION, userId);
    const existingAccount = await getDoc(accountRef);

    const dataToSet = {
      userId,
      email: accountData.email,
      displayName: accountData.displayName || '',
      photoURL: accountData.photoURL || null,
      bio: accountData.bio || '',
      walletAddress: accountData.walletAddress || null,
      ...(existingAccount.exists() && { updatedAt: new Date() }),
      ...(!existingAccount.exists() && { createdAt: new Date() }),
      ...accountData, // Merge any additional fields
    };

    await setDoc(accountRef, dataToSet, { merge: true });

    return { success: true, error: null };
  } catch (error) {
    console.error('Error creating/updating account:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get account details by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Account data or null
 */
export const getAccount = async (userId) => {
  try {
    if (!userId) return null;

    const accountRef = doc(db, COLLECTION, userId);
    const accountDoc = await getDoc(accountRef);

    if (accountDoc.exists()) {
      return accountDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting account:', error);
    return null;
  }
};

/**
 * Get account by email
 * @param {string} email - User email
 * @returns {Promise<Object>} Account data or null
 */
export const getAccountByEmail = async (email) => {
  try {
    if (!email) return null;

    const accountsRef = collection(db, COLLECTION);
    const q = query(accountsRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    }
    return null;
  } catch (error) {
    console.error('Error getting account by email:', error);
    return null;
  }
};

/**
 * Update account details
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} { success, error }
 */
export const updateAccount = async (userId, updates) => {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    const accountRef = doc(db, COLLECTION, userId);
    await updateDoc(accountRef, {
      ...updates,
      updatedAt: new Date(),
    });

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating account:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all accounts (for admin purposes)
 * @returns {Promise<Array>} Array of all accounts
 */
export const getAllAccounts = async () => {
  try {
    const accountsRef = collection(db, COLLECTION);
    const querySnapshot = await getDocs(accountsRef);

    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      userId: doc.id,
    }));
  } catch (error) {
    console.error('Error getting all accounts:', error);
    return [];
  }
};

/**
 * Delete account (soft delete - mark as deleted)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} { success, error }
 */
export const deleteAccount = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    const accountRef = doc(db, COLLECTION, userId);
    await updateDoc(accountRef, {
      deleted: true,
      deletedAt: new Date(),
    });

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { success: false, error: error.message };
  }
};
