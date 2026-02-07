# Enhanced Messaging System - Complete Guide

## ✅ All Features Implemented!

### What's New

1. **Event Team Display** - See all organizers, volunteers, and sponsors on event pages
2. **Thread-Based Messaging** - Conversations organized in resolvable threads
3. **Recipient Selection** - Message specific people or groups (all organizers, all volunteers, etc.)
4. **Message Center** - Central hub for all messages across all events with unread notifications
5. **Resolve/Reopen Threads** - Mark conversations as resolved when issues are fixed

---

## File Structure

### New Files Created:

```
src/
├── services/
│   ├── enhancedMessagingService.js      # Thread-based messaging backend
│   └── userProfileService.js             # Fetch user profiles for team display
├── components/
│   ├── EventTeam/
│   │   └── EventTeam.js                  # Display team members on event page
│   ├── EventCollaboration/
│   │   └── EnhancedEventCollaboration.js # Advanced messaging with recipients
│   └── MessageCenter/
│       └── MessageCenter.js              # Central message hub with notifications
└── utils/
    └── quickFix.js                       # Helper to fix event ownership issues
```

### Modified Files:

- `src/components/EventDetail/EventDetail.js` - Added EventTeam display and enhanced collaboration
- `src/App.js` - Added `/messages` route for MessageCenter

---

## Features Breakdown

### 1. Event Team Display

**Location:** Event Detail Page (after schedule section)

**What You See:**

- **Organizers Section** (visible to ALL users)
  - All event organizers with names, emails
  - Message button to start a direct conversation
  - "Contact these people for general event inquiries"

- **Volunteers Section** (visible to volunteers, organizers, owners)
  - All volunteers helping with the event
  - Message buttons for each volunteer
  - Hidden from attendees/sponsors for privacy

- **Sponsors Section** (visible to ALL users)
  - All event sponsors
  - Message buttons
  - Public visibility

**How It Works:**
```javascript
// Fetches user profiles for all team members
const { organizers, volunteers, sponsors } = await getEventTeamMembers(event);
```

---

### 2. Enhanced Messaging with Threads

**Key Concepts:**

#### Thread = Conversation
- Each thread has a **subject** (like an email subject line)
- Contains multiple messages back and forth
- Can be **resolved** when issue is fixed
- Can be **reopened** if issue recurs

#### Recipients - Who Can You Message?

**As Attendee/Sponsor:**
- ✅ Specific organizers (select from list)
- ✅ All organizers at once
- ✅ Organizer team (group message)
- ❌ Cannot message volunteers (privacy)

**As Volunteer/Organizer/Owner:**
- ✅ All of the above PLUS:
- ✅ Specific volunteers
- ✅ All volunteers at once
- ✅ Any team member

---

### 3. How to Use the System

#### Step 1: Starting a Message Thread

**From Event Page:**
1. Go to any event you're part of
2. Scroll to "Event Team Members" section
3. Click the message icon (📧) next to anyone's name
4. Or click "Collaborate" button in the header

