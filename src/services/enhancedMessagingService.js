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

// Helper to parse various timestamp formats stored in Firestore or legacy data
const parseTimestamp = (value) => {
  if (!value) return null;
  // Firestore Timestamp
  if (value?.toDate) return value.toDate();
  // JS Date
  if (value instanceof Date) return value;
  // number (seconds or milliseconds)
  if (typeof value === 'number') {
    // Heuristic: if seconds (10 digits), convert to ms
    if (value < 1e12) return new Date(value * 1000);
    return new Date(value);
  }
  // ISO string
  if (typeof value === 'string') {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
};

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

    // Check thread status before adding message
    const threadRef = doc(db, THREADS_COLLECTION, threadId);
    const threadDoc = await getDoc(threadRef);
    if (threadDoc.exists()) {
      const threadData = threadDoc.data();
      if (threadData.status === THREAD_STATUS.RESOLVED) {
        return { messageId: null, error: 'Thread is resolved and cannot accept new messages' };
      }
    }

    const docRef = await addDoc(messagesRef, message);

    // Update thread's lastMessageAt and increment unread counts
    // Use fresh variables to avoid redeclaration collisions
    const threadRef2 = doc(db, THREADS_COLLECTION, threadId);
    const threadDoc2 = await getDoc(threadRef2);

    if (threadDoc2.exists()) {
      const threadData = threadDoc2.data();
      const newUnreadCount = { ...threadData.unreadCount };

      // Increment unread for all recipients except sender
      threadData.recipients.forEach(recipientId => {
        if (recipientId !== senderId) {
          newUnreadCount[recipientId] = (newUnreadCount[recipientId] || 0) + 1;
        }
      });

      await updateDoc(threadRef2, {
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        unreadCount: newUnreadCount,
      });
    }

    // Return the created message object for optimistic UI updates
    return {
      messageId: docRef.id,
      message: {
        id: docRef.id,
        threadId,
        senderId,
        senderName,
        content,
        createdAt: new Date(), // local placeholder
        isRead: false,
      },
      error: null,
    };
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
    // Handle legacy eventMessages (pseudo-threads) which we surface as `legacy-<id>`
    if (typeof threadId === 'string' && threadId.startsWith('legacy-')) {
      const originalId = threadId.replace('legacy-', '');
      const legacyDocRef = doc(db, 'eventMessages', originalId);
      const legacySnap = await getDoc(legacyDocRef);
      if (!legacySnap.exists()) return { data: [], error: null };

      const data = legacySnap.data();
      // Primary message
      const baseMsg = {
        id: `legacy-${originalId}`,
        threadId,
        senderId: data.userId,
        senderName: data.userName || data.userId,
        content: data.content || data.message || '',
        createdAt: parseTimestamp(data.createdAt) || new Date(),
        isRead: false,
        legacy: true,
      };

      // If there are responses stored on the legacy doc, map them as subsequent messages
      const responses = (data.responses || []).map((r, idx) => ({
        id: `legacy-${originalId}-r-${idx}`,
        threadId,
        senderId: r.userId,
        senderName: r.userName || r.userId,
        content: r.content || r.message || '',
        createdAt: parseTimestamp(r.createdAt) || new Date(),
        isRead: false,
        legacy: true,
      }));

      const all = [baseMsg, ...responses].sort((a, b) => a.createdAt - b.createdAt);
      return { data: all, error: null };
    }

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
      createdAt: parseTimestamp(doc.data().createdAt) || new Date(),
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
    console.log(`🎯 Setting up message listener for thread: ${threadId}`);
    
    // If this is a legacy pseudo-thread, listen to the eventMessages doc
    if (typeof threadId === 'string' && threadId.startsWith('legacy-')) {
      const originalId = threadId.replace('legacy-', '');
      const legacyDocRef = doc(db, 'eventMessages', originalId);
      
      console.log(`📬 Listening to legacy eventMessages doc: ${originalId}`);
      
      return onSnapshot(legacyDocRef, (snap) => {
        if (!snap.exists()) {
          console.warn(`⚠️ Legacy doc ${originalId} does not exist`);
          return callback([]);
        }
        
        const data = snap.data();
        console.log(`✅ Got legacy message doc, content length: ${(data.content || '').length}`);
        
        const baseMsg = {
          id: `legacy-${originalId}`,
          threadId,
          senderId: data.userId,
          senderName: data.userName || data.userId,
          content: data.content || data.message || '',
          createdAt: parseTimestamp(data.createdAt) || new Date(),
          isRead: false,
          legacy: true,
        };

        // If there are responses stored on the legacy doc, map them as subsequent messages
        const responses = (data.responses || []).map((r, idx) => ({
          id: `legacy-${originalId}-r-${idx}`,
          threadId,
          senderId: r.userId,
          senderName: r.userName || r.userId,
          content: r.content || r.message || '',
          createdAt: parseTimestamp(r.createdAt) || new Date(),
          isRead: false,
          legacy: true,
        }));

        const all = [baseMsg, ...responses].sort((a, b) => a.createdAt - b.createdAt);
        console.log(`📨 Emitting ${all.length} legacy messages`);
        callback(all);
      }, (error) => {
        console.error(`❌ Error listening to legacy doc ${originalId}:`, error);
        callback([]);
      });
    }

    // Regular thread messages listener
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const q = query(
      messagesRef,
      where('threadId', '==', threadId),
      orderBy('createdAt', 'asc')
    );

    console.log(`💬 Listening to threadMessages for thread: ${threadId}`);

    return onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: parseTimestamp(doc.data().createdAt) || new Date(),
      }));
      console.log(`✅ Got ${messages.length} messages for thread ${threadId}`);
      callback(messages);
    }, (error) => {
      console.error(`❌ Error listening to thread messages ${threadId}:`, error);
      callback([]);
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
      createdAt: parseTimestamp(doc.data().createdAt) || new Date(),
      lastMessageAt: parseTimestamp(doc.data().lastMessageAt) || new Date(),
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
export const getEventThreads = async (eventId, userId, userRole = null) => {
  try {
    const threadsRef = collection(db, THREADS_COLLECTION);
    const legacyRef = collection(db, 'eventMessages');
    let q;

    // Admins should be able to see all threads for the event
    if (userRole === 'admin') {
      q = query(
        threadsRef,
        where('eventId', '==', eventId),
        orderBy('lastMessageAt', 'desc')
      );
    } else {
      q = query(
        threadsRef,
        where('eventId', '==', eventId),
        where('recipients', 'array-contains', userId),
        orderBy('lastMessageAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const threads = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: parseTimestamp(doc.data().createdAt) || new Date(),
      lastMessageAt: parseTimestamp(doc.data().lastMessageAt) || new Date(),
    }));

    // Load legacy eventMessages
    let legacyThreads = [];
    try {
      // Try with eventId filter first
      const legacyQ = query(legacyRef, where('eventId', '==', eventId), orderBy('createdAt', 'desc'));
      const legacySnapshot = await getDocs(legacyQ);
      legacyThreads = legacySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: `legacy-${doc.id}`,
          legacy: true,
          originalId: doc.id,
          eventId: data.eventId || eventId,
          subject: (data.content || data.messageType || '').slice(0, 80),
          createdBy: data.userId,
          createdByName: data.userName || data.userId,
          recipients: [data.userId],
          status: data.status || THREAD_STATUS.OPEN,
          unreadCount: {},
          createdAt: parseTimestamp(data.createdAt) || new Date(),
          lastMessageAt: parseTimestamp(data.createdAt) || new Date(),
        };
      });
      console.log(`✅ Loaded ${legacyThreads.length} legacy messages for event ${eventId}`);
    } catch (legacyErr) {
      console.warn(`⚠️ Legacy query failed, trying fallback:`, legacyErr.message);
      try {
        // Fallback: load all and filter client-side
        const legacyQFallback = query(legacyRef, orderBy('createdAt', 'desc'));
        const legacySnapshot = await getDocs(legacyQFallback);
        legacyThreads = legacySnapshot.docs
          .filter(doc => {
            const data = doc.data();
            return data.eventId === eventId || !data.eventId;
          })
          .map(doc => {
            const data = doc.data();
            return {
              id: `legacy-${doc.id}`,
              legacy: true,
              originalId: doc.id,
              eventId: data.eventId || eventId,
              subject: (data.content || data.messageType || '').slice(0, 80),
              createdBy: data.userId,
              createdByName: data.userName || data.userId,
              recipients: [data.userId],
              status: data.status || THREAD_STATUS.OPEN,
              unreadCount: {},
              createdAt: parseTimestamp(data.createdAt) || new Date(),
              lastMessageAt: parseTimestamp(data.createdAt) || new Date(),
            };
          });
        console.log(`✅ Loaded ${legacyThreads.length} legacy messages (fallback)`);
      } catch (fallbackErr) {
        console.error(`❌ Both legacy queries failed:`, fallbackErr);
      }
    }

    const combined = [...threads, ...legacyThreads].sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    console.log(`📊 getEventThreads: ${combined.length} total threads (${threads.length} new + ${legacyThreads.length} legacy)`);
    
    return { data: combined, error: null };
  } catch (error) {
    console.error('Error getting event threads:', error);
    return { data: [], error: error.message };
  }
};

