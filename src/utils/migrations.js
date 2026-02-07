/**
 * Database Migration Utilities
 * Run these functions once to migrate data when schema changes
 */

import { migrateEventsToRBAC } from '../services/accessControlService';
import toast from 'react-hot-toast';

/**
 * Run all pending migrations
 * Call this from browser console: window.runMigrations()
 */
export const runAllMigrations = async () => {
  console.log('🚀 Starting database migrations...');

  try {
    // Migration 1: Add RBAC fields to events
    console.log('Running migration: Add RBAC fields to events...');
    const { updated, error } = await migrateEventsToRBAC();

    if (error) {
      console.error('❌ Migration failed:', error);
      toast.error(`Migration failed: ${error}`);
      return { success: false, error };
    }

    console.log(`✅ Migration complete: Updated ${updated} events`);
    toast.success(`Migration complete! Updated ${updated} events.`);

    return { success: true, updated };
  } catch (error) {
    console.error('❌ Migration error:', error);
    toast.error('Migration failed. Check console for details.');
    return { success: false, error: error.message };
  }
};

// Expose to window for easy console access
if (typeof window !== 'undefined') {
  window.runMigrations = runAllMigrations;
  window.migrateEventsToRBAC = migrateEventsToRBAC;
}

export default {
  runAllMigrations,
  migrateEventsToRBAC,
};