**Creating a Thread:**
1. Click "New Message Thread"
2. Enter a **subject** (e.g., "Question about catering")
3. Select recipients:
   - **Specific Person(s)** - Choose individuals from checkboxes
   - **All Organizers** - Message all organizers
   - **All Volunteers** - Message all volunteers (if you're organizer/volunteer)
   - **Organizer Team** - Group message to organizers
4. Type your message
5. Click "Create Thread"

**Example Subjects:**
- "Catering setup question"
- "Volunteer shift change request"
- "Sponsorship banner placement"
- "Schedule conflict on Day 2"

#### Step 2: Messaging in a Thread

**Opening a Thread:**
1. Click on any thread in the list
2. See full conversation history
3. All messages from all participants

**Replying:**
1. Type in the message box at bottom
2. Press "Send"
3. Press Enter (without Shift) for quick send
4. Other participants get notified (unread count increases)

**Who Sees Messages:**
- Only the selected recipients
- If you sent to "All Organizers", all organizers see it
- If you sent to specific people, only those people see it

#### Step 3: Resolving Threads

**When to Resolve:**
- Issue is fixed
- Question is answered
- Task is complete
- No further action needed

**Who Can Resolve:**
- Thread creator (person who started it)
- Event organizers
- Event owners

**How to Resolve:**
1. Open the thread
2. Click "Resolve" button (top right)
3. Thread moves to "Resolved" tab
4. No more replies allowed (unless reopened)

**Reopening:**
- Click "Reopen" if issue returns
- Thread moves back to "Open" tab
- Replies enabled again

---

### 4. Message Center

**Access:** `/messages` route or click "Messages" in navbar (when added)

**What You See:**

#### Tabs:
1. **Open Messages** - Active conversations
   - Shows unread badge count
   - Sorted by most recent first
   - Red dot/number indicates unread

2. **Resolved** - Completed conversations
   - Archive of resolved issues
   - Can reopen if needed

#### Thread List View:
```
[Icon with unread badge] Subject
                        Event: Summer Music Festival
                        Started by John Doe
                        Last message 5 minutes ago
```

- **Badge numbers** = Unread messages in that thread
- **Event chip** = Which event it's about
- **Blue highlight** = You have unread messages

#### Thread Conversation View:
- See full message history
- Your messages highlighted differently
- Timestamps for each message
- Reply box at bottom
- Resolve/Reopen buttons at top

---

## User Experience Flow

### Scenario 1: Sponsor Requests Session Addition

1. **Sponsor** (sponsor@example.com):
   - Goes to "Big Conference" event page
   - Clicks "Collaborate" button
   - Clicks "New Message Thread"
   - Subject: "Session Request - AI Workshop"
   - Recipients: "All Organizers"
   - Message: "We'd like to host a 90-minute AI workshop on Day 2. Can we add this to the schedule?"
   - Clicks "Create Thread"

2. **Organizer** (admin@example.com):
   - Sees notification badge in Message Center
   - Opens Message Center
   - Sees new thread with "1" unread
   - Opens thread: "Session Request - AI Workshop"
   - Reads: "Started by sponsor@example.com"
   - Replies: "Great idea! Let's schedule it for 2 PM on Day 2. I'll add it to the schedule now."
   - Later: Clicks "Resolve" to close the thread

3. **Sponsor** sees reply:
   - Message Center shows no unread
   - Can see organizer's response
   - Thread is resolved
   - If needed, can reopen later

---

### Scenario 2: Volunteer Coordination

1. **Organizer** wants to coordinate volunteers:
   - Goes to event page
   - Clicks "Collaborate"
   - Creates thread: "Shift Coverage Needed"
   - Recipients: "All Volunteers"
   - Message: "Need someone to cover registration desk 10-12 PM on Day 1. Who's available?"

2. **All Volunteers** see the message:
   - volunteer1@example.com: "I can do it!"
   - volunteer2@example.com: "I'm busy then, sorry"
   - Thread has back-and-forth discussion

3. **Organizer** resolves:
   - "Thanks volunteer1! You're assigned."
   - Clicks "Resolve"
   - Issue closed

---

### Scenario 3: Direct Question to Specific Organizer

1. **Attendee** has specific question:
   - Sees organizer "Jane Smith" in team list
   - Clicks message icon next to her name
   - Subject: "Parking Information"
   - Recipient: Automatically selected (Jane)
   - Message: "Where can I park on Day 1?"

2. **Jane** replies:
   - Sees thread in Message Center
   - "Parking lot A is reserved for attendees"
   - Resolves thread

---

## Firestore Schema

### Collections Created:

#### `messageThreads`
```javascript
{
  eventId: "event123",
  subject: "Session Request",
  createdBy: "user456",
  createdByName: "John Doe",
  createdByRole: "sponsor",
  recipients: ["user789", "user101"],  // Array of user IDs
  recipientType: "all_organizers",     // or "specific_user"
  status: "open",                       // or "resolved"
  unreadCount: {
    "user789": 2,   // user789 has 2 unread
    "user101": 0    // user101 has 0 unread
  },
  lastMessageAt: Timestamp,
  createdAt: Timestamp,
  resolvedBy: "user789",
  resolvedByName: "Admin User",
  resolvedAt: Timestamp
}
```

#### `threadMessages`
```javascript
{
  threadId: "thread123",
  senderId: "user456",
  senderName: "John Doe",
  content: "Message text here",
  createdAt: Timestamp,
  isRead: false
}
```

---

## API Reference

### `enhancedMessagingService.js`

**Create Thread:**
```javascript
const { threadId, error } = await createMessageThread(
  eventId,
  "Subject line",
  userId,
  userName,
  userEventRole,
  ["recipientId1", "recipientId2"],  // or single recipient
  RECIPIENT_TYPES.SPECIFIC_USER
);
```

**Send Message:**
```javascript
const { messageId, error } = await sendThreadMessage(
  threadId,
  userId,
  userName,
  "Message content"
);
```

**Get Threads:**
```javascript
// All threads for user
const { data } = await getUserThreads(userId);

// Threads for specific event
const { data } = await getEventThreads(eventId, userId);
```

**Resolve/Reopen:**
```javascript
await resolveThread(threadId, userId, userName);
await reopenThread(threadId);
```

**Mark as Read:**
```javascript
await markThreadAsRead(threadId, userId);
```

**Real-time Listening:**
```javascript
// Listen to all user threads
const unsubscribe = listenToUserThreads(userId, (threads) => {
  setThreads(threads);
});

// Listen to messages in a thread
const unsubscribe = listenToThreadMessages(threadId, (messages) => {
  setMessages(messages);
});

// Cleanup
return () => unsubscribe();
```

---

## Testing Guide

### Test 1: Team Display

1. Run migration: `await window.runMigrations()`
2. Sign in as admin@example.com
3. Go to any event
4. Scroll down to see:
   - ✅ "Event Organizers" section with your profile
   - ✅ Message icon next to your name
   - ✅ Volunteers section (if any volunteers added)

### Test 2: Message Thread Creation

1. **As Sponsor** (sponsor@example.com):
   - Go to event
   - Click "Collaborate"
   - Click "New Message Thread"
   - Subject: "Test Message"
   - Recipients: Select "All Organizers"
   - Message: "This is a test"
   - ✅ Thread created successfully

2. **As Admin** (admin@example.com):
   - Go to `/messages`
   - ✅ See thread with badge "1" (unread)
   - Click thread
   - ✅ See sponsor's message
   - Reply: "Got it!"
   - ✅ Badge disappears (marked as read)

3. **As Sponsor**:
   - Refresh Message Center
   - ✅ See admin's reply
   - ✅ Badge shows "1" for new message

### Test 3: Resolve Thread

1. Admin opens thread
2. Clicks "Resolve"
3. ✅ Thread moves to "Resolved" tab
4. ✅ Reply box disabled
5. Clicks "Reopen"
6. ✅ Thread moves back to "Open"
7. ✅ Can reply again

### Test 4: Recipient Selection

**As Attendee:**
- ✅ Can select "All Organizers"
- ✅ Can select "Specific Person" (organizers only)
- ❌ Cannot select "All Volunteers" (option hidden)

**As Volunteer:**
- ✅ Can select "All Organizers"
- ✅ Can select "All Volunteers"
- ✅ Can select any specific person (organizers + volunteers)

**As Organizer:**
- ✅ All options available
- ✅ Can message anyone

---

## Troubleshooting

### Issue: "No team members showing"

**Solution:**
1. Run migration: `await window.runMigrations()`
2. Ensure event has RBAC fields (organizers, volunteers, sponsors arrays)
3. Check Firebase console - event document should have these fields

### Issue: "Can't create thread"

**Checks:**
- Are you signed in?
- Did you enter a subject?
- Did you select at least one recipient (for specific person mode)?
- Check browser console for errors

### Issue: "Messages not updating in real-time"

**Solution:**
- Check internet connection
- Firebase real-time listeners may need reconnection
- Refresh the page
- Sign out and back in

### Issue: "Collaborators can't see event"

**Solution:**
1. Run migration to add RBAC fields
2. Verify they're added to event via Share dialog
3. Check event's `organizers`, `volunteers`, or `sponsors` arrays include their user ID
4. They need to refresh page after being added

---

## Next Steps (Optional Enhancements)

### 1. Navbar Badge
Add unread count to navbar:
```javascript
// In Navbar component
const [unreadCount, setUnreadCount] = useState(0);

useEffect(() => {
  const loadUnread = async () => {
    const count = await getUnreadThreadCount(user.uid);
    setUnreadCount(count);
  };
  loadUnread();
}, [user]);

<Badge badgeContent={unreadCount} color="error">
  <MessageIcon />
</Badge>
```

### 2. Email Notifications
Send emails when:
- New thread created
- New message in thread you're part of
- Thread resolved

### 3. Attach Files
Allow attaching images/documents to messages

### 4. @Mentions
Tag specific people in group threads
`@JohnDoe can you handle this?`

### 5. Thread Categories
Label threads: "Question", "Issue", "Request", "Discussion"

---

## Summary

### ✅ Collaborators See Events
- Events fetched based on `organizers`, `volunteers`, `sponsors` arrays
- Run migration to add these fields to old events

### ✅ Team Display on Event Page
- All organizers shown to everyone
- Volunteers shown to volunteers/organizers/owners
- Direct message buttons for each person

### ✅ Thread-Based Messaging
- Conversations organized by subject
- Resolve/reopen functionality
- Real-time updates

### ✅ Recipient Selection
- Message specific people or groups
- Role-based access (attendees can't message volunteers)
- "All Organizers", "All Volunteers", etc.

### ✅ Message Center
- Central hub at `/messages`
- Shows all threads across all events
- Unread badges and notifications
- Open vs Resolved tabs

---

## Quick Start Checklist

1. ✅ Run migration: `await window.runMigrations()`
2. ✅ Add collaborators to events via Share dialog
3. ✅ Go to event page, see team members
4. ✅ Click "Collaborate" to start messaging
5. ✅ Visit `/messages` to see all threads
6. ✅ Test with multiple accounts (admin, volunteer, sponsor)

**You're all set!** 🎉

The enhanced messaging system is fully functional and ready to use!
