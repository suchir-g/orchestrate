/**
 * Test Data Setup for Event Teams
 * Creates test organizers and volunteers for an event
 * 
 * Usage: Call createTestTeamData with an eventId to add test collaborators
 */

import { addEventCollaborator } from '../services/accessControlService';
import { EVENT_ROLES } from './roleConstants';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Create test team data for an event
 * Adds 2 test organizers and 3 test volunteers
 * @param {string} eventId - Event ID to add test data to
 * @returns {Promise<Object>} { success, message }
 */
export const createTestTeamData = async (eventId) => {
  try {
    console.log(`🧪 Creating test team data for event: ${eventId}`);

    // Test organizers
    const testOrganizers = [
      { userId: 'organizer_alice', name: 'Alice Johnson' },
      { userId: 'organizer_bob', name: 'Bob Smith' },
    ];

    // Test volunteers
    const testVolunteers = [
      { userId: 'volunteer_carol', name: 'Carol Davis' },
      { userId: 'volunteer_diana', name: 'Diana Wilson' },
      { userId: 'volunteer_evan', name: 'Evan Brown' },
    ];

    // Add organizers
    for (const org of testOrganizers) {
      const result = await addEventCollaborator(eventId, org.userId, EVENT_ROLES.ORGANIZER);
      if (result.error) {
        console.error(`❌ Failed to add organizer ${org.userId}:`, result.error);
      } else {
        // Create user profile for display name
        await setDoc(doc(db, 'userProfiles', org.userId), {
          displayName: org.name,
          email: `${org.userId}@example.com`,
          role: 'organizer',
          createdAt: new Date().toISOString()
        });
        console.log(`✅ Added organizer: ${org.userId} (${org.name})`);
      }
    }

    // Add volunteers
    for (const vol of testVolunteers) {
      const result = await addEventCollaborator(eventId, vol.userId, EVENT_ROLES.VOLUNTEER);
      if (result.error) {
        console.error(`❌ Failed to add volunteer ${vol.userId}:`, result.error);
      } else {
        // Create user profile for display name
        await setDoc(doc(db, 'userProfiles', vol.userId), {
          displayName: vol.name,
          email: `${vol.userId}@example.com`,
          role: 'volunteer',
          createdAt: new Date().toISOString()
        });
        console.log(`✅ Added volunteer: ${vol.userId} (${vol.name})`);
      }
    }

    console.log('🎉 Test team data created successfully!');
    return {
      success: true,
      message: `Added ${testOrganizers.length} organizers and ${testVolunteers.length} volunteers`,
      organizers: testOrganizers,
      volunteers: testVolunteers,
    };
  } catch (error) {
    console.error('❌ Error creating test team data:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Log test team data info to console
 */
export const logTestTeamInfo = () => {
  console.log(`
🧪 TEST TEAM DATA INFO:

📋 Test Organizers:
  • organizer_alice (Alice Johnson)
  • organizer_bob (Bob Smith)

📋 Test Volunteers:
  • volunteer_carol (Carol Davis)
  • volunteer_diana (Diana Wilson)
  • volunteer_evan (Evan Brown)

💡 Usage:
  In browser console, run:
  import { createTestTeamData } from './path/to/testTeamData.js'
  createTestTeamData('YOUR_EVENT_ID')
  `);
};
