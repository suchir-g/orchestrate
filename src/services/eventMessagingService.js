/**
 * Event Messaging Service
 * Handles collaboration messages between event collaborators
 * Sponsors can request sessions, organizers can respond
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
} from 'firebase/firestore';
import { db } from '../config/firebase';

const MESSAGES_COLLECTION = 'eventMessages';

/**
 * Message types
 */
export const MESSAGE_TYPES = {
  COMMENT: 'comment',           // General comment/discussion
  SESSION_REQUEST: 'session_request', // Sponsor requesting to add a session
  APPROVAL: 'approval',          // Organizer approved a request
  REJECTION: 'rejection',        // Organizer rejected a request
  QUESTION: 'question',          // General question
};

/**
 * Message status
 */
export const MESSAGE_STATUS = {
  PENDING: 'pending',       // Awaiting response
  APPROVED: 'approved',     // Request approved
  REJECTED: 'rejected',     // Request rejected
  RESOLVED: 'resolved',     // Question/issue resolved
};

/**
 * Send a message to an event
 * @param {string} eventId - Event ID
 * @param {string} userId - Sender user ID
 * @param {string} userName - Sender user name
 * @param {string} userRole - Sender's event role
 * @param {string} messageType - Type of message
 * @param {string} content - Message content
 * @param {Object} metadata - Additional data (e.g., session details for requests)
 * @returns {Promise<Object>} { id, error }
 */
export const sendEventMessage = async (eventId, userId, userName, userRole, messageType, content, metadata = null) => {
  try {
    const messagesRef = collection(db, MESSAGES_COLLECTION);

    const message = {
      eventId,
      userId,
      userName,
      userRole,
      messageType,
      content,
      metadata: metadata || null,
      status: messageType === MESSAGE_TYPES.SESSION_REQUEST ? MESSAGE_STATUS.PENDING : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      responses: [], // Array of response messages
    };

    const docRef = await addDoc(messagesRef, message);

    return { id: docRef.id, error: null };
  } catch (error) {
    console.error('Error sending message:', error);
    return { id: null, error: error.message };
  }
};

/**
 * Get all messages for an event
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} { data, error }
 */
export const getEventMessages = async (eventId) => {
  try {
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const q = query(
      messagesRef,
      where('eventId', '==', eventId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    }));

    return { data: messages, error: null };
  } catch (error) {
    console.error('Error getting messages:', error);
    return { data: [], error: error.message };
  }
};

/**
 * Listen to messages in real-time
 * @param {string} eventId - Event ID
 * @param {Function} callback - Callback function with messages array
 * @returns {Function} Unsubscribe function
 */
export const listenToEventMessages = (eventId, callback) => {
  try {
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const q = query(
      messagesRef,
      where('eventId', '==', eventId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }));
      callback(messages);
    }, (error) => {
      console.error('Error listening to messages:', error);
      callback([]);
    });
  } catch (error) {
    console.error('Error setting up message listener:', error);
    return () => {}; // Return empty unsubscribe function
  }
};

/**
 * Respond to a message (for organizers)
 * @param {string} messageId - Message ID
 * @param {string} userId - Responder user ID
 * @param {string} userName - Responder user name
 * @param {string} responseText - Response text
 * @param {string} newStatus - New status (approved, rejected, resolved)
 * @returns {Promise<Object>} { error }
 */
export const respondToMessage = async (messageId, userId, userName, responseText, newStatus = null) => {
  try {
    const messageRef = doc(db, MESSAGES_COLLECTION, messageId);

    const response = {
      userId,
      userName,
      responseText,
      respondedAt: new Date().toISOString(),
    };

    const updates = {
      responses: [...(await getDoc(messageRef)).data().responses || [], response],
      updatedAt: serverTimestamp(),
    };

    if (newStatus) {
      updates.status = newStatus;
    }

    await updateDoc(messageRef, updates);

    return { error: null };
  } catch (error) {
    console.error('Error responding to message:', error);
    return { error: error.message };
  }
};

/**
 * Update message status (approve/reject session requests)
 * @param {string} messageId - Message ID
 * @param {string} status - New status
 * @param {string} userId - User making the change
 * @param {string} userName - Name of user making the change
 * @param {string} note - Optional note about the decision
 * @returns {Promise<Object>} { error }
 */
export const updateMessageStatus = async (messageId, status, userId, userName, note = '') => {
  try {
    const messageRef = doc(db, MESSAGES_COLLECTION, messageId);

    const updates = {
      status,
      updatedAt: serverTimestamp(),
      resolvedBy: userId,
      resolvedByName: userName,
      resolutionNote: note,
      resolvedAt: serverTimestamp(),
    };

    await updateDoc(messageRef, updates);

    return { error: null };
  } catch (error) {
    console.error('Error updating message status:', error);
    return { error: error.message };
  }
};

/**
 * Get pending session requests for an event (organizers view)
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} { data, error }
 */
export const getPendingRequests = async (eventId) => {
  try {
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const q = query(
      messagesRef,
      where('eventId', '==', eventId),
      where('messageType', '==', MESSAGE_TYPES.SESSION_REQUEST),
      where('status', '==', MESSAGE_STATUS.PENDING),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const requests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    }));

    return { data: requests, error: null };
  } catch (error) {
    console.error('Error getting pending requests:', error);
    return { data: [], error: error.message };
  }
};

export default {
  MESSAGE_TYPES,
  MESSAGE_STATUS,
  sendEventMessage,
  getEventMessages,
  listenToEventMessages,
  respondToMessage,
  updateMessageStatus,
  getPendingRequests,
};
