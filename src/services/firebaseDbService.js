// Firebase Firestore Database Service
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  EVENTS: 'events',
  ORDERS: 'orders',
  SHIPMENTS: 'shipments',
  TICKETS: 'tickets',
  ANALYTICS: 'analytics',
  // Hackathon-specific collections
  VOLUNTEERS: 'volunteers',
  VOLUNTEER_TASKS: 'volunteerTasks',
  ACCOMMODATIONS: 'accommodations',
  ROOM_ASSIGNMENTS: 'roomAssignments',
  FOOD_SERVICES: 'foodServices',
  INFRASTRUCTURE: 'infrastructure',
  SCHEDULE_BLOCKS: 'scheduleBlocks',
  VOLUNTEER_PREDICTIONS: 'volunteerPredictions'
};

// ========== GENERIC CRUD OPERATIONS ==========

// Create a document
export const createDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, error: null };
  } catch (error) {
    console.error('Error creating document:', error);
    return { id: null, error: error.message };
  }
};

// Get a single document by ID
export const getDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
    } else {
      return { data: null, error: 'Document not found' };
    }
  } catch (error) {
    console.error('Error getting document:', error);
    return { data: null, error: error.message };
  }
};

// Get all documents in a collection
export const getAllDocuments = async (collectionName, constraints = []) => {
  try {
    const collectionRef = collection(db, collectionName);
    const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;
    const querySnapshot = await getDocs(q);

    const documents = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });

    return { data: documents, error: null };
  } catch (error) {
    console.error('Error getting documents:', error);
    return { data: [], error: error.message };
  }
};

// Update a document
export const updateDocument = async (collectionName, docId, data) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { error: null };
  } catch (error) {
    console.error('Error updating document:', error);
    return { error: error.message };
  }
};

// Delete a document
export const deleteDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    return { error: null };
  } catch (error) {
    console.error('Error deleting document:', error);
    return { error: error.message };
  }
};

// ========== REAL-TIME LISTENERS ==========

// Listen to a single document
export const listenToDocument = (collectionName, docId, callback) => {
  const docRef = doc(db, collectionName, docId);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error listening to document:', error);
  });
};

// Listen to a collection
export const listenToCollection = (collectionName, constraints = [], callback) => {
  const collectionRef = collection(db, collectionName);
  const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;

  return onSnapshot(q, (querySnapshot) => {
    const documents = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    callback(documents);
  }, (error) => {
    console.error('Error listening to collection:', error);
  });
};

// ========== QUERY HELPERS ==========

// Get documents by field value
export const getDocumentsByField = async (collectionName, fieldName, value) => {
  return getAllDocuments(collectionName, [where(fieldName, '==', value)]);
};

// Get documents by user ID
export const getUserDocuments = async (collectionName, userId) => {
  return getDocumentsByField(collectionName, 'userId', userId);
};

// Get documents by creator ID (for user-scoped data)
export const getUserCreatedDocuments = async (collectionName, userId) => {
  return getDocumentsByField(collectionName, 'createdBy', userId);
};

// Get recent documents
export const getRecentDocuments = async (collectionName, limitCount = 10) => {
  return getAllDocuments(collectionName, [
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  ]);
};

// ========== BATCH OPERATIONS ==========

