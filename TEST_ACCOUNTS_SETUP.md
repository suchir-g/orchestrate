# Test Accounts Setup Guide

## 🎯 Goal
Set up 3 test accounts with role-based access to events:
- **admin@example.com** - Admin role, can see all events
- **volunteer@example.com** - Volunteer role, can see volunteering events
- **attendee@example.com** (or third account) - Attendee role, can see public events

## 📋 Step-by-Step Setup

### Step 1: Create the Accounts

1. **Open your app** in the browser
2. **Sign up each account:**
   - Click "Account" → Sign in/Sign up
   - Create accounts with emails:
     - admin@example.com (password: yourpassword)
     - volunteer@example.com (password: yourpassword)
     - attendee@example.com (password: yourpassword)

### Step 2: Set User Roles

For each account, after signing in:

#### **admin@example.com - Set as Admin**
1. Sign in as admin@example.com
2. Go to **Account** page
3. In the "Your Role" card:
   - Select **"Administrator"** from dropdown
   - Click **"Update Role"**
4. You'll now see "Administrator" badge with full permissions

#### **volunteer@example.com - Set as Volunteer**
1. Sign in as volunteer@example.com
2. Go to **Account** page
3. In the "Your Role" card:
   - Select **"Volunteer"** from dropdown
   - Click **"Update Role"**
4. You'll now see "Volunteer" badge

#### **attendee@example.com - Keep as Attendee**
1. Sign in as attendee@example.com
2. Go to **Account** page
3. Role should already be **"Attendee"** (default)
4. If not, select it and update

---

### Step 3: Create Shared Events

#### **As admin@example.com:**

1. **Create Event 1: "Tech Conference 2024"**
   - Go to **Events** page
   - Click **"+"** (Floating Action Button)
   - Fill in:
     - Name: Tech Conference 2024
     - Description: Annual technology conference
     - Date: (select a future date)
     - Location: Convention Center
     - Capacity: 500
     - Category: Conference
   - Click **"Create Event"**

2. **Share with volunteer@example.com**
   - Click on the "Tech Conference 2024" event card
   - Click **"Share"** button (in the header)
   - In the sharing dialog:
     - Enter email: volunteer@example.com
     - Select role: **"Volunteer"**
     - Click **"Add Collaborator"**
   - Success! volunteer@example.com can now see this event

3. **Create Event 2: "Summer Music Festival"**
   - Create another event:
     - Name: Summer Music Festival
     - Description: Outdoor music festival
     - Date: (select a future date)
     - Location: Central Park
     - Capacity: 1000
     - Category: Concert
   - Click **"Create Event"**

4. **Share with volunteer@example.com**
   - Click on "Summer Music Festival"
   - Click **"Share"**
   - Add volunteer@example.com as **"Volunteer"**

5. **Create Event 3: "Private Admin Meeting"** (Admin only)
   - Create another event:
     - Name: Private Admin Meeting
     - Description: Internal planning session
     - Date: (select a date)
     - Location: Office Building
     - Capacity: 20
     - Category: Other
   - Click **"Create Event"**
   - **DO NOT share this one** - it stays private
   - Or, click Share → Set visibility to **"Private"** → Close
   - This event will ONLY be visible to admin@example.com

---

### Step 4: Create Public Event (Optional)

#### **As admin@example.com:**

1. **Create Event 4: "Community Meetup"** (Public)
   - Create event:
     - Name: Community Meetup
     - Description: Open to everyone
     - Date: (select a date)
     - Location: Community Center
     - Capacity: 100
     - Category: Other
   - Click **"Create Event"**

2. **Make it Public**
   - Click on "Community Meetup"
   - Click **"Share"**
   - In the "Event Visibility" dropdown:
     - Select **"Public"**
   - Now ALL users (including attendee@example.com) can see this event!

---

## ✅ Expected Results

### When signed in as **admin@example.com**:
✅ Can see ALL 4 events:
- Tech Conference 2024 (Created by you)
- Summer Music Festival (Created by you)
- Private Admin Meeting (Created by you)
- Community Meetup (Created by you - Public)

**Badge**: Red "Administrator" chip
**Permissions**: Full access to everything

---

### When signed in as **volunteer@example.com**:
✅ Can see 3 events:
- Tech Conference 2024 (Volunteering)
- Summer Music Festival (Volunteering)
- Community Meetup (Public event)

❌ **Cannot see**:
- Private Admin Meeting (not shared with them)

**Badge**: Green "Volunteer" chip
**Permissions**: View events, manage volunteer tasks

---

### When signed in as **attendee@example.com**:
✅ Can see 1 event:
- Community Meetup (Public event)

❌ **Cannot see**:
- Tech Conference 2024 (not shared)
- Summer Music Festival (not shared)
- Private Admin Meeting (private)

**Badge**: Gray "Attendee" chip
**Permissions**: View public events only

---

## 🧪 Testing the Setup

