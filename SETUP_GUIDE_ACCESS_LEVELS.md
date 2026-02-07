# Access Levels System - Developer Setup Guide

## Quick Start

The access levels system has been fully implemented across the project. This guide will help you understand how to use it.

---

## 1. Understanding the System

### Four User Roles

```
┌──────────────────────────────────────────────────────────┐
│                    User Roles                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ADMIN (👨‍💼)         - Full management access            │
│  VOLUNTEER (👥)     - Can see & manage own tasks         │
│  SPONSOR (💼)       - Can request items & volunteers    │
│  ATTENDEE (👤)      - Can see finalized schedule only   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Key Components & How to Use Them

### AuthContext
Located: `src/context/AuthContext.js`

```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { 
    user,                      // Current user object
    userProfile,               // User profile data
    userRoles,                 // { eventId: role } mapping
    hasPermission,             // (eventId, resource, action) -> bool
    hasAllPermissions,         // (eventId, permissions[]) -> bool
    hasAnyPermission,          // (eventId, permissions[]) -> bool
    getUserRoleForEvent,       // (eventId) -> role
    assignRoleToUser,          // (userId, role, eventId) -> Promise
    removeRoleFromUser         // (userId, role, eventId) -> Promise
  } = useAuth();
}
```

### Authorization Service
Located: `src/services/authorizationService.js`

```javascript
import * as authService from '../services/authorizationService';

// Check permission
authService.checkPermission('admin', 'schedule', 'write'); // true

// Get role permissions
const perms = authService.getRolePermissions('sponsor');
// { schedule: 'read', volunteers: 'write', deliverables: 'read', ... }

// Validate item request for conflicts
const validation = authService.validateSponsorItemRequest(
  newItem,
  existingItems
);
if (!validation.isValid) {
  console.log(validation.conflicts); // Array of conflict objects
}

// Validate volunteer request
const validation = authService.validateVolunteerRequest(
  request,
  existingRequests
);
```

### ProtectedRoute Component
Located: `src/components/Common/ProtectedRoute.js`

```javascript
import { ProtectedRoute, RequireRole, RequirePermission } from '../components/Common/ProtectedRoute';

// Protect an entire route
<Route path="/admin/:eventId" element={
  <ProtectedRoute requiredRole="admin" eventId={eventId}>
    <AdminPanel />
  </ProtectedRoute>
} />

// Show content only to specific role
<RequireRole role="sponsor" eventId={eventId}>
  <SponsorOnlyWidget />
</RequireRole>

// Show content only with specific permission
<RequirePermission permission="schedule:write" eventId={eventId}>
  <ScheduleEditButton />
</RequirePermission>
```

---

## 3. Adding Permission Checks to Components

### Example 1: Conditional Button Rendering
```javascript
import { useAuth } from '../context/AuthContext';

function ScheduleControls({ eventId }) {
  const { hasPermission } = useAuth();
  
  const canEdit = hasPermission(eventId, 'schedule', 'write');
  
  return (
    <>
      {canEdit && (
        <Button 
          onClick={handleEdit}
          variant="contained"
        >
          Edit Schedule
        </Button>
      )}
    </>
  );
}
```

### Example 2: Role-Based Component
```javascript
import { useAuth } from '../context/AuthContext';

function Dashboard({ eventId }) {
  const { userRoles } = useAuth();
  
  const userRole = userRoles[eventId];
  
  if (userRole === 'admin') {
    return <AdminDashboard eventId={eventId} />;
  } else if (userRole === 'volunteer') {
    return <VolunteerDashboard eventId={eventId} />;
  } else if (userRole === 'sponsor') {
    return <SponsorDashboard eventId={eventId} />;
  } else {
    return <AttendeeDashboard eventId={eventId} />;
  }
}
```

### Example 3: Data Filtering
```javascript
import * as authService from '../services/authorizationService';
import { useAuth } from '../context/AuthContext';