// Batch write multiple documents
export const batchWrite = async (operations) => {
  try {
    const batch = writeBatch(db);

    operations.forEach(({ type, collectionName, docId, data }) => {
      const docRef = docId
        ? doc(db, collectionName, docId)
        : doc(collection(db, collectionName));

      if (type === 'set' || type === 'create') {
        batch.set(docRef, {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else if (type === 'update') {
        batch.update(docRef, {
          ...data,
          updatedAt: serverTimestamp()
        });
      } else if (type === 'delete') {
        batch.delete(docRef);
      }
    });

    await batch.commit();
    return { error: null };
  } catch (error) {
    console.error('Error in batch write:', error);
    return { error: error.message };
  }
};

// ========== SPECIFIC COLLECTIONS ==========

// Events (user-scoped)
export const createEvent = (eventData) => createDocument(COLLECTIONS.EVENTS, eventData);
export const getEvent = (eventId) => getDocument(COLLECTIONS.EVENTS, eventId);
export const getAllEvents = () => getAllDocuments(COLLECTIONS.EVENTS);
export const getUserEvents = (userId) => getUserCreatedDocuments(COLLECTIONS.EVENTS, userId);
export const updateEvent = (eventId, data) => updateDocument(COLLECTIONS.EVENTS, eventId, data);
export const deleteEvent = (eventId) => deleteDocument(COLLECTIONS.EVENTS, eventId);
export const listenToEvents = (callback) => listenToCollection(COLLECTIONS.EVENTS, [], callback);
export const listenToUserEvents = (userId, callback) => {
  return listenToCollection(COLLECTIONS.EVENTS, [where('createdBy', '==', userId)], callback);
};

// Create event with collaboration fields
export const createEventWithCollaboration = async (eventData, userId) => {
  const eventWithCollaboration = {
    ...eventData,
    createdBy: userId,
    organizers: [userId], // Creator is automatically an organizer
    collaborators: [], // Empty initially, can be added later
    volunteers: [],
    sponsors: [],
    visibility: eventData.visibility || 'private', // Default to private
  };
  return createDocument(COLLECTIONS.EVENTS, eventWithCollaboration);
};

// Orders (user-scoped)
export const createOrder = (orderData) => createDocument(COLLECTIONS.ORDERS, orderData);
export const getOrder = (orderId) => getDocument(COLLECTIONS.ORDERS, orderId);
export const getAllOrders = () => getAllDocuments(COLLECTIONS.ORDERS);
export const updateOrder = (orderId, data) => updateDocument(COLLECTIONS.ORDERS, orderId, data);
export const getUserOrders = (userId) => getUserDocuments(COLLECTIONS.ORDERS, userId);
export const listenToOrders = (callback) => listenToCollection(COLLECTIONS.ORDERS, [], callback);
export const listenToUserOrders = (userId, callback) => {
  return listenToCollection(COLLECTIONS.ORDERS, [where('createdBy', '==', userId)], callback);
};

// Tickets (user-scoped)
export const createTicket = (ticketData) => createDocument(COLLECTIONS.TICKETS, ticketData);
export const getTicket = (ticketId) => getDocument(COLLECTIONS.TICKETS, ticketId);
export const getAllTickets = () => getAllDocuments(COLLECTIONS.TICKETS);
export const updateTicket = (ticketId, data) => updateDocument(COLLECTIONS.TICKETS, ticketId, data);
export const getUserTickets = (userId) => getUserDocuments(COLLECTIONS.TICKETS, userId);
export const listenToTickets = (callback) => listenToCollection(COLLECTIONS.TICKETS, [], callback);
export const listenToUserTickets = (userId, callback) => {
  return listenToCollection(COLLECTIONS.TICKETS, [where('createdBy', '==', userId)], callback);
};

// Users
export const createUserProfile = (userId, userData) => {
  const docRef = doc(db, COLLECTIONS.USERS, userId);
  return updateDoc(docRef, {
    ...userData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }).catch(() => {
    // If document doesn't exist, create it
    return addDoc(collection(db, COLLECTIONS.USERS), {
      ...userData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });
};

export const getUserProfile = (userId) => getDocument(COLLECTIONS.USERS, userId);
export const updateUserProfile = (userId, data) => updateDocument(COLLECTIONS.USERS, userId, data);

// ========== TICKET CLAIMING ==========

// Claim a ticket for an event
export const claimTicket = async (eventId, tierIndex, claimerData) => {
  try {
    const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) {
      return { success: false, error: 'Event not found' };
    }

    const eventData = eventSnap.data();
    const ticketTiers = eventData.ticketTiers || [];

    if (tierIndex < 0 || tierIndex >= ticketTiers.length) {
      return { success: false, error: 'Invalid ticket tier' };
    }

    const tier = ticketTiers[tierIndex];
    const available = (tier.supply || 0) - (tier.sold || 0);

    if (available <= 0) {
      return { success: false, error: 'Ticket tier sold out' };
    }

    // Create claimed ticket record
    const claimRecord = {
      eventId,
      eventName: eventData.name,
      tierIndex,
      tierName: tier.name,
      holderName: claimerData.name,
      holderEmail: claimerData.email,
      price: tier.price || 0,
      claimedAt: serverTimestamp(),
      status: 'confirmed'
    };

    // Save to tickets collection
    const ticketRef = await addDoc(collection(db, COLLECTIONS.TICKETS), claimRecord);

    // Update event ticket tier sold count
    const updatedTiers = [...ticketTiers];
    updatedTiers[tierIndex] = {
      ...tier,
      sold: (tier.sold || 0) + 1
    };

    await updateDoc(eventRef, {
      ticketTiers: updatedTiers,
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      ticketId: ticketRef.id,
      ticket: { id: ticketRef.id, ...claimRecord }
    };
  } catch (error) {
    console.error('Error claiming ticket:', error);
    return { success: false, error: error.message };
  }
};

// Export all for convenience
export {
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  where,
  orderBy,
  limit
};