### Test 1: Admin Access
1. Sign in as **admin@example.com**
2. Go to **Dashboard** → Should show all 4 events in stats
3. Go to **Events** → Should list all 4 events
4. Click any event → Can edit, share, manage schedule

### Test 2: Volunteer Access
1. Sign in as **volunteer@example.com**
2. Go to **Dashboard** → Should show 3 events in stats
3. Go to **Events** → Should list only 3 events (not Private Admin Meeting)
4. Click "Tech Conference 2024":
   - Should see **"Volunteer"** badge on your profile
   - Can view details but cannot delete event
   - Can see "Share" button (but may not have permission to add others)

### Test 3: Attendee Access
1. Sign in as **attendee@example.com**
2. Go to **Dashboard** → Should show 1 event
3. Go to **Events** → Should list only "Community Meetup"
4. Cannot see private or volunteer events

### Test 4: Share Button Functionality
1. Sign in as **admin@example.com**
2. Go to **Events**
3. Click on any event card → Click **"Share"** button
4. Sharing dialog opens with:
   - Event visibility dropdown
   - Add collaborator form
   - Quick invite links
   - Current collaborators list

### Test 5: Invite Links
1. As **admin@example.com**, open "Tech Conference 2024"
2. Click **"Share"**
3. Click **"Volunteer Link"** button (copies invite link)
4. Open incognito/private browser window
5. Paste the invite link
6. Sign in as a new user
7. Should automatically be added as volunteer to the event!

---

## 🔍 Troubleshooting

### Issue: "Cannot see shared events"
**Solution:**
- Refresh the page (Ctrl+R or Cmd+R)
- Sign out and sign back in
- Check that the event was properly shared (click Share button and verify collaborator is listed)

### Issue: "Share button not visible"
**Solution:**
- Make sure you're on the event detail page or events list
- Check that the EventSharing component is imported correctly
- Clear browser cache and refresh

### Issue: "All users can see all events"
**Solution:**
- Check that event visibility is set to "Private" (not "Public")
- Verify that each user account has the correct role assigned
- Sign out and sign back in to refresh permissions

### Issue: "Changes not reflecting immediately"
**Solution:**
- The system refreshes every 30 seconds for collaborated events
- Force refresh by signing out and back in
- Or wait 30 seconds for automatic refresh

---

## 📊 Quick Reference Table

| Account | Role | Events Visible | Can Create | Can Share |
|---------|------|----------------|------------|-----------|
| admin@example.com | Admin | ALL (4) | ✅ | ✅ |
| volunteer@example.com | Volunteer | 3 | ✅ | Limited |
| attendee@example.com | Attendee | 1 (public) | ✅ | Own events only |

---

## 🎨 Visual Indicators

### Role Badges (in Account page):
- **Admin**: Red chip with shield icon
- **Organizer**: Blue chip with event icon
- **Volunteer**: Green chip with hands icon
- **Sponsor**: Purple chip with gift icon
- **Attendee**: Gray chip with person icon

### Event Access Indicators:
- **Owner**: Can see all buttons (Edit, Share, Delete)
- **Organizer**: Can see Edit and Share buttons
- **Volunteer**: Can view but limited editing
- **Viewer**: Read-only access

---

## 🚀 Advanced: Using Invite Links

### Generate Invite Link:
1. Open event as owner
2. Click "Share"
3. Under "Quick Invite Links", click role type button:
   - **Organizer Link** - Full co-organizer access
   - **Volunteer Link** - Volunteer access
   - **Sponsor Link** - Sponsor access
4. Link is copied to clipboard
5. Share link via email, Slack, etc.

### Accept Invite:
1. Recipient clicks link (e.g., `https://yourapp.com/event/123/join?invite=abc123`)
2. If not signed in, prompted to sign in/sign up
3. Automatically added to event with specified role
4. Redirected to event page

**Note**: Invite links expire in 7 days

---

## 💡 Tips

1. **Sign out between tests** to see the different views
2. **Use different browsers** (Chrome, Firefox, Edge) for testing multiple accounts simultaneously
3. **Check the Console** (F12) for any error messages
4. **Dashboard shows real-time stats** based on accessible events
5. **Activity feed** will show when collaborators are added/removed

---

## ✨ Success Criteria

✅ Admin sees 4 events
✅ Volunteer sees 3 events (2 shared + 1 public)
✅ Attendee sees 1 event (public only)
✅ Share button appears on event pages
✅ Sharing dialog opens and works
✅ Collaborators can be added/removed
✅ Role badges display correctly
✅ Invite links can be generated and work
✅ Event visibility can be changed
✅ Dashboard stats reflect accessible events only

---

## 🎉 You're All Set!

Your RBAC system is now fully functional with:
- ✅ Role-based event access
- ✅ Event sharing with collaborators
- ✅ Invite link system
- ✅ Visibility controls
- ✅ Dynamic dashboard
- ✅ Protected routes

Enjoy your multi-user event management platform! 🚀
