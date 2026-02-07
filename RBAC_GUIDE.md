# Role-Based Access Control (RBAC) System - Complete Guide

## 📋 Table of Contents
- [Overview](#overview)
- [User Roles](#user-roles)
- [Event Roles](#event-roles)
- [Permissions](#permissions)
- [Implementation](#implementation)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)

---

## Overview

The Orchestrate platform now includes a comprehensive Role-Based Access Control (RBAC) system that allows:
- **User-level roles** for system-wide permissions
- **Event-level roles** for event-specific permissions
- **Event sharing** and collaboration
- **Invite links** for easy team building
- **Visibility controls** for events (Private, Organization, Public)

---

## User Roles

### 5 User Roles Available:

| Role | Description | Default | Key Permissions |
|------|-------------|---------|-----------------|
| **Admin** | Full system access | No | All permissions |
| **Organizer** | Create and manage events | No | Create/manage events, add collaborators, manage volunteers |
| **Volunteer** | Help at events | No | View assigned events, manage volunteer tasks |
| **Sponsor** | Sponsor events | No | View sponsored events, manage sponsorship details |
| **Attendee** | Attend public events | **Yes** | View public events, purchase tickets |

### Setting User Roles

**In User Profile (Account Page):**
```javascript
// Users can change their own role (demo mode)
// In production, admins should control this

const { userRole, updateUserRole } = useAuth();
await updateUserRole('organizer'); // Change to organizer
```

---

## Event Roles

### 5 Event-Specific Roles:

| Role | Description | Permissions |
|------|-------------|-------------|
| **Owner** | Event creator | Full access - can delete event, manage all aspects |
| **Organizer** | Co-organizer | Can edit event, manage volunteers, tickets |
| **Volunteer** | Event helper | View event details, manage assigned tasks |
| **Sponsor** | Event sponsor | View event details, see analytics |
| **Viewer** | Read-only access | View event details only |

---

## Permissions

### Permission Categories:

**Event Permissions:**
- `event:view` - View event details
- `event:edit` - Edit event information
- `event:delete` - Delete event
- `event:share` - Share event and manage collaborators

**Collaborator Permissions:**
- `collaborator:add` - Add new collaborators
- `collaborator:remove` - Remove collaborators
- `collaborator:edit` - Change collaborator roles

**Volunteer Permissions:**
- `volunteer:view` - View volunteers
- `volunteer:manage` - Add/edit/remove volunteers
- `volunteer:assign` - Assign volunteers to tasks

**Schedule/Order/Ticket Permissions:**
- `schedule:view` / `schedule:edit`
- `order:view` / `order:manage`
- `ticket:view` / `ticket:manage`
- `sponsor:view` / `sponsor:manage`

### Checking Permissions:

```javascript
import { hasPermission, PERMISSIONS } from '../utils/roleConstants';

// Check if user has permission
if (hasPermission(userRole, PERMISSIONS.EVENT_EDIT)) {
  // User can edit events
}

// Check event-specific permission
import { hasEventAccess } from '../services/accessControlService';

const canEdit = await hasEventAccess(eventId, userId, userRole, PERMISSIONS.EVENT_EDIT);
```

---

## Implementation

### 1. Event Creation with Collaboration

```javascript
import { createEventWithCollaboration } from '../services/firebaseDbService';

const newEvent = {
  name: 'Tech Conference 2024',
  date: '2024-06-15',
  location: 'Convention Center',
  visibility: 'private', // 'private', 'organization', or 'public'
};

const { id, error } = await createEventWithCollaboration(newEvent, userId);
```

**Event Structure:**
```javascript
{
  id: 'event123',
  name: 'Tech Conference 2024',
  createdBy: 'user123', // Owner
  organizers: ['user123'], // Owner is automatically added
  collaborators: [
    { userId: 'user456', role: 'organizer', addedAt: '2024-01-15' },
    { userId: 'user789', role: 'volunteer', addedAt: '2024-01-16' }
  ],
  volunteers: ['user789'],
  sponsors: [],
  visibility: 'private', // 'private', 'organization', 'public'
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 2. Adding Collaborators

```javascript
import { addEventCollaborator } from '../services/accessControlService';
import { EVENT_ROLES } from '../utils/roleConstants';

// Add a volunteer
await addEventCollaborator(
  eventId,
  'user789',
  EVENT_ROLES.VOLUNTEER
);

// Add an organizer
await addEventCollaborator(
  eventId,
  'user456',
  EVENT_ROLES.ORGANIZER
);
```

### 3. Using the EventSharing Component

```javascript
import EventSharing from '../components/EventSharing/EventSharing';

function MyEventPage() {
  const [sharingOpen, setSharingOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setSharingOpen(true)}>
        Share Event
      </Button>

      <EventSharing
        open={sharingOpen}
        onClose={() => setSharingOpen(false)}
        event={currentEvent}
        onUpdate={() => {
          // Refresh event data
        }}
      />
    </>
  );
}
```

### 4. Fetching Accessible Events

Events are now automatically fetched based on user roles:

```javascript
// In AppStateContext, events are fetched for:
// 1. Events the user created
// 2. Events where user is an organizer
// 3. Events where user is a volunteer
// 4. Events where user is a sponsor
// 5. Public events (for all users)

const { events } = useAppState(); // Already filtered by role!
```

### 5. Protecting Routes

```javascript
import ProtectedRoute from '../components/Common/ProtectedRoute';
import { USER_ROLES, PERMISSIONS } from '../utils/roleConstants';

// Protect admin-only routes
<Route
  path="/admin/*"
  element={
    <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>

// Protect organizer routes
<Route
  path="/events/create"
  element={
    <ProtectedRoute
      allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.ORGANIZER]}
      requiredPermission={PERMISSIONS.EVENT_EDIT}
    >
      <CreateEvent />
    </ProtectedRoute>
  }
/>
```

### 6. Event Visibility Controls

```javascript
import { updateEventVisibility, EVENT_VISIBILITY } from '../services/accessControlService';

// Change event to public
await updateEventVisibility(eventId, EVENT_VISIBILITY.PUBLIC);

// Change to private
await updateEventVisibility(eventId, EVENT_VISIBILITY.PRIVATE);

// Organization-only
await updateEventVisibility(eventId, EVENT_VISIBILITY.ORGANIZATION);
```

---

## Usage Examples

### Example 1: Create Event and Add Team

```javascript
import { createEventWithCollaboration } from '../services/firebaseDbService';
import { addEventCollaborator } from '../services/accessControlService';
import { EVENT_ROLES } from '../utils/roleConstants';

// 1. Create event
const eventData = {
  name: 'Summer Festival',
  date: '2024-07-20',
  visibility: 'private',
};

const { id: eventId } = await createEventWithCollaboration(eventData, userId);

// 2. Add co-organizer
await addEventCollaborator(eventId, 'coorganizer@example.com', EVENT_ROLES.ORGANIZER);

// 3. Add volunteers
await addEventCollaborator(eventId, 'volunteer1@example.com', EVENT_ROLES.VOLUNTEER);
await addEventCollaborator(eventId, 'volunteer2@example.com', EVENT_ROLES.VOLUNTEER);

// 4. Add sponsor
await addEventCollaborator(eventId, 'sponsor@company.com', EVENT_ROLES.SPONSOR);
```

### Example 2: Generate and Share Invite Links

```javascript
import { generateEventInviteLink } from '../services/accessControlService';
import { EVENT_ROLES } from '../utils/roleConstants';

// Generate invite link for volunteers
const volunteerInviteLink = generateEventInviteLink(eventId, EVENT_ROLES.VOLUNTEER);

// Share via email, SMS, etc.
console.log('Share this link with volunteers:', volunteerInviteLink);
// Example: https://yourapp.com/event/event123/join?invite=encodedInviteCode

// Links expire in 7 days
```

### Example 3: Check User's Role for Event

```javascript
import { getUserEventRole, hasEventAccess } from '../services/accessControlService';
import { PERMISSIONS } from '../utils/roleConstants';

// Get user's role for this event
const eventRole = await getUserEventRole(eventId, userId, userRole);
console.log('User role:', eventRole); // 'owner', 'organizer', 'volunteer', etc.

// Check specific permission
const canEdit = await hasEventAccess(
  eventId,
  userId,
  userRole,
  PERMISSIONS.EVENT_EDIT
);

if (canEdit) {
  // Show edit button
}
```

### Example 4: Display Role Badge

```javascript
import { Chip } from '@mui/material';
import { getRoleColor, EVENT_ROLE_LABELS } from '../utils/roleConstants';

function EventMemberBadge({ role }) {
  return (
    <Chip
      label={EVENT_ROLE_LABELS[role]}
      color={getRoleColor(role)}
      size="small"
    />
  );
}

// Usage:
<EventMemberBadge role="organizer" /> // Shows "Organizer" chip in primary color
<EventMemberBadge role="volunteer" /> // Shows "Volunteer" chip in success color
```

---

## API Reference

### Access Control Service

#### `getUserAccessibleEvents(userId, userRole)`
Fetches all events the user can access based on their role.

**Parameters:**
- `userId` (string) - User ID
- `userRole` (string) - User's global role

**Returns:** `{ data: [...events], error: null }`

---

#### `getUserEventRole(eventId, userId, userRole)`
Gets the user's role for a specific event.

**Parameters:**
- `eventId` (string) - Event ID
- `userId` (string) - User ID
- `userRole` (string) - User's global role

**Returns:** `string` - Event role ('owner', 'organizer', 'volunteer', etc.) or `null`

---

#### `addEventCollaborator(eventId, userId, role, permissions?)`
Adds a collaborator to an event.

**Parameters:**
- `eventId` (string) - Event ID
- `userId` (string) - User ID to add
- `role` (string) - Event role to assign
- `permissions` (object, optional) - Custom permissions

**Returns:** `{ error: null }` or `{ error: message }`

---

#### `removeEventCollaborator(eventId, userId)`
Removes a collaborator from an event.

---

#### `updateEventVisibility(eventId, visibility)`
Changes event visibility.

**Parameters:**
- `eventId` (string) - Event ID
- `visibility` (string) - 'private', 'organization', or 'public'

---

#### `generateEventInviteLink(eventId, role)`
Generates an invite link for the event.

**Returns:** `string` - Invite URL (valid for 7 days)

---

#### `acceptEventInvite(eventId, userId, inviteCode)`
Accepts an event invite and adds user as collaborator.

---

## Best Practices

1. **Always check permissions** before showing UI elements
2. **Use ProtectedRoute** for sensitive pages
3. **Validate roles on the backend** (Firebase Security Rules)
4. **Regularly cleanup** expired invite links
5. **Audit role changes** for security
6. **Use event visibility** appropriately:
   - `private` - Internal team events
   - `organization` - Company-wide events
   - `public` - Open community events

---

## Security Considerations

1. **Frontend checks are not enough** - Implement Firebase Security Rules
2. **Validate all role changes** server-side
3. **Log access attempts** for auditing
4. **Expire invite links** after 7 days
5. **Limit admin role** to trusted users only

---

## Next Steps

1. **Implement Firebase Security Rules** to enforce permissions at the database level
2. **Add email notifications** when users are added to events
3. **Create activity log** for role changes
4. **Add organization management** for multi-tenant support
5. **Implement API rate limiting** for invite link generation

---

## Support

For questions or issues with the RBAC system, contact the development team or create an issue in the project repository.

**Key Files:**
- `src/utils/roleConstants.js` - Role and permission definitions
- `src/services/accessControlService.js` - Access control logic
- `src/components/EventSharing/EventSharing.js` - Event sharing UI
- `src/components/Common/ProtectedRoute.js` - Route protection
- `src/components/Account/RoleSelector.js` - Role management UI
