# Orchestrate - Complete Implementation Plan

## Project Status

### ✅ Completed Features
- Event tracking and management
- Order and shipment tracking
- Timeline with calendar and project views
- Blockchain ticket management (NFT tickets)
- AI-powered analytics and predictions
- **Account system with authentication** (Google OAuth, Email/Password)
- **Account-scoped wallet management** (MetaMask integration)
- Real-time Firebase Firestore integration
- Glassmorphic dark theme UI

---

## Phase 1: Hackathon Scheduling System 🎯

**Goal:** Multi-day hour-by-hour event scheduling with parallel tracks

### Database Schema

#### New Collection: `scheduleBlocks`
```javascript
{
  id: auto,
  eventId: string,
  day: number,              // 1, 2, 3 for multi-day
  date: timestamp,
  startTime: string,        // "09:00"
  endTime: string,          // "10:30"
  title: string,
  type: string,             // workshop, session, keynote, break, meal
  description: string,
  location: string,
  track: string,            // for parallel sessions (Track A, Track B, etc.)
  speakers: [{name, title, bio, photoURL}],
  capacity: number,
  registered: number,
  attended: number,
  requiresRegistration: boolean,
  status: string,           // scheduled, in_progress, completed, cancelled
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Updates to `events` Collection
```javascript
{
  // ADD THESE FIELDS:
  startDate: timestamp,     // replaces single 'date'
  endDate: timestamp,
  durationDays: number,     // calculated or manual
  timezone: string,
  isHackathon: boolean,     // flag for hackathon-specific features
  scheduleConfig: {
    earliestStartTime: string,  // "08:00"
    latestEndTime: string,      // "22:00"
    defaultSlotDuration: number, // 30 minutes
    parallelTracks: number,     // how many parallel sessions
    trackNames: [string]        // ["Main Stage", "Workshop A", "Workshop B"]
  }
}
```

### Files to Create

1. **`src/services/scheduleService.js`**
```javascript
- createScheduleBlock(eventId, blockData)
- getScheduleBlock(blockId)
- getAllScheduleBlocks(eventId)
- getScheduleBlocksByDay(eventId, day)
- updateScheduleBlock(blockId, data)
- deleteScheduleBlock(blockId)
- listenToScheduleBlocks(eventId, callback)
- checkTimeConflict(eventId, location, track, startTime, endTime)
- registerForSession(blockId, userId)
```

2. **`src/components/Scheduling/ScheduleBuilder.js`**
   - Main schedule management interface
   - Day tabs (Day 1, Day 2, Day 3)
   - Grid view / List view toggle
   - Add/Edit/Delete schedule blocks
   - Real-time conflict detection

3. **`src/components/Scheduling/HourByHourGrid.js`**
   - Visual timeline grid (8 AM - 10 PM)
   - Show parallel tracks side-by-side
   - Drag-and-drop blocks (optional)
   - Click to view details

4. **`src/components/Scheduling/ScheduleBlockForm.js`**
   - Create/edit dialog
   - Time picker
   - Speaker management
   - Capacity settings

5. **`src/components/Scheduling/ScheduleCalendar.js`**
   - Multi-day calendar view
   - Color-coded by type
   - Export to PDF/iCal

### State Management Updates

**Extend `src/context/AppStateContext.js`:**
```javascript
// Add to state:
scheduleBlocks: [],
scheduleStats: {
  totalBlocks: 0,
  byType: {},
  conflicts: []
}

// Add action types:
SET_SCHEDULE_BLOCKS
ADD_SCHEDULE_BLOCK
UPDATE_SCHEDULE_BLOCK
DELETE_SCHEDULE_BLOCK
SET_SCHEDULE_STATS