/**
 * Listen to threads for a specific event in real-time
 * @param {string} eventId
 * @param {string} userId
 * @param {Function} callback
 * @param {string|null} userRole
 * @returns {Function} unsubscribe
 */
export const listenToEventThreads = (eventId, userId, callback, userRole = null) => {
  try {
    const threadsRef = collection(db, THREADS_COLLECTION);
    const legacyRef = collection(db, 'eventMessages');

    let q;
    if (userRole === 'admin') {
      q = query(
        threadsRef,
        where('eventId', '==', eventId),
        orderBy('lastMessageAt', 'desc')
      );
    } else {
      q = query(
        threadsRef,
        where('eventId', '==', eventId),
        where('recipients', 'array-contains', userId),
        orderBy('lastMessageAt', 'desc')
      );
    }

    let latestThreads = [];
    let latestLegacy = [];

    const emitCombined = () => {
      const combined = [...latestThreads, ...latestLegacy].sort((a, b) => b.lastMessageAt - a.lastMessageAt);
      console.log(`📨 Emitting ${combined.length} total threads (${latestThreads.length} new + ${latestLegacy.length} legacy)`);
      callback(combined);
    };

    const unsubThreads = onSnapshot(q, (querySnapshot) => {
      latestThreads = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: parseTimestamp(doc.data().createdAt) || new Date(),
        lastMessageAt: parseTimestamp(doc.data().lastMessageAt) || new Date(),
      }));
      console.log(`✅ Loaded ${latestThreads.length} new messageThreads for event ${eventId}`);
      emitCombined();
    }, (error) => {
      console.error('❌ Error listening to event threads:', error);
      emitCombined();
    });

    // Try to load legacy messages with eventId filter first
    const unsubLegacy = onSnapshot(
      query(legacyRef, where('eventId', '==', eventId), orderBy('createdAt', 'desc')),
      (querySnapshot) => {
        latestLegacy = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: `legacy-${doc.id}`,
            legacy: true,
            originalId: doc.id,
            eventId: data.eventId,
            subject: (data.content || data.messageType || '').slice(0, 80),
            createdBy: data.userId,
            createdByName: data.userName || data.userId,
            recipients: [data.userId],
            status: data.status || THREAD_STATUS.OPEN,
            unreadCount: {},
            createdAt: parseTimestamp(data.createdAt) || new Date(),
            lastMessageAt: parseTimestamp(data.createdAt) || new Date(),
          };
        });
        console.log(`📬 Loaded ${latestLegacy.length} legacy eventMessages for event ${eventId}`);
        emitCombined();
      },
      (error) => {
        console.warn('⚠️ Legacy query with eventId filter failed, trying without filter:', error.message);
        // Fallback: try loading ALL legacy messages and filter client-side
        try {
          const legacyQFallback = query(legacyRef, orderBy('createdAt', 'desc'));
          const unsubFallback = onSnapshot(
            legacyQFallback,
            (querySnapshot) => {
              latestLegacy = querySnapshot.docs
                .filter(doc => {
                  const data = doc.data();
                  return data.eventId === eventId || !data.eventId; // Include if eventId matches or missing
                })
                .map(doc => {
                  const data = doc.data();
                  return {
                    id: `legacy-${doc.id}`,
                    legacy: true,
                    originalId: doc.id,
                    eventId: data.eventId || eventId,
                    subject: (data.content || data.messageType || '').slice(0, 80),
                    createdBy: data.userId,
                    createdByName: data.userName || data.userId,
                    recipients: [data.userId],
                    status: data.status || THREAD_STATUS.OPEN,
                    unreadCount: {},
                    createdAt: parseTimestamp(data.createdAt) || new Date(),
                    lastMessageAt: parseTimestamp(data.createdAt) || new Date(),
                  };
                });
              console.log(`📬 Loaded ${latestLegacy.length} legacy eventMessages (fallback)`);
              emitCombined();
            },
            (err2) => {
              console.error('❌ Both legacy queries failed:', err2);
              emitCombined();
            }
          );
          return unsubFallback;
        } catch (e) {
          console.error('❌ Error setting up fallback listener:', e);
          emitCombined();
          return () => {};
        }
      }
    );

    return () => {
      try { unsubThreads(); } catch (e) { /* ignore */ }
      try { unsubLegacy(); } catch (e) { /* ignore */ }
    };
  } catch (error) {
    console.error('Error setting up event thread listener:', error);
    return () => {};
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
      // Ensure the thread remains present in event thread queries sorted by lastMessageAt
      lastMessageAt: serverTimestamp(),
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
        createdAt: parseTimestamp(doc.data().createdAt) || new Date(),
        lastMessageAt: parseTimestamp(doc.data().lastMessageAt) || new Date(),
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
