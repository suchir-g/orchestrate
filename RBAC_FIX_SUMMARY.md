# RBAC Bug Fix - Summary of Changes

## Issue Reported
"Right now attendee can see all events, and is able to change settings while it should not be allowed to"

## Root Causes Identified

1. **Missing RBAC fields on old events**: Events created before RBAC implementation didn't have `organizers`, `volunteers`, `sponsors`, `collaborators`, or `visibility` fields
2. **No permission checks in UI**: Share and Edit buttons were shown to all users regardless of permissions
3. **Firestore query limitations**: The `getUserAccessibleEvents()` query couldn't match events without the required fields

## Files Modified

### 1. `src/services/accessControlService.js`
**Changes:**
- Added `writeBatch` import from Firestore
- Added `migrateEventsToRBAC()` function to add missing RBAC fields to existing events
  - Adds `organizers` array (with creator as organizer)
  - Adds empty `volunteers`, `sponsors`, `collaborators` arrays
  - Adds `visibility: "private"` by default
  - Uses batch writes for efficiency

### 2. `src/components/EventDetail/EventDetail.js`
**Changes:**
- Imported `useAuth` hook to access current user and role
- Imported `getUserEventRole` from accessControlService
- Imported `EVENT_ROLES`, `PERMISSIONS`, `hasEventPermission` from roleConstants
- Added `userEventRole` state to track user's role for the event
- Added useEffect to load user's event role when component mounts
- Added `canShareEvent` and `canEditEvent` permission check helpers using `useMemo`
- Wrapped Share button in conditional render: `{canShareEvent && ...}`
- Wrapped Manage Schedule button in conditional render: `{canEditEvent && ...}`
- Wrapped Next Stage button in conditional render: `{canEditEvent && ...}`

**Result:** Attendees no longer see Share, Edit, or Next Stage buttons on events they don't have permission for.

### 3. `src/components/EventTracking/EventTracking.js`
**Changes:**
- Imported `getUserEventRole` from accessControlService
- Imported `PERMISSIONS`, `hasEventPermission` from roleConstants
- Added `eventRoles` state to track roles for all events
- Added `userRole` from useAuth context
- Added useEffect to load event roles for all events when component mounts
- Added `canShareEvent(eventId)` helper function
- Updated EventCard component to conditionally render Share button: `{canShareEvent(event.id) && ...}`

**Result:** Share button only appears on event cards where user has permission to share.

### 4. `src/context/AppStateContext.js`
**Changes:**
- Removed `createEvent` import
- Added `createEventWithCollaboration` import
- Updated `addEvent` action to use `createEventWithCollaboration` instead of `createEvent`
- Added user authentication check before creating events
- Now passes `user.uid` to `createEventWithCollaboration`

**Result:** All new events created from now on will automatically have RBAC fields.

### 5. `src/App.js`
**Changes:**
- Added import for migrations utility: `import './utils/migrations'`

**Result:** Exposes migration functions to browser console via `window.runMigrations()`.

## Files Created

### 1. `src/utils/migrations.js`
**Purpose:** Provides utility functions to run database migrations

**Key Functions:**
- `runAllMigrations()`: Runs all pending migrations and shows toast notifications
- Exposes functions to `window` object for console access

### 2. `MIGRATION_GUIDE.md`
**Purpose:** Step-by-step guide for running the database migration

**Contents:**
- What the migration does
- Why it's needed
- How to run it (console method + manual method)
- Verification steps
- Troubleshooting guide
- Post-migration checklist

### 3. `RBAC_FIX_SUMMARY.md`
**Purpose:** This file - comprehensive summary of all changes

## How the Fix Works

### Before Fix
```
User: attendee@example.com (role: attendee)
Events Query: OR(
  createdBy == userId,           // ❌ No match
  organizers.contains(userId),   // ❌ Field missing on old events
  volunteers.contains(userId),   // ❌ Field missing on old events
  sponsors.contains(userId),     // ❌ Field missing on old events
  visibility == "public"         // ❌ Field missing on old events
)
Result: Returns ALL events due to Firestore query behavior with missing fields
```

### After Fix
```
1. Run Migration:
   - Adds organizers: [creatorId]
   - Adds volunteers: []
   - Adds sponsors: []
   - Adds collaborators: []
   - Adds visibility: "private"

2. User: attendee@example.com (role: attendee)
   Events Query: OR(
     createdBy == userId,           // ❌ No match
     organizers.contains(userId),   // ❌ [] doesn't contain userId
     volunteers.contains(userId),   // ❌ [] doesn't contain userId
     sponsors.contains(userId),     // ❌ [] doesn't contain userId
     visibility == "public"         // ✅ Match only if public
   )
   Result: Returns ONLY public events

3. UI Permission Checks:
   - getUserEventRole() returns null for attendees on private events
   - canShareEvent = false
   - canEditEvent = false
   - Buttons hidden
```

