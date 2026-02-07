/**
 * Quick Fix: Add creator as organizer to a specific event
 * Use this if migration isn't working or for quick fixes
 */

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Fix a single event by adding creator as organizer
 * @param {string} eventId - Event ID to fix
 * @param {string} creatorUserId - User ID of the creator
 */
export const fixEventOwnership = async (eventId, creatorUserId) => {
  try {
    const eventRef = doc(db, 'events', eventId);

    await updateDoc(eventRef, {
      organizers: [creatorUserId],
      volunteers: [],
      sponsors: [],
      collaborators: [],
      visibility: 'private',
      updatedAt: new Date(),
    });

    console.log(`✅ Fixed event ${eventId} - added ${creatorUserId} as organizer`);
    return { error: null };
  } catch (error) {
    console.error('Error fixing event:', error);
    return { error: error.message };
  }
};

/**
 * Fix all events for a specific user
 * Adds the user as organizer to all events they created
 * @param {string} userId - User ID
 */
export const fixAllUserEvents = async (userId) => {
  try {
    const { collection, query, where, getDocs, writeBatch } = await import('firebase/firestore');

    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('createdBy', '==', userId));
    const querySnapshot = await getDocs(q);

    const batch = writeBatch(db);
    let count = 0;

    querySnapshot.forEach((docSnapshot) => {
      const eventRef = doc(db, 'events', docSnapshot.id);
      const eventData = docSnapshot.data();

      // Only update if missing RBAC fields
      if (!eventData.organizers || !eventData.visibility) {
        batch.update(eventRef, {
          organizers: eventData.organizers || [userId],
          volunteers: eventData.volunteers || [],
          sponsors: eventData.sponsors || [],
          collaborators: eventData.collaborators || [],
          visibility: eventData.visibility || 'private',
          updatedAt: new Date(),
        });
        count++;
      }
    });

    await batch.commit();
    console.log(`✅ Fixed ${count} events for user ${userId}`);
    return { count, error: null };
  } catch (error) {
    console.error('Error fixing user events:', error);
    return { count: 0, error: error.message };
  }
};

// Expose to window for console access
if (typeof window !== 'undefined') {
  window.fixEventOwnership = fixEventOwnership;
  window.fixAllUserEvents = fixAllUserEvents;
}

export default {
  fixEventOwnership,
  fixAllUserEvents,
};
