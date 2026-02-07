/**
 * Enhanced Event Messaging Service
 * Thread-based messaging with recipient selection and notifications
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const THREADS_COLLECTION = 'messageThreads';
const MESSAGES_COLLECTION = 'threadMessages';

/**
 * Thread status
 */
export const THREAD_STATUS = {
  OPEN: 'open',
  RESOLVED: 'resolved',
};

/**
 * Recipient types for group messaging
 */
export const RECIPIENT_TYPES = {
  SPECIFIC_USER: 'specific_user',      // Message to specific person
  ALL_ORGANIZERS: 'all_organizers',    // Message to all organizers
  ALL_VOLUNTEERS: 'all_volunteers',    // Message to all volunteers
  ALL_ADMINS: 'all_admins',            // Message to all admins (event owners)
  ORGANIZER_TEAM: 'organizer_team',    // Message to organizer team
};

/**
 * Create a new message thread
 * @param {string} eventId - Event ID
 * @param {string} subject - Thread subject
 * @param {string} senderId - Sender user ID
 * @param {string} senderName - Sender name
 * @param {string} senderRole - Sender's event role
 * @param {Array|string} recipients - Array of user IDs or recipient type constant
 * @param {string} recipientType - Type of recipient (RECIPIENT_TYPES)
 * @returns {Promise<Object>} { threadId, error }
 */
export const createMessageThread = async (
  eventId,
  subject,
  senderId,
  senderName,
  senderRole,
  recipients,
  recipientType = RECIPIENT_TYPES.SPECIFIC_USER
) => {
  try {
    const threadsRef = collection(db, THREADS_COLLECTION);

    // Ensure recipients is an array and includes the sender
    const recipientArray = Array.isArray(recipients) ? recipients : [recipients];
    const allParticipants = [...new Set([senderId, ...recipientArray])]; // Add sender and remove duplicates

    const thread = {
      eventId,
      subject,
      createdBy: senderId,
      createdByName: senderName,
      createdByRole: senderRole,
      recipients: allParticipants, // Include sender in recipients
      recipientType,
      status: THREAD_STATUS.OPEN,
      unreadCount: {}, // Object mapping userId to unread count
      lastMessageAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      resolvedAt: null,
      resolvedBy: null,
    };

    // Initialize unread counts for all participants
    allParticipants.forEach(recipientId => {
      // Sender starts with 0 unread, others start with 1 (the first message)
      thread.unreadCount[recipientId] = recipientId === senderId ? 0 : 1;
    });

    const docRef = await addDoc(threadsRef, thread);

    console.log('✅ Thread created:', docRef.id, 'Participants:', allParticipants);
    return { threadId: docRef.id, error: null };
  } catch (error) {
    console.error('❌ Error creating thread:', error);
    return { threadId: null, error: error.message };
  }
};

/**
 * Send a message in a thread
 * @param {string} threadId - Thread ID
 * @param {string} senderId - Sender user ID
 * @param {string} senderName - Sender name
 * @param {string} content - Message content
 * @returns {Promise<Object>} { messageId, error }
 */
export const sendThreadMessage = async (threadId, senderId, senderName, content) => {
  try {
    const messagesRef = collection(db, MESSAGES_COLLECTION);

    const message = {
      threadId,
      senderId,
      senderName,
      content,
      createdAt: serverTimestamp(),
      isRead: false,
    };

    const docRef = await addDoc(messagesRef, message);

    // Update thread's lastMessageAt and increment unread counts
    const threadRef = doc(db, THREADS_COLLECTION, threadId);
    const threadDoc = await getDoc(threadRef);

    if (threadDoc.exists()) {
      const threadData = threadDoc.data();
      const newUnreadCount = { ...threadData.unreadCount };

      // Increment unread for all recipients except sender
      threadData.recipients.forEach(recipientId => {
        if (recipientId !== senderId) {
          newUnreadCount[recipientId] = (newUnreadCount[recipientId] || 0) + 1;
        }
      });

      await updateDoc(threadRef, {
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        unreadCount: newUnreadCount,
      });
    }

    return { messageId: docRef.id, error: null };
  } catch (error) {
    console.error('Error sending message:', error);
    return { messageId: null, error: error.message };
  }
};

/**
 * Get all messages in a thread
 * @param {string} threadId - Thread ID
 * @returns {Promise<Object>} { data, error }
 */
export const getThreadMessages = async (threadId) => {
  try {
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const q = query(
      messagesRef,
      where('threadId', '==', threadId),
      orderBy('createdAt', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    }));

    return { data: messages, error: null };
  } catch (error) {
    console.error('Error getting thread messages:', error);
    return { data: [], error: error.message };
  }
};

/**
 * Listen to messages in a thread (real-time)
 * @param {string} threadId - Thread ID
 * @param {Function} callback - Callback with messages array
 * @returns {Function} Unsubscribe function
 */
export const listenToThreadMessages = (threadId, callback) => {
  try {
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const q = query(
      messagesRef,
      where('threadId', '==', threadId),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }));
      callback(messages);
    });
  } catch (error) {
    console.error('Error listening to thread messages:', error);
    return () => {};
  }
};

/**
 * Get all threads for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} { data, error }
 */