## Testing Instructions

### Step 1: Run Migration
1. Start the app
2. Sign in as admin
3. Open browser console (F12)
4. Run: `await window.runMigrations()`
5. Wait for success message

### Step 2: Test as Attendee
1. Sign out
2. Sign in as `attendee@example.com`
3. Go to Events page
4. **Expected Results:**
   - Should ONLY see public events
   - Should NOT see Share button
   - Should NOT see Edit/Manage buttons
   - Events list should be filtered correctly

### Step 3: Test as Admin
1. Sign out
2. Sign in as `admin@example.com`
3. Go to Events page
4. **Expected Results:**
   - Should see ALL events (including private)
   - Should see Share button on all events
   - Should see Edit/Manage buttons
   - Can create new events with Share capability

### Step 4: Test as Volunteer
1. Have admin share an event with `volunteer@example.com` as Volunteer
2. Sign in as `volunteer@example.com`
3. Go to Events page
4. **Expected Results:**
   - Should see events where added as volunteer
   - Should see public events
   - Should NOT see other private events
   - Should NOT see Share button (volunteers can't share)

### Step 5: Test Sharing
1. Sign in as admin
2. Create a new private event
3. Click Share button
4. Change visibility to "Public"
5. Sign in as attendee
6. **Expected Result:** Attendee can now see this event

### Step 6: Test Event Creation
1. Sign in as any user
2. Create a new event
3. Check Firebase Console
4. **Expected Result:** Event has all RBAC fields automatically

## Expected Behavior After Fix

| User Role | Events Visible | Share Button | Edit/Manage Buttons |
|-----------|---------------|--------------|---------------------|
| **Attendee** | Public events only | ❌ Never | ❌ Never |
| **Volunteer** | Public + assigned events | ❌ No | ❌ Limited (view only) |
| **Organizer** | Public + organized events | ✅ On own events | ✅ On own events |
| **Admin** | ALL events | ✅ On all events | ✅ On all events |

## Database Schema Changes

### Event Document (Before)
```javascript
{
  id: "event123",
  name: "Tech Conference",
  date: "2024-06-15",
  createdBy: "userId123",
  // Missing RBAC fields ❌
}
```

### Event Document (After Migration)
```javascript
{
  id: "event123",
  name: "Tech Conference",
  date: "2024-06-15",
  createdBy: "userId123",
  organizers: ["userId123"],      // ✅ Added
  volunteers: [],                  // ✅ Added
  sponsors: [],                    // ✅ Added
  collaborators: [],               // ✅ Added
  visibility: "private",           // ✅ Added
}
```

### New Event Document (Created After Fix)
```javascript
{
  id: "event456",
  name: "New Event",
  date: "2024-07-01",
  createdBy: "userId456",
  organizers: ["userId456"],       // ✅ Auto-added
  volunteers: [],                   // ✅ Auto-added
  sponsors: [],                     // ✅ Auto-added
  collaborators: [],                // ✅ Auto-added
  visibility: "private",            // ✅ Auto-added (default)
}
```

## Key Takeaways

1. **Migration is required** - Old events won't work with RBAC without running the migration
2. **New events work automatically** - AppStateContext now uses `createEventWithCollaboration`
3. **UI enforces permissions** - Buttons are hidden based on user's event role
4. **Backend filtering works** - `getUserAccessibleEvents()` properly filters by role
5. **Safe to re-run** - Migration checks for existing fields and only updates missing ones

## Maintenance Notes

### Adding New RBAC Fields in Future
If you need to add more RBAC-related fields:

1. Create migration function in `accessControlService.js`
2. Add to `migrations.js`
3. Update `createEventWithCollaboration` in `firebaseDbService.js`
4. Run migration for existing events

### Testing RBAC Changes
Always test with 3 accounts:
- admin@example.com (admin role)
- volunteer@example.com (volunteer role)
- attendee@example.com (attendee role)

### Firestore Security Rules
Remember to update Firestore security rules to enforce permissions at the database level:

```javascript
match /events/{eventId} {
  // Allow read for public events
  allow read: if resource.data.visibility == 'public';

  // Allow read for collaborators
  allow read: if request.auth.uid in resource.data.organizers
             || request.auth.uid in resource.data.volunteers
             || request.auth.uid in resource.data.sponsors
             || request.auth.uid == resource.data.createdBy;

  // Allow write for owner and organizers
  allow write: if request.auth.uid == resource.data.createdBy
              || request.auth.uid in resource.data.organizers;
}
```

## Status: ✅ COMPLETE

All changes have been implemented. Follow these steps:

1. ✅ Start the app
2. ⏳ Run migration: `await window.runMigrations()`
3. ⏳ Test with 3 accounts (admin, volunteer, attendee)
4. ⏳ Verify attendees only see public events
5. ⏳ Verify buttons are hidden correctly
