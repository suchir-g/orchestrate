# Messaging System Debug Guide

## What Was Fixed

The messaging system now includes:

1. **Enhanced Legacy Message Support** - The system can now load older event messages from the `eventMessages` collection and display them alongside new thread-based messages.

2. **Fallback Query Logic** - If the legacy messages query fails with an `eventId` filter (due to missing index or field), the system automatically falls back to loading all eventMessages and filtering client-side.

3. **Comprehensive Logging** - The browser console now logs detailed information about:
   - Which threads are being loaded
   - How many legacy messages were found
   - Any errors encountered
   - Message listener setup and updates

4. **Better UI Feedback** - The collaboration dialog now shows:
   - Loading state for messages
   - Clear indication when a conversation has no messages
   - Information about legacy conversations

## How to Debug Messages Not Loading

### Step 1: Open Browser Developer Console
- **Chrome/Safari**: Press `Cmd + Option + J` (Mac) or `Ctrl + Shift + J` (Windows)
- **Firefox**: Press `Cmd + Option + K` (Mac) or `Ctrl + Shift + K` (Windows)
- Look for the **Console** tab

### Step 2: Look for Messaging Logs

When you open an event's messaging panel, you should see logs like:

```
✅ Loaded 3 new messageThreads for event abc123
📬 Loaded 2 legacy eventMessages for event abc123
📨 Emitting 5 total threads
🎯 Setting up message listener for thread: thread-xyz
💬 Listening to threadMessages for thread: thread-xyz
✅ Got 4 messages for thread thread-xyz
```

### Step 3: Check for Errors

Look for lines starting with **❌** that indicate actual errors:

**Error: "Both legacy queries failed"**
- This means the system cannot read the `eventMessages` collection
- **Solution**: Check Firestore security rules - they may prevent reads
- **Action**: Contact admin to verify Firestore rules allow reading `eventMessages`

**Error: "Error listening to thread messages"**
- The real-time listener for a specific thread failed
- **Solution**: Check the thread ID is valid
- **Action**: Try refreshing the page

**Error: "Legacy query with eventId filter failed"**
- This is **WARNING** level (not fatal) - the system will automatically retry with fallback
- Should see follow-up logs showing fallback succeeded
- This is expected if `eventMessages` collection lacks an `eventId` index

### Step 4: Verify Thread is Loading

When you click on a thread, you should see:

```
🎯 Setting up message listener for thread: legacy-doc123
📬 Listening to legacy eventMessages doc: doc123
✅ Got legacy message doc, content length: 156
📨 Emitting 1 legacy messages
```

If you see:
```
⚠️ Legacy doc doc123 does not exist
```

The document wasn't found in Firestore. Check:
1. Event ID is correct
2. The legacy message document exists in `eventMessages` collection
3. Your user has permission to read that document

### Step 5: Check Thread Count

The number of threads should be > 0. If you see:
```
📊 getEventThreads: 0 total threads
```

It means:
1. There are no `messageThreads` for this event
2. The legacy `eventMessages` query didn't return any results
3. **Action**: Try creating a new thread to see if it works

## Common Issues & Solutions

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **No previous messages show** | Threads list is empty or threads show no messages | Check browser console for ❌ errors; verify Firestore security rules allow reads |
| **Only new messages appear** | Legacy messages don't load but new ones do | Legacy query is failing; check Firestore has `eventMessages` collection |
| **Messages disappear after reload** | Messages visible initially then gone | Real-time listener may have disconnected; refresh page or reopen conversation |
| **Thread list doesn't update** | New threads don't appear without page refresh | Real-time thread listener setup failed; check network connection |
| **Firestore index error in console** | Index error when querying threads | Create Firestore composite index for `messageThreads`: `recipients (Arrays), lastMessageAt (Descending)` |

## Firestore Collections Reference

### messageThreads Collection
```javascript
{
  id: "unique-id",
  eventId: "event-123",
  subject: "Discussion topic",
  createdBy: "user-id",
  createdByName: "User Name",
  recipients: ["user-id-1", "user-id-2"],  // Must be array for queries to work
  status: "open" or "resolved",
  unreadCount: { "user-id": 2 },
  lastMessageAt: Timestamp,
  createdAt: Timestamp
}
```

### threadMessages Collection
```javascript
{
  id: "unique-id",
  threadId: "thread-id",
  senderId: "user-id",
  senderName: "User Name",
  content: "Message text",
  createdAt: Timestamp,
  isRead: false
}
```

### eventMessages Collection (Legacy)
```javascript
{
  id: "unique-id",
  eventId: "event-123",          // May be missing or stored differently
  userId: "user-id",
  userName: "User Name",
  content: "Message text",
  message: "Alternative field",  // Some docs may use this instead of content
  createdAt: Timestamp or String or Number,
  responses: [
    { userId: "...", userName: "...", content: "...", createdAt: ... }
  ]
}
```

## Performance Tips

1. **Limit Threads Per Event**: Too many threads can slow down loading. Archive old conversations.
2. **Optimize Message Count**: Very long message histories may cause UI lag. Consider pagination in future.
3. **Check Network Tab**: If loading is slow, open DevTools Network tab to see Firestore query times.

## Enabling Detailed Logs

To get even more detailed logging, run this in the console:

```javascript
localStorage.setItem('DEBUG_MESSAGING', 'true');
location.reload();
```

Then repeat your steps. **Note**: This feature isn't implemented yet but can be added if needed.

## Report Issues

When reporting a messaging issue, include:

1. **Browser Console Logs** - Copy the ❌ error messages
2. **Event ID** - Which event were you viewing?
3. **Expected Behavior** - What messages should have appeared?
4. **Actual Behavior** - What did you see instead?
5. **Steps to Reproduce** - Exact steps to see the issue

Example issue report:
```
Event: event-abc123
Expected: See 5 previous messages in thread
Actual: Thread shows no messages
Console Error: "Error listening to legacy doc doc456: Permission denied"
Steps:
1. Open Events
2. Click on "Annual Gala"
3. Click "Logistics" messaging
4. Click on thread titled "Setup Discussion"
5. No messages appear
```

---

**Last Updated**: February 7, 2026
**System**: Orchestrate Event Management Platform
