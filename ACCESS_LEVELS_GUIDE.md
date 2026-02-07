# User Access Levels Implementation Guide

## Overview

This document provides a comprehensive guide to the user access levels system implemented in the Orchestrate project. The system uses Role-Based Access Control (RBAC) to manage permissions for different user types.

## User Roles

### 1. **Admin** 👨‍💼
**Full event management access**

**Capabilities:**
- ✅ Create, edit, and delete schedule blocks
- ✅ Manage all volunteers and their assignments
- ✅ View and manage all deliverables
- ✅ Communicate with sponsors and contractors
- ✅ Manage accommodations and room assignments
- ✅ Plan food services
- ✅ Manage infrastructure (WiFi, equipment, power)
- ✅ View analytics and generate predictions
- ✅ Manage user roles and permissions

**Components:**
- `/admin/:eventId/roles` - User role management dashboard

---

### 2. **Volunteer** 👥
**Event volunteer with specific responsibilities**

**Capabilities:**
- ✅ View full event timetable
- ✅ View personal task assignments and schedule
- ✅ Mark tasks as completed
- ✅ Update availability status
- ✅ Check-in/out from assignments

**Restrictions:**
- ❌ Cannot modify timetable
- ❌ Cannot see other volunteers' assignments in detail
- ❌ Cannot access sponsor information
- ❌ Cannot manage events

**Components:**
- Schedule view (read-only)
- Personal assignment dashboard

---

### 3. **Sponsor** 💼
**Companies/sponsors providing items or services**

**Capabilities:**
- ✅ View full event timetable
- ✅ Request to contribute items (with conflict prevention)
- ✅ Request volunteers for specific tasks
- ✅ Track status of requests
- ✅ View what other sponsors are providing
- ✅ Communicate with organizers

**Restrictions:**
- ❌ Cannot modify schedule
- ❌ Cannot see volunteer assignments
- ❌ Cannot manage accommodations or food service

**Components:**
- `/sponsor/:eventId` - Sponsor dashboard
- Item request form with validation
- Volunteer request form with time slot checking
- Request status tracker

---

### 4. **Attendee** 👤
**Event participants/guests**

**Capabilities:**
- ✅ View **FINALIZED** timetable only
- ✅ Register for sessions
- ✅ View event general information
- ✅ Receive event notifications

**Restrictions:**
- ❌ Cannot view draft or in-progress schedule
- ❌ Cannot see volunteer assignments
- ❌ Cannot access any admin features
- ❌ Cannot request volunteers or items

**Components:**
- Schedule view (read-only, finalized blocks only)
- Session registration

---

## Technical Implementation

### 1. Authorization Service
**File:** `src/services/authorizationService.js`

Core functions for permission management:

```javascript
// Check if user has permission
checkPermission(userRole, resource, action)

// Get user's role for an event
getUserRole(userId, eventId)

// Assign role to user
assignUserRole(userId, role, eventId, adminId)

// Remove role from user
removeUserRole(userId, role, eventId)

// Validate sponsor item requests
validateSponsorItemRequest(newItem, existingItems)

// Validate volunteer requests
validateVolunteerRequest(request, existingRequests)

// Filter data based on role
filterScheduleByRole(blocks, userRole)
filterDeliverablesByRole(items, userRole)
filterVolunteersByRole(volunteers, userRole, userId)
```

### 2. Enhanced Authentication Context
**File:** `src/context/AuthContext.js`

Extended with role management:

```javascript
// Get user's role for a specific event
getUserRoleForEvent(eventId) -> string | null

// Check permission for a resource
hasPermission(eventId, resource, action) -> boolean

// Check if user has any of the permissions
hasAnyPermission(eventId, permissions) -> boolean

// Check if user has all permissions
hasAllPermissions(eventId, permissions) -> boolean

// Assign role to user (admin only)
assignRoleToUser(userId, role, eventId) -> {error}

// Remove role from user (admin only)
removeRoleFromUser(userId, role, eventId) -> {error}
```

### 3. Protected Route Component
**File:** `src/components/Common/ProtectedRoute.js`

Higher-order component to protect routes:

```javascript
<ProtectedRoute 
  requiredRole="admin" 
  eventId={eventId}
  requiredPermissions={['schedule:write']}
>
  <ScheduleBuilder />
</ProtectedRoute>
```

Additional wrapper components:

```javascript
// Hide content if user lacks role
<RequireRole role="sponsor" eventId={eventId}>
  <SponsorSpecificContent />
</RequireRole>

// Hide content if user lacks permission
<RequirePermission permission="schedule:write" eventId={eventId}>
  <EditButton />
</RequirePermission>
```

### 4. Database Schema