function ScheduleView({ eventId, scheduleBlocks }) {
  const { userRoles } = useAuth();
  
  const userRole = userRoles[eventId];
  
  // Filter schedule based on role
  const filteredSchedule = authService.filterScheduleByRole(
    scheduleBlocks,
    userRole
  );
  
  return (
    <div>
      {filteredSchedule.map(block => (
        <ScheduleBlock key={block.id} block={block} />
      ))}
    </div>
  );
}
```

---

## 4. Current Implementation Status

### ✅ Completed
- [x] Authorization service with full permission logic
- [x] AuthContext enhancement with role management
- [x] ProtectedRoute component with role checking
- [x] Sponsor Dashboard and forms
- [x] Admin User Management
- [x] ScheduleBuilder updated with permissions
- [x] App.js routes protected
- [x] Comprehensive documentation

### 🔄 Ready for Next Phase
- [ ] Firestore Collections setup
- [ ] Backend role validation
- [ ] Email notifications for role changes
- [ ] Role assignment workflow UI
- [ ] Volunteer assignment dashboard
- [ ] Request approval workflow

---

## 5. Common Tasks

### Assigning a Role to a User
```javascript
import { useAuth } from '../context/AuthContext';

function RoleAssignmentForm({ userId, eventId }) {
  const { assignRoleToUser } = useAuth();
  
  const handleAssignRole = async () => {
    const result = await assignRoleToUser(
      userId,
      'sponsor',
      eventId
    );
    
    if (result.error) {
      console.error('Error:', result.error);
    } else {
      console.log('Role assigned successfully!');
    }
  };
}
```

### Checking Multiple Permissions
```javascript
import { useAuth } from '../context/AuthContext';

function SensitiveComponent({ eventId }) {
  const { hasAllPermissions, hasAnyPermission } = useAuth();
  
  // Check ALL permissions required
  const canManageEvent = hasAllPermissions(eventId, [
    'schedule:write',
    'volunteers:write',
    'userManagement:write'
  ]);
  
  // Check ANY permission
  const canViewData = hasAnyPermission(eventId, [
    'schedule:read',
    'analytics:read',
    'deliverables:read'
  ]);
  
  return (
    <>
      {canManageEvent && <EventManager />}
      {canViewData && <DataViewer />}
    </>
  );
}
```

### Validating Sponsor Requests
```javascript
import * as authService from '../services/authorizationService';

function ItemRequestForm() {
  const [conflicts, setConflicts] = useState([]);
  
  const handleSubmit = async (itemData) => {
    // Get existing items from database
    const existingItems = await fetchProvidedItems();
    
    // Validate new request
    const validation = authService.validateSponsorItemRequest(
      itemData,
      existingItems
    );
    
    if (!validation.isValid) {
      setConflicts(validation.conflicts);
      // Show warnings to user
      return;
    }
    
    // Proceed with submission
    submitRequest(itemData);
  };
}
```

---

## 6. Permission Matrix Quick Reference

| Resource | Admin | Volunteer | Sponsor | Attendee |
|----------|:-----:|:---------:|:-------:|:--------:|
| Schedule | R/W | R | R | R* |
| Volunteers | R/W | R(own) | W(req) | - |
| Deliverables | R/W | - | R/W | - |
| Sponsors | R/W | - | W(own) | - |
| Admin Panel | R/W | - | - | - |
| Analytics | R | - | - | - |

**Legend:** R = Read, W = Write, R(own) = Read own only, W(req) = Write requests only, R* = Read finalized only, - = No access

---

## 7. File Structure

```
src/
├── context/
│   └── AuthContext.js              (Enhanced with roles)
├── services/
│   └── authorizationService.js     (Permission logic)
├── components/
│   ├── Common/
│   │   └── ProtectedRoute.js       (Route protection)
│   ├── Sponsor/                    (NEW)
│   │   ├── SponsorDashboard.js
│   │   ├── ItemRequestForm.js
│   │   ├── VolunteerRequestForm.js
│   │   └── RequestStatusTracker.js
│   ├── Admin/
│   │   └── RoleManagement/         (NEW)
│   │       └── UserManagement.js
│   └── Scheduling/
│       └── ScheduleBuilder.js      (Updated with permissions)
└── App.js                           (Updated routes)