// Add real-time listener:
listenToScheduleBlocks(currentEventId, callback)
```

### Routes to Add
```javascript
<Route path="/schedule/:eventId" element={<ScheduleBuilder />} />
<Route path="/schedule/:eventId/calendar" element={<ScheduleCalendar />} />
```

### Implementation Steps
1. Create `scheduleService.js` with CRUD operations
2. Update Firestore schema (add collections)
3. Extend AppStateContext with schedule state
4. Build ScheduleBuilder component
5. Build HourByHourGrid component
6. Build ScheduleBlockForm component
7. Add routes and navigation
8. Test conflict detection
9. Test real-time updates

**Estimated Time:** 2-3 days

---

## Phase 2: Volunteer Management System 👥

**Goal:** Manage volunteers, tasks, and assignments

### Database Schema

#### New Collection: `volunteers`
```javascript
{
  id: auto,
  eventId: string,
  userId: string,           // link to user account
  name: string,
  email: string,
  phone: string,
  role: string,             // volunteer, team_lead, coordinator
  skills: [string],         // technical, logistics, catering, first_aid
  availability: [{
    date: timestamp,
    startTime: string,
    endTime: string,
    available: boolean
  }],
  assignments: [{
    taskId: string,
    timeSlotId: string,
    location: string,
    status: string          // assigned, confirmed, completed
  }],
  shiftPreferences: [string],
  emergencyContact: {name, relationship, phone},
  checkInStatus: string,    // not_arrived, checked_in, checked_out
  notes: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### New Collection: `volunteerTasks`
```javascript
{
  id: auto,
  eventId: string,
  name: string,
  description: string,
  location: string,
  category: string,         // registration, tech, catering, logistics
  requiredSkills: [string],
  timeSlots: [{
    id: string,
    date: timestamp,
    startTime: string,
    endTime: string,
    requiredCount: number,
    assignedVolunteers: [string],
    status: string          // open, partially_filled, filled, completed
  }],
  priority: string,         // urgent, high, medium, low
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Files to Create

1. **`src/services/volunteerService.js`**
2. **`src/services/volunteerTaskService.js`**
3. **`src/components/Volunteers/VolunteerDashboard.js`**
   - Overview with stats
   - Volunteers list table
   - Tasks Kanban board
   - Assignments calendar

4. **`src/components/Volunteers/VolunteerList.js`**
   - Searchable table
   - Filter by skills, role, status
   - Bulk actions

5. **`src/components/Volunteers/VolunteerForm.js`**
   - Add/edit volunteer
   - Skills selection
   - Availability calendar

6. **`src/components/Volunteers/TaskBoard.js`**
   - Kanban-style board
   - Drag volunteers to tasks
   - Shows gaps and coverage

### Implementation Steps
1. Create volunteer and task services
2. Add state management
3. Build VolunteerDashboard
4. Build VolunteerList with filters
5. Build VolunteerForm
6. Build TaskBoard with drag-drop
7. Add routes and navigation
8. Test assignment logic

**Estimated Time:** 3-4 days

---

## Phase 3: AI Volunteer Prediction ⭐ 🤖

**Goal:** Predict volunteer needs based on event schedule

### Database Schema

#### New Collection: `volunteerPredictions`
```javascript
{
  id: auto,
  eventId: string,
  generatedAt: timestamp,
  model: string,            // "gpt-4o-mini"
  confidence: number,
  totalVolunteersNeeded: number,
  predictions: [{
    scheduleBlockId: string,
    taskType: string,       // registration, tech_support, catering
    location: string,
    timeSlot: {startTime, endTime},
    predictedCount: number,
    reasoning: string,      // AI explanation
    priority: string,
    factors: {
      expectedAttendees: number,
      sessionComplexity: string,
      simultaneousSessions: number
    }
  }],
  recommendations: [{
    type: string,           // warning, suggestion, critical
    description: string,
    suggestedAction: string
  }],
  applied: boolean,         // whether predictions were used to create tasks
  metadata: {processingTime, dataPoints},
  createdAt: timestamp
}
```

### Algorithm Strategy

#### 1. Rule-Based Baseline
```javascript
// Simple heuristics
const calculateBaseline = (scheduleBlocks, eventCapacity) => {
  return scheduleBlocks.map(block => {
    let count = 0;

    // Registration desk: 1 per 50 attendees
    if (block.type === 'registration') {
      count = Math.ceil(eventCapacity / 50);
    }

    // Meals: 1 per 30 attendees
    if (block.type === 'meal') {
      count = Math.ceil(eventCapacity / 30);
    }

    // Workshops: 1 per 100 attendees + 1 tech support
    if (block.type === 'workshop') {
      count = Math.ceil(block.capacity / 100) + 1;
    }

    // Keynotes: 2 fixed (registration + tech)
    if (block.type === 'keynote') {
      count = 2;
    }

    return { blockId: block.id, count, method: 'baseline' };
  });
};
```

#### 2. OpenAI Enhancement
```javascript
const enhanceWithAI = async (baseline, scheduleBlocks, event) => {
  const context = buildPredictionContext(scheduleBlocks, event);

  const prompt = `
Analyze this hackathon schedule and refine volunteer predictions.

EVENT: ${event.name}
Duration: ${event.durationDays} days
Expected Attendees: ${event.capacity}

SCHEDULE:
${scheduleBlocks.map(b => `
  Day ${b.day} | ${b.startTime}-${b.endTime}
  ${b.title} (${b.type}) - ${b.location}
  Capacity: ${b.capacity}
  Track: ${b.track || 'Main'}
`).join('\n')}

BASELINE PREDICTIONS:
${JSON.stringify(baseline, null, 2)}

Refine considering:
1. Time of day (morning registration peaks, evening fatigue)
2. Parallel sessions (more volunteers needed)
3. Meal times (need staff 30 min before/after)
4. Tech workshops require tech-savvy volunteers
5. Bottlenecks and overlaps

Return JSON array: [{
  blockId, predictedCount, reasoning, priority, confidence
}]
  `;

  const response = await callOpenAI(prompt);
  return JSON.parse(response);
};
```

### Files to Create

1. **`src/services/volunteerPredictionService.js`**
```javascript
- generatePredictions(eventId)
- calculateBaseline(scheduleBlocks, capacity)
- enhanceWithAI(baseline, context)
- savePredictions(eventId, predictions)
- applyPredictions(eventId, predictionId)
- getPredictionHistory(eventId)
```

2. **`src/components/Volunteers/PredictionPanel.js`**
   - "Generate Predictions" button
   - Loading state with progress
   - Display predictions with reasoning
   - Show confidence scores
   - "Apply Predictions" to create tasks

3. **`src/components/Volunteers/PredictionHistory.js`**
   - List past predictions
   - Compare accuracy
   - Re-apply old predictions

### Integration with OpenAI

**Extend `src/services/openaiService.js`:**
```javascript
export const generateVolunteerPredictions = async (eventId, scheduleBlocks, eventDetails) => {
  const context = buildVolunteerPredictionContext(scheduleBlocks, eventDetails);

  const messages = [
    {
      role: 'system',
      content: 'You are an expert event planner specializing in volunteer management for hackathons and tech conferences. Analyze schedules and predict volunteer needs accurately.'
    },
    {
      role: 'user',
      content: context
    }
  ];

  return await chatWithOpenAI(messages);
};
```

### Implementation Steps
1. Create volunteerPredictionService
2. Build rule-based baseline algorithm
3. Integrate OpenAI enhancement
4. Create PredictionPanel UI
5. Add "Generate Predictions" workflow
6. Add "Apply Predictions" to create tasks
7. Build PredictionHistory component
8. Test with various event scenarios
9. Tune confidence thresholds

**Estimated Time:** 2-3 days

---

## Phase 4: Accommodation Management 🏨

**Goal:** Manage housing and room assignments for attendees/volunteers

### Database Schema

#### New Collection: `accommodations`
```javascript
{
  id: auto,
  eventId: string,
  name: string,
  type: string,             // hotel, hostel, campus_housing, airbnb
  address: string,
  contact: {name, email, phone, website},
  roomTypes: [{
    id: string,
    type: string,           // single, double, quad, dorm
    capacity: number,
    totalRooms: number,
    availableRooms: number,
    pricePerNight: number,
    amenities: [string],
    accessibility: boolean
  }],
  checkInTime: string,
  checkOutTime: string,
  totalCapacity: number,
  currentOccupancy: number,
  distanceFromVenue: number,
  transportation: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### New Collection: `roomAssignments`
```javascript
{
  id: auto,
  eventId: string,
  accommodationId: string,
  roomNumber: string,
  roomTypeId: string,
  assignedTo: [{
    userId: string,
    name: string,
    email: string,
    checkInDate: timestamp,
    checkOutDate: timestamp,
    checkInStatus: string,  // pending, checked_in, checked_out
    actualCheckIn: timestamp,
    actualCheckOut: timestamp,
    specialRequests: string
  }],
  capacity: number,
  status: string,           // available, partially_occupied, fully_occupied
  billing: {
    totalAmount: number,
    paidAmount: number,
    paymentStatus: string
  },
  notes: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Files to Create

1. **`src/services/accommodationService.js`**
2. **`src/services/roomAssignmentService.js`**
3. **`src/components/Accommodation/AccommodationDashboard.js`**
   - Overview with occupancy stats
   - List of accommodations
   - Room assignment board
   - Check-in/out tracker

4. **`src/components/Accommodation/AccommodationForm.js`**
5. **`src/components/Accommodation/RoomAssignmentBoard.js`**
   - Visual grid of rooms
   - Drag-drop assignments
   - Color-coded by status

6. **`src/components/Accommodation/CheckInTracker.js`**
   - Check-in/out interface
   - QR code scanning (optional)
   - Status updates

### Auto-Assignment Algorithm
```javascript
const optimizeRoomAssignments = (users, accommodations) => {
  // Constraints:
  // 1. Match room capacity
  // 2. Minimize cost
  // 3. Balance occupancy across accommodations
  // 4. Consider special requests (accessibility, quiet, etc.)

  // Use greedy algorithm:
  // - Sort users by check-in date
  // - Assign to cheapest available room that fits requirements
  // - Try to fill rooms completely before opening new ones

  return assignments;
};
```

### Implementation Steps
1. Create accommodation services
2. Build AccommodationDashboard
3. Build AccommodationForm
4. Build RoomAssignmentBoard with drag-drop
5. Implement auto-assignment algorithm
6. Build CheckInTracker
7. Add routes and navigation
8. Test room allocation logic

**Estimated Time:** 3-4 days

---

## Phase 5: Food Service Management 🍕

**Goal:** Meal planning and dietary tracking

### Database Schema

#### New Collection: `foodServices`
```javascript
{
  id: auto,
  eventId: string,
  mealType: string,         // breakfast, lunch, dinner, snack
  date: timestamp,
  timeSlot: {startTime, endTime},
  location: string,
  provider: {name, contact, email, phone, type},
  menu: [{
    item: string,
    category: string,       // main, side, dessert, beverage
    dietaryInfo: [string],  // vegetarian, vegan, gluten_free, halal, kosher
    allergens: [string],
    quantity: number,
    unit: string
  }],
  dietaryAccommodations: {
    vegetarian: number,
    vegan: number,
    glutenFree: number,
    halal: number,
    kosher: number,
    other: [{type, count}]
  },
  capacity: {
    expected: number,
    registered: number,
    actual: number,
    remaining: number
  },
  booking: {
    confirmed: boolean,
    confirmationNumber: string,
    cost: number,
    paymentStatus: string
  },
  inventory: [{
    item: string,
    ordered: number,
    delivered: number,
    consumed: number,
    remaining: number
  }],
  status: string,           // planned, confirmed, in_progress, completed
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Files to Create

1. **`src/services/foodService.js`**
2. **`src/components/FoodService/FoodServiceDashboard.js`**
3. **`src/components/FoodService/MealPlanCalendar.js`**
4. **`src/components/FoodService/FoodServiceForm.js`**
5. **`src/components/FoodService/DietaryTracker.js`**
6. **`src/components/FoodService/MealRegistration.js`**

### Implementation Steps
1. Create foodService
2. Build FoodServiceDashboard
3. Build MealPlanCalendar
4. Build FoodServiceForm
5. Build DietaryTracker
6. Build MealRegistration
7. Add routes and navigation
8. Test meal planning workflow

**Estimated Time:** 2-3 days

---

## Phase 6: Infrastructure Management 📡

**Goal:** WiFi, equipment, and venue infrastructure tracking

### Database Schema

#### New Collection: `infrastructure`
```javascript
{
  id: auto,
  eventId: string,
  category: string,         // wifi, power, av_equipment, signage
  location: string,
  wifi: {
    networkName: string,
    password: string,
    bandwidth: string,
    maxDevices: number,
    securityType: string,
    coverage: [string],
    providerContact: {name, phone},
    troubleshooting: string
  },
  power: {
    outlets: number,
    voltage: string,
    extensionCordsAvailable: number
  },
  equipment: [{
    type: string,           // projector, microphone, laptop, camera
    quantity: number,
    location: string,
    status: string,         // available, in_use, maintenance, broken
    assignedTo: string
  }],
  notes: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Files to Create

1. **`src/services/infrastructureService.js`**
2. **`src/components/Infrastructure/InfrastructureDashboard.js`**
3. **`src/components/Infrastructure/WifiCard.js`**
4. **`src/components/Infrastructure/EquipmentTracker.js`**

### Implementation Steps
1. Create infrastructureService
2. Build InfrastructureDashboard
3. Build WifiCard
4. Build EquipmentTracker
5. Add routes and navigation

**Estimated Time:** 1-2 days

---

## Phase 7: Unified Hackathon Hub 🎯

**Goal:** Central dashboard for hackathon organizers

### Component

**`src/components/HackathonHub/HackathonDashboard.js`**
- At-a-glance overview
- Quick stats: volunteers, rooms, meals, schedule
- Alerts and critical gaps
- Quick actions
- Real-time status

### Layout
```
┌─────────────────────────────────────────────┐
│  🎉 TechCon 2026 - Day 2 of 3              │
│  Feb 7-9, 2026 • 500 attendees             │
├─────────────────────────────────────────────┤
│  ⚠️ ALERTS                                  │
│  • 3 volunteer gaps in afternoon sessions  │
│  • 12 attendees need room assignments      │
├─────────────────────────────────────────────┤
│  📅 SCHEDULE     👥 VOLUNTEERS              │
│  32 blocks       45/50 assigned            │
│                                             │
│  🏨 ROOMS        🍕 MEALS                   │
│  95% occupied    Lunch: 487/500            │
├─────────────────────────────────────────────┤
│  QUICK ACTIONS                              │
│  [Check-in Volunteer] [View Schedule]      │
│  [Assign Rooms] [Generate Predictions]     │
└─────────────────────────────────────────────┘
```

**Estimated Time:** 1-2 days

---

## Total Timeline

| Phase | Feature | Days |
|-------|---------|------|
| 1 | Scheduling System | 2-3 |
| 2 | Volunteer Management | 3-4 |
| 3 | AI Predictions | 2-3 |
| 4 | Accommodations | 3-4 |
| 5 | Food Service | 2-3 |
| 6 | Infrastructure | 1-2 |
| 7 | Hackathon Hub | 1-2 |

**Total: 14-21 days (3-4 weeks)**

---

## Navigation & Routes

Add to navbar when event has `isHackathon: true`:

```javascript
{currentEvent?.isHackathon && (
  <Box sx={{ display: 'flex', gap: 1 }}>
    <Button component={Link} to={`/hackathon/${currentEvent.id}`}>Hub</Button>
    <Button component={Link} to={`/schedule/${currentEvent.id}`}>Schedule</Button>
    <Button component={Link} to={`/volunteers/${currentEvent.id}`}>Volunteers</Button>
    <Button component={Link} to={`/accommodation/${currentEvent.id}`}>Rooms</Button>
    <Button component={Link} to={`/food-service/${currentEvent.id}`}>Food</Button>
    <Button component={Link} to={`/infrastructure/${currentEvent.id}`}>Infrastructure</Button>
  </Box>
)}
```

---

## Testing Plan

### Unit Tests
- Service layer CRUD operations
- State reducer actions
- Algorithm functions (predictions, room assignment)

### Integration Tests
- Real-time Firebase listeners
- OpenAI API calls
- Form submissions
- Navigation flows

### End-to-End Tests
1. Create hackathon event
2. Build schedule (multi-day)
3. Add volunteers
4. Generate AI predictions
5. Apply predictions (create tasks)
6. Assign volunteers to tasks
7. Add accommodations
8. Auto-assign rooms
9. Plan meals with dietary needs
10. Track infrastructure

---

## Next Steps

**Start with Phase 1** (Scheduling System) as it's the foundation for other features.

Would you like me to:
1. **Start implementing Phase 1** (Scheduling System)?
2. **Modify the plan** (add/remove features)?
3. **Create a different plan** for something else?

Let me know how you'd like to proceed!