#### Users Collection
```javascript
{
  id: string,
  email: string,
  displayName: string,
  photoURL: string,
  walletAddress: string,
  roles: [
    {
      role: string,           // admin, volunteer, sponsor, attendee
      eventId: string,
      assignedAt: timestamp,
      assignedBy: string
    }
  ],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Sponsor Requests Collection
```javascript
{
  id: auto,
  eventId: string,
  sponsorId: string,
  type: string,             // volunteer_request, item_request
  
  itemRequest: {
    itemName: string,
    category: string,
    quantity: number,
    unit: string,
    description: string,
    conflictingItems: [string]
  },
  
  volunteerRequest: {
    taskType: string,
    requiredCount: number,
    skillsRequired: [string],
    timeSlot: {
      date: timestamp,
      startTime: string,
      endTime: string
    },
    location: string,
    description: string
  },
  
  status: string,           // pending, approved, rejected, fulfilled
  approvedBy: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Provided Items Collection
```javascript
{
  id: auto,
  eventId: string,
  sponsorId: string,        // null if provided by organizer
  itemName: string,
  category: string,
  quantity: number,
  unit: string,
  description: string,
  deliveryDate: timestamp,
  deliveryLocation: string,
  status: string,           // pending, delivered, deployed, used, returned
  relatedScheduleBlocks: [string],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## Usage Examples

### 1. Checking Permissions in Components

```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { hasPermission, userRoles } = useAuth();
  const eventId = 'event123';
  
  // Check single permission
  if (hasPermission(eventId, 'schedule', 'write')) {
    // Show edit button
  }
  
  // Check multiple permissions (AND logic)
  if (useAuth().hasAllPermissions(eventId, ['schedule:read', 'volunteers:write'])) {
    // Show advanced controls
  }
  
  // Get user's role
  const role = userRoles[eventId];
  if (role === 'admin') {
    // Show admin panel
  }
}
```

### 2. Protecting Routes

```javascript
// In App.js
<Route path="/sponsor/:eventId" element={
  <ProtectedRoute requiredRole="sponsor" eventId={null}>
    <SponsorDashboard />
  </ProtectedRoute>
} />
```

### 3. Conditionally Rendering Content

```javascript
import { RequireRole, RequirePermission } from '../components/Common/ProtectedRoute';

function Dashboard() {
  return (
    <>
      {/* Only show to admins */}
      <RequireRole role="admin" eventId="event123">
        <AdminPanel />
      </RequireRole>
      
      {/* Only show to users with write permission */}
      <RequirePermission permission="schedule:write" eventId="event123">
        <ScheduleEditButton />
      </RequirePermission>
    </>
  );
}
```

### 4. Validating Sponsor Requests

```javascript
import * as authService from '../services/authorizationService';

// Validate item request for conflicts
const validation = authService.validateSponsorItemRequest(
  {
    itemName: 'Vegetarian Pizza',
    category: 'food',
    quantity: 20,
    unit: 'boxes'
  },
  existingItems // array of current items
);

if (!validation.isValid) {
  // Show conflicts to user
  validation.conflicts.forEach(conflict => {
    console.warn(conflict.message);
  });
}
```

---

## Permission Matrix

| Resource | Admin | Volunteer | Sponsor | Attendee |
|----------|-------|-----------|---------|----------|
| Schedule | read/write | read | read | read* |
| Volunteers | read/write | read (own) | write (request) | none |
| Deliverables | read/write | none | read/write | none |
| Sponsors | read/write | none | write (own) | none |
| Accommodations | read/write | none | none | none |
| Food Service | read/write | none | none | none |
| Infrastructure | read/write | none | none | none |
| Analytics | read | none | none | none |
| User Management | write | none | none | none |

*Attendees can only see finalized schedule blocks

---

## Conflict Prevention System

### Item Request Conflicts

When a sponsor requests to contribute an item, the system checks for:

1. **Duplicate Items**: Same item already provided by another sponsor
2. **Category Overlap**: Similar items in same category for overlapping time slots
3. **Location Conflicts**: Item delivery conflicts with existing items

### Volunteer Request Conflicts

When a sponsor requests volunteers, the system checks for:

1. **Time Slot Conflicts**: Existing requests for the same time
2. **Location Conflicts**: Multiple requests for same location in pending status
3. **Resource Conflicts**: Insufficient available volunteers

---

## Implementation Checklist

- [x] Create authorization service with permission checking
- [x] Update AuthContext with role management
- [x] Create ProtectedRoute component
- [x] Create Sponsor Dashboard and forms
- [x] Create Admin user management
- [x] Update ScheduleBuilder with permission checks
- [ ] Update Dashboard to show role-specific content
- [ ] Create Volunteer assignment dashboard
- [ ] Implement Firestore collection updates
- [ ] Add role assignment endpoints
- [ ] Add sponsor request approval workflow
- [ ] Add audit logging for role changes
- [ ] Add email notifications for role changes
- [ ] Add role-based navigation in Navbar

---

## Future Enhancements

1. **Hierarchical Roles**: Support for role inheritance
2. **Custom Permissions**: Allow admins to create custom permission sets
3. **Time-Based Access**: Roles that expire after event
4. **Team Roles**: Multiple admins with specialized permissions
5. **Activity Audit Log**: Track all permission-based actions
6. **Role Change Notifications**: Email notifications when roles are assigned/removed
7. **Request Approval Workflow**: Multi-step approval for sponsor requests
8. **Permission Templates**: Pre-built permission sets for common scenarios

---

## Support

For questions or issues with the access control system, refer to:
- IMPLEMENTATION_PLAN.md - Access Levels section
- Codebase comments in authorizationService.js
- Component documentation in individual files