Documentation/
├── IMPLEMENTATION_PLAN.md           (Updated with access levels section)
├── ACCESS_LEVELS_GUIDE.md           (Comprehensive guide)
├── ACCESS_LEVELS_IMPLEMENTATION.md  (Summary of changes)
└── SETUP_GUIDE.md                   (This file)
```

---

## 8. Testing the Implementation

### Manual Testing Steps

1. **Test Admin Access**
   - Log in as admin
   - Navigate to `/schedule/:eventId`
   - Verify you can add/edit/delete schedule blocks

2. **Test Volunteer Access**
   - Log in as volunteer
   - Navigate to `/schedule/:eventId`
   - Verify you see read-only schedule and alert banner
   - Verify add/edit/delete buttons are hidden

3. **Test Sponsor Access**
   - Log in as sponsor
   - Navigate to `/sponsor/:eventId`
   - Verify dashboard loads with stats
   - Try submitting an item request
   - Test conflict validation

4. **Test Attendee Access**
   - Log in as attendee
   - Navigate to `/schedule/:eventId`
   - Should see only finalized blocks
   - Cannot edit anything

5. **Test Route Protection**
   - Try accessing `/sponsor/:eventId` as non-sponsor
   - Should be redirected or shown access denied

---

## 9. Troubleshooting

### Issue: "userRole is undefined"
**Solution:** Make sure you're passing `eventId` correctly and user has a role assigned for that event.

```javascript
const userRole = userRoles[eventId]; // eventId must be a valid string
```

### Issue: Routes not protecting correctly
**Solution:** Check that ProtectedRoute component receives `requiredRole` prop.

```javascript
// WRONG
<ProtectedRoute>
  <AdminPanel />
</ProtectedRoute>

// CORRECT
<ProtectedRoute requiredRole="admin" eventId={eventId}>
  <AdminPanel />
</ProtectedRoute>
```

### Issue: Permissions not working
**Solution:** Ensure you're using the correct resource and action names.

```javascript
// Available resources: schedule, volunteers, deliverables, sponsors, accommodations, 
// foodService, infrastructure, analytics, userManagement
// Available actions: 'read', 'write'

hasPermission(eventId, 'schedule', 'write') // ✓ Correct
hasPermission(eventId, 'edit_schedule', 'modify') // ✗ Wrong
```

---

## 10. Next Steps

### For Frontend Development
1. Update Navbar to show role-based navigation
2. Create volunteer assignment dashboard
3. Enhance sponsor forms with more validation
4. Add role change notifications

### For Backend Integration
1. Create Firestore security rules for role-based access
2. Implement role assignment endpoints
3. Add audit logging for all role changes
4. Set up email notifications

### For Testing
1. Write unit tests for authorization service
2. Create integration tests for role workflows
3. Set up E2E tests for protected routes

---

## 11. Support & Resources

- **Full Documentation:** See `ACCESS_LEVELS_GUIDE.md`
- **Implementation Details:** See `ACCESS_LEVELS_IMPLEMENTATION.md`
- **Planning:** See `IMPLEMENTATION_PLAN.md` - "User Access Levels & Permissions" section
- **Code Comments:** Check inline comments in `authorizationService.js`

---

## 12. API Reference

### useAuth() Hook

```javascript
const {
  user,                           // Firebase user object
  userProfile,                    // User Firestore document
  loading,                        // Auth loading state
  userRoles,                      // { eventId: role } mapping
  
  // Permission checking
  hasPermission(eventId, resource, action),      // Single permission
  hasAllPermissions(eventId, permissions[]),     // All required
  hasAnyPermission(eventId, permissions[]),      // Any of these
  getUserRoleForEvent(eventId),                  // Get user's role
  
  // Role management (admin only)
  assignRoleToUser(userId, role, eventId),      // Assign role
  removeRoleFromUser(userId, role, eventId),    // Remove role
  
  // Auth methods
  signInGoogle(),
  signInEmail(email, password),
  signUpEmail(email, password, displayName),
  logout(),
  updateProfile(updates),
  
  // Wallet (blockchain features)
  walletAddress,
  isWalletConnected,
  connectWallet(),
  disconnectWallet()
} = useAuth();
```

---

You're all set! The access levels system is ready to use. Happy coding! 🚀