export const getUserThreads = async (userId) => {
  try {
    console.log('📥 Fetching threads for user:', userId);
    const threadsRef = collection(db, THREADS_COLLECTION);
    const q = query(
      threadsRef,
      where('recipients', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const threads = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      lastMessageAt: doc.data().lastMessageAt?.toDate?.() || new Date(),
    }));

    console.log(`✅ Found ${threads.length} threads for user ${userId}`);
    return { data: threads, error: null };
  } catch (error) {
    console.error('❌ Error getting user threads:', error);
    // If index error, provide helpful message
    if (error.message?.includes('index')) {
      console.error('⚠️ Firestore index required! Create composite index:');
      console.error('Collection: messageThreads');
      console.error('Fields: recipients (Arrays), lastMessageAt (Descending)');
    }
    return { data: [], error: error.message };
  }
};

/**
 * Get threads for a specific event
 * @param {string} eventId - Event ID
 * @param {string} userId - User ID (to filter by user's threads)
 * @returns {Promise<Object>} { data, error }
 */
export const getEventThreads = async (eventId, userId) => {
  try {
    const threadsRef = collection(db, THREADS_COLLECTION);
    const q = query(
      threadsRef,
      where('eventId', '==', eventId),
      where('recipients', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const threads = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      lastMessageAt: doc.data().lastMessageAt?.toDate?.() || new Date(),
    }));

    return { data: threads, error: null };
  } catch (error) {
    console.error('Error getting event threads:', error);
    return { data: [], error: error.message };
  }
};

/**
 * Mark thread as read for a user
 * @param {string} threadId - Thread ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} { error }
 */
export const markThreadAsRead = async (threadId, userId) => {
  try {
    const threadRef = doc(db, THREADS_COLLECTION, threadId);
    const threadDoc = await getDoc(threadRef);

    if (threadDoc.exists()) {
      const threadData = threadDoc.data();
      const newUnreadCount = { ...threadData.unreadCount };
      newUnreadCount[userId] = 0;

      await updateDoc(threadRef, {
        unreadCount: newUnreadCount,
        updatedAt: serverTimestamp(),
      });
    }

    return { error: null };
  } catch (error) {
    console.error('Error marking thread as read:', error);
    return { error: error.message };
  }
};

/**
 * Resolve a thread
 * @param {string} threadId - Thread ID
 * @param {string} userId - User ID resolving the thread
 * @param {string} userName - Name of user resolving
 * @returns {Promise<Object>} { error }
 */
export const resolveThread = async (threadId, userId, userName) => {
  try {
    const threadRef = doc(db, THREADS_COLLECTION, threadId);

    await updateDoc(threadRef, {
      status: THREAD_STATUS.RESOLVED,
      resolvedAt: serverTimestamp(),
      resolvedBy: userId,
      resolvedByName: userName,
      updatedAt: serverTimestamp(),
    });

    return { error: null };
  } catch (error) {
    console.error('Error resolving thread:', error);
    return { error: error.message };
  }
};

/**
 * Reopen a resolved thread
 * @param {string} threadId - Thread ID
 * @returns {Promise<Object>} { error }
 */
export const reopenThread = async (threadId) => {
  try {
    const threadRef = doc(db, THREADS_COLLECTION, threadId);

    await updateDoc(threadRef, {
      status: THREAD_STATUS.OPEN,
      resolvedAt: null,
      resolvedBy: null,
      resolvedByName: null,
      updatedAt: serverTimestamp(),
    });

    return { error: null };
  } catch (error) {
    console.error('Error reopening thread:', error);
    return { error: error.message };
  }
};

/**
 * Get unread thread count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Unread count
 */
export const getUnreadThreadCount = async (userId) => {
  try {
    const threadsRef = collection(db, THREADS_COLLECTION);
    const q = query(
      threadsRef,
      where('recipients', 'array-contains', userId),
      where('status', '==', THREAD_STATUS.OPEN)
    );

    const querySnapshot = await getDocs(q);
    let unreadCount = 0;

    querySnapshot.docs.forEach(doc => {
      const threadData = doc.data();
      const userUnread = threadData.unreadCount?.[userId] || 0;
      if (userUnread > 0) {
        unreadCount++;
      }
    });

    return unreadCount;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

/**
 * Listen to user threads (real-time)
 * @param {string} userId - User ID
 * @param {Function} callback - Callback with threads array
 * @returns {Function} Unsubscribe function
 */
export const listenToUserThreads = (userId, callback) => {
  try {
    const threadsRef = collection(db, THREADS_COLLECTION);
    const q = query(
      threadsRef,
      where('recipients', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const threads = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        lastMessageAt: doc.data().lastMessageAt?.toDate?.() || new Date(),
      }));
      callback(threads);
    });
  } catch (error) {
    console.error('Error listening to user threads:', error);
    return () => {};
  }
};

export default {
  THREAD_STATUS,
  RECIPIENT_TYPES,
  createMessageThread,
  sendThreadMessage,
  getThreadMessages,
  listenToThreadMessages,
  getUserThreads,
  getEventThreads,
  markThreadAsRead,
  resolveThread,
  reopenThread,
  getUnreadThreadCount,
  listenToUserThreads,
};
