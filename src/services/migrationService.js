/**
 * Database Migration Service
 * Helps migrate data from old structure to new accounts/eventuser structure
 */

import { db } from '../config/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { createOrUpdateAccount } from './accountService';
import { setEventUserRole } from './eventUserService';

/**
 * Migrate user profiles to accounts collection
 * Copies data from old userProfiles collection to new accounts collection
 * @returns {Promise<Object>} { success, migratedCount, error }
 */
export const migrateUserProfilesToAccounts = async () => {
  try {
    console.log('Starting migration: userProfiles → accounts');
    
    // Get all documents from old userProfiles collection
    const userProfilesRef = collection(db, 'userProfiles');
    const snapshot = await getDocs(userProfilesRef);

    let migratedCount = 0;
    const errors = [];

    for (const userDoc of snapshot.docs) {
      try {
        const userData = userDoc.data();
        const userId = userDoc.id;

        // Create account with all user profile data
        const { success, error } = await createOrUpdateAccount(userId, {
          email: userData.email || '',
          displayName: userData.displayName || '',
          photoURL: userData.photoURL || null,
          bio: userData.bio || '',
          walletAddress: userData.walletAddress || null,
          walletConnectedAt: userData.walletConnectedAt,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
          deleted: userData.deleted || false,
        });

        if (success) {
          migratedCount++;
        } else {
          errors.push({ userId, error });
        }
      } catch (err) {
        errors.push({ userId: userDoc.id, error: err.message });
      }
    }

    console.log(`Migration completed: ${migratedCount} accounts created`);
    if (errors.length > 0) {
      console.warn('Migration errors:', errors);
    }

    return { success: true, migratedCount, errors: errors.length > 0 ? errors : null };
  } catch (error) {
    console.error('Error migrating user profiles:', error);
    return { success: false, migratedCount: 0, error: error.message };
  }
};

/**
 * Migrate event collaborators to eventuser collection
 * Copies data from events.collaborators to new eventuser collection
 * @returns {Promise<Object>} { success, migratedCount, error }
 */
export const migrateEventCollaboratorsToEventUsers = async () => {
  try {
    console.log('Starting migration: events.collaborators → eventuser');

    // Get all events
    const eventsRef = collection(db, 'events');
    const eventsSnapshot = await getDocs(eventsRef);

    let migratedCount = 0;
    const errors = [];

    for (const eventDoc of eventsSnapshot.docs) {
      try {
        const eventData = eventDoc.data();
        const eventId = eventDoc.id;

        // Migrate event creator as organizer
        if (eventData.createdBy) {
          const { success, error } = await setEventUserRole(
            eventId,
            eventData.createdBy,
            'organizer'
          );
          if (success) {
            migratedCount++;
          } else {
            errors.push({ eventId, userId: eventData.createdBy, error });
          }
        }

        // Migrate collaborators
        const collaborators = eventData.collaborators || [];
        for (const collab of collaborators) {
          try {
            const { success, error } = await setEventUserRole(
              eventId,
              collab.userId,
              collab.role || 'volunteer',
              collab.schedule || null
            );
            if (success) {
              migratedCount++;
            } else {
              errors.push({ eventId, userId: collab.userId, error });
            }
          } catch (err) {
            errors.push({ eventId, userId: collab.userId, error: err.message });
          }
        }
      } catch (err) {
        errors.push({ eventId: eventDoc.id, error: err.message });
      }
    }

    console.log(`Migration completed: ${migratedCount} event users created`);
    if (errors.length > 0) {
      console.warn('Migration errors:', errors);
    }

    return { success: true, migratedCount, errors: errors.length > 0 ? errors : null };
  } catch (error) {
    console.error('Error migrating event collaborators:', error);
    return { success: false, migratedCount: 0, error: error.message };
  }
};

/**
 * Run all migrations
 * @returns {Promise<Object>} Migration results for all migrations
 */
export const runAllMigrations = async () => {
  try {
    console.log('Starting database migrations...');

    const accountsMigration = await migrateUserProfilesToAccounts();
    const eventUsersMigration = await migrateEventCollaboratorsToEventUsers();

    console.log('All migrations completed');

    return {
      success: accountsMigration.success && eventUsersMigration.success,
      accountsMigration,
      eventUsersMigration,
    };
  } catch (error) {
    console.error('Error running migrations:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Verify migration - check if data exists in new collections
 * @returns {Promise<Object>} Verification results
 */
export const verifyMigration = async () => {
  try {
    const accountsRef = collection(db, 'accounts');
    const accountsSnapshot = await getDocs(accountsRef);

    const eventUserRef = collection(db, 'eventuser');
    const eventUserSnapshot = await getDocs(eventUserRef);

    return {
      accountsCount: accountsSnapshot.size,
      eventUserCount: eventUserSnapshot.size,
      success: accountsSnapshot.size > 0 && eventUserSnapshot.size > 0,
    };
  } catch (error) {
    console.error('Error verifying migration:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
