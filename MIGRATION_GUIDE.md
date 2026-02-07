# Database Migration Guide - RBAC Implementation

## Overview

This migration adds Role-Based Access Control (RBAC) fields to existing events in your database. It's required for the access control system to work correctly.

## What This Migration Does

The migration adds the following fields to all existing events that don't have them:

- **`organizers`**: Array containing the event creator's user ID
- **`volunteers`**: Empty array (to be populated when volunteers are added)
- **`sponsors`**: Empty array (to be populated when sponsors are added)
- **`collaborators`**: Empty array (to be populated when collaborators are added)
- **`visibility`**: Set to `"private"` by default

## Why Run This Migration?

**Before migration:**
- Old events don't have RBAC fields
- Attendees can see ALL events (bug)
- Share button doesn't work properly
- Permission checks fail

**After migration:**
- Old events have proper RBAC fields
- Attendees only see public events
- Share button works correctly
- Permissions are enforced properly

## How to Run the Migration

### Method 1: Browser Console (Recommended)

1. **Start your app** and open it in the browser
2. **Sign in** as an admin user
3. **Open Developer Tools** (Press F12)
4. **Go to Console tab**
5. **Run this command:**
   ```javascript
   await window.runMigrations()
   ```

6. **Wait for completion** - You'll see:
   ```
   🚀 Starting database migrations...
   Running migration: Add RBAC fields to events...
   ✅ Migration complete: Updated X events
   ```

7. **Refresh the page** to see the changes take effect

### Method 2: Manual Script

If console method doesn't work, create a temporary admin page:

1. Create `src/components/Admin/MigrationPage.js`:
```javascript
import React, { useState } from 'react';
import { Button, Container, Typography, Alert } from '@mui/material';
import { runAllMigrations } from '../../utils/migrations';

const MigrationPage = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRunMigration = async () => {
    setLoading(true);
    const result = await runAllMigrations();
    setStatus(result);
    setLoading(false);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Database Migrations
      </Typography>

      <Alert severity="warning" sx={{ mb: 3 }}>
        This will update all existing events to add RBAC fields.
        Run this once after implementing RBAC.
      </Alert>

      <Button
        variant="contained"
        onClick={handleRunMigration}
        disabled={loading}
      >
        {loading ? 'Running...' : 'Run Migration'}
      </Button>

      {status && (
        <Alert severity={status.success ? 'success' : 'error'} sx={{ mt: 2 }}>
          {status.success
            ? `Migration complete! Updated ${status.updated} events.`
            : `Migration failed: ${status.error}`}
        </Alert>
      )}
    </Container>
  );
};

export default MigrationPage;
```

2. Add route in `App.js`:
```javascript
import MigrationPage from './components/Admin/MigrationPage';

// In your Routes:
<Route path="/admin/migrate" element={<MigrationPage />} />
```

3. Visit `http://localhost:3000/admin/migrate` and click the button

## Verification Steps

After running the migration:

### 1. Check Firebase Console
1. Go to Firebase Console → Firestore Database
2. Open any event document
3. Verify these fields exist:
   - `organizers: [userId]`
   - `volunteers: []`
   - `sponsors: []`
   - `collaborators: []`
   - `visibility: "private"`

### 2. Test Access Control

**As Attendee:**
1. Sign in as `attendee@example.com`
2. Go to Events page
3. Should only see **public events** (not all events)
4. Should NOT see Share button on any event

**As Admin:**
1. Sign in as `admin@example.com`
2. Go to Events page
3. Should see **ALL events**
4. Should see Share button on events you own/organize

**As Volunteer:**
1. Sign in as `volunteer@example.com`
2. Go to Events page
3. Should see:
   - Events you're assigned to as volunteer
   - Public events
4. Should NOT see private events you're not invited to

### 3. Test Sharing Feature

1. Sign in as admin
2. Create a new event
3. Click Share button
4. Change visibility to "Public"
5. Sign out and sign in as attendee
6. Verify attendee can now see this public event

## Troubleshooting

### Issue: "window.runMigrations is not a function"

**Solution:** The app might not have loaded the migration script yet. Try:
1. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. Check that `import './utils/migrations'` is in App.js
3. Check browser console for any import errors

### Issue: "Failed to update events"

**Possible causes:**
- Firebase permissions issue
- Network connection problem
- User not authenticated

**Solution:**
1. Make sure you're signed in
2. Check Firebase console for errors
3. Verify your Firestore security rules allow updates

### Issue: "Some events still don't have fields"

**Solution:**
1. Check if migration completed successfully (check console logs)
2. Run migration again (it's safe to run multiple times)
3. Manually check Firebase to see if fields were added

### Issue: "Attendee still sees all events"

**Possible causes:**
- Migration not run yet
- Browser cache
- Events not refreshed

**Solution:**
1. Run the migration
2. Sign out and sign back in
3. Hard refresh the page (Ctrl+Shift+R)
4. Check that `getUserAccessibleEvents` is being called in AppStateContext

## Post-Migration Checklist

- [ ] Migration ran successfully
- [ ] All events have `organizers`, `volunteers`, `sponsors`, `collaborators`, `visibility` fields
- [ ] Attendees only see public events
- [ ] Admins see all events
- [ ] Share button only appears for users with permission
- [ ] Can create new events (automatically have RBAC fields)
- [ ] Can share events and add collaborators
- [ ] Role badges display correctly

## Rollback (If Needed)

If something goes wrong, you can manually revert changes in Firebase:

1. Go to Firebase Console → Firestore
2. For each event document, delete these fields:
   - `organizers`
   - `volunteers`
   - `sponsors`
   - `collaborators`
   - `visibility`

Note: This will break the RBAC system, so only do this if absolutely necessary.

## Future Migrations

Any future schema changes should follow this pattern:

1. Create migration function in `accessControlService.js`
2. Add to `migrations.js`
3. Update this guide
4. Run migration
5. Test thoroughly

## Support

If you encounter issues:
1. Check Firebase console for errors
2. Check browser console for JavaScript errors
3. Review Firestore security rules
4. Verify user authentication status
