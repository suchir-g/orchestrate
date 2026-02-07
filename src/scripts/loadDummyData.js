// Script to load dummy data into Firebase
import {
  createEvent,
  createOrder,
  createTicket,
  getAllDocuments,
  deleteDocument,
  COLLECTIONS
} from '../services/firebaseDbService';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';

// Function to clear all existing data
const clearAllCollections = async () => {
  console.log('🗑️  Clearing all existing data...');

  const collectionsToClear = [
    COLLECTIONS.EVENTS,
    COLLECTIONS.ORDERS,
    COLLECTIONS.TICKETS,
    COLLECTIONS.SHIPMENTS,
    COLLECTIONS.SCHEDULE_BLOCKS
  ];

  for (const collectionName of collectionsToClear) {
    try {
      const { data: documents } = await getAllDocuments(collectionName);
      if (documents && documents.length > 0) {
        console.log(`   Deleting ${documents.length} documents from ${collectionName}...`);
        for (const doc of documents) {
          await deleteDocument(collectionName, doc.id);
        }
        console.log(`   ✅ Cleared ${collectionName}`);
      } else {
        console.log(`   ✓ ${collectionName} already empty`);
      }
    } catch (error) {
      console.error(`   ❌ Error clearing ${collectionName}:`, error);
    }
  }

  console.log('✅ All collections cleared\n');
};

// Dummy Events Data
const dummyEvents = [
  {
    name: 'Tech Conference 2026',
    description: 'Annual technology and innovation conference featuring keynotes from industry leaders, hands-on workshops, and networking opportunities. Join 1000+ tech professionals for 2 days of learning and innovation.',
    date: '2026-02-15T09:00:00Z',
    endDate: '2026-02-16T18:00:00Z',
    location: 'Convention Center, NYC',
    venue: {
      name: 'Javits Center',
      address: '655 W 34th St, New York, NY 10001',
      capacity: 1000,
      facilities: ['WiFi', 'Parking', 'Food Court', 'Accessibility']
    },
    capacity: 1000,
    organizer: 'Tech Corp',
    organizerContact: {
      email: 'info@techcorp.com',
      phone: '+1 (555) 123-4567',
      website: 'https://techconf2024.com'
    },
    category: 'Conference',
    status: 'Confirmed',
    attendees: 450,
    tickets: {
      total: 1000,
      sold: 450,
      available: 550
    },
    pricing: {
      earlyBird: 299,
      regular: 399,
      vip: 599,
      student: 149
    },
    schedule: [
      { time: '09:00 AM', activity: 'Registration & Breakfast', day: 1 },
      { time: '10:00 AM', activity: 'Opening Keynote: The Future of AI', speaker: 'Dr. Sarah Johnson', day: 1 },
      { time: '11:30 AM', activity: 'Workshop: Building Scalable APIs', day: 1 },
      { time: '01:00 PM', activity: 'Lunch & Networking', day: 1 },
      { time: '02:30 PM', activity: 'Panel: Cloud Architecture Best Practices', day: 1 },
      { time: '04:00 PM', activity: 'Lightning Talks', day: 1 },
      { time: '06:00 PM', activity: 'Networking Reception', day: 1 },
      { time: '09:00 AM', activity: 'Day 2: Advanced Sessions', day: 2 }
    ],
    speakers: [
      { name: 'Dr. Sarah Johnson', title: 'Chief AI Officer, TechCorp', topic: 'Future of AI' },
      { name: 'Michael Chen', title: 'Senior Architect, CloudScale', topic: 'Cloud Architecture' },
      { name: 'Emily Rodriguez', title: 'VP Engineering, DataFlow', topic: 'Data Engineering' }
    ],
    tags: ['AI', 'Cloud', 'Networking', 'Innovation', 'Workshop'],
    timeline: [
      {
        step: 'Event Created',
        timestamp: '2025-12-10T10:00:00Z',
        status: 'completed',
        description: 'Event has been created and is in planning phase',
        completedBy: 'Admin'
      },
      {
        step: 'Venue Booked',
        timestamp: '2025-12-15T14:30:00Z',
        status: 'completed',
        description: 'Convention center booked and confirmed',
        completedBy: 'Event Manager'
      },
      {
        step: 'Speakers Confirmed',
        timestamp: '2026-01-10T11:00:00Z',
        status: 'completed',
        description: 'All keynote speakers have confirmed attendance',
        completedBy: 'Speaker Coordinator'
      },
      {
        step: 'Early Bird Sales Open',
        timestamp: '2026-01-20T09:00:00Z',
        status: 'completed',
        description: 'Ticket sales opened with early bird pricing',
        completedBy: 'Marketing Team'
      },
      {
        step: 'Marketing Campaign',
        timestamp: '2026-02-01T10:00:00Z',
        status: 'completed',
        description: 'Social media and email marketing campaign launched',
        completedBy: 'Marketing Team'
      }
    ],
    todos: [
      { task: 'Finalize speaker presentations', dueDate: '2026-02-10T17:00:00Z', status: 'completed', assignedTo: 'Content Team', priority: 'high' },
      { task: 'Set up registration desk', dueDate: '2026-02-15T08:00:00Z', status: 'pending', assignedTo: 'Event Staff', priority: 'high' },
      { task: 'Test AV equipment', dueDate: '2026-02-14T16:00:00Z', status: 'pending', assignedTo: 'Tech Team', priority: 'urgent' },
      { task: 'Prepare attendee badges', dueDate: '2026-02-14T18:00:00Z', status: 'pending', assignedTo: 'Admin', priority: 'medium' },
      { task: 'Stock food and beverages', dueDate: '2026-02-15T07:00:00Z', status: 'pending', assignedTo: 'Catering', priority: 'high' },
      { task: 'Final venue walkthrough', dueDate: '2026-02-14T14:00:00Z', status: 'pending', assignedTo: 'Venue Coordinator', priority: 'high' }
    ]
  },
  {
    name: 'Summer Music Festival',
    description: 'Three-day outdoor music festival featuring top artists across multiple genres. Enjoy live performances, food trucks, art installations, and an unforgettable summer experience.',
    date: '2026-06-20T14:00:00Z',
    endDate: '2026-06-22T23:00:00Z',
    location: 'Central Park, NYC',
    venue: {
      name: 'Central Park Great Lawn',
      address: 'Central Park, New York, NY 10024',
      capacity: 5000,
      facilities: ['Multiple Stages', 'Food Court', 'Beer Garden', 'Medical Tent', 'Charging Stations']
    },
    capacity: 5000,
    organizer: 'Music Events Inc',
    organizerContact: {
      email: 'info@musicfest.com',
      phone: '+1 (555) 789-0123',
      website: 'https://summermusicfest.com'
    },
    category: 'Concert',
    status: 'Planning',
    attendees: 0,
    tickets: {
      total: 5000,
      sold: 0,
      available: 5000
    },
    pricing: {
      singleDay: 129,
      threeDayPass: 299,
      vip: 599,
      earlyBird: 249
    },
    schedule: [
      { time: '02:00 PM', activity: 'Gates Open', day: 1 },
      { time: '03:00 PM', activity: 'Opening Act', speaker: 'The Indie Collective', day: 1 },
      { time: '05:00 PM', activity: 'Main Stage Performance', speaker: 'Electric Dreams', day: 1 },
      { time: '08:00 PM', activity: 'Headliner', speaker: 'The Midnight Riders', day: 1 },
      { time: '11:00 PM', activity: 'Late Night DJ Set', day: 1 },
      { time: '02:00 PM', activity: 'Day 2 Gates Open', day: 2 },
      { time: '03:30 PM', activity: 'Rock Stage', speaker: 'Thunder Valley', day: 2 },
      { time: '07:00 PM', activity: 'Electronic Stage', speaker: 'DJ Pulse', day: 2 }
    ],
    speakers: [
      { name: 'The Midnight Riders', title: 'Headliner', topic: 'Rock/Alternative' },
      { name: 'Electric Dreams', title: 'Featured Artist', topic: 'Electronic/Pop' },
      { name: 'DJ Pulse', title: 'DJ', topic: 'Electronic Dance' },
      { name: 'Thunder Valley', title: 'Band', topic: 'Rock' }
    ],
    tags: ['Music', 'Festival', 'Outdoor', 'Summer', 'Live Performance'],
    timeline: [
      {
        step: 'Event Created',
        timestamp: '2025-12-05T09:00:00Z',
        status: 'completed',
        description: 'Festival planning initiated',
        completedBy: 'Festival Director'
      },
      {
        step: 'Venue Secured',
        timestamp: '2025-12-20T13:00:00Z',
        status: 'completed',
        description: 'Central Park Great Lawn reserved for 3 days',
        completedBy: 'Venue Coordinator'
      },
      {
        step: 'Permit Applications',
        timestamp: '2026-01-15T10:00:00Z',
        status: 'completed',
        description: 'City permits and licenses submitted',
        completedBy: 'Legal Team'
      },
      {
        step: 'Artist Negotiations',
        timestamp: '2026-02-10T14:00:00Z',
        status: 'completed',
        description: 'Contracts sent to headliners and featured artists',
        completedBy: 'Booking Manager'
      }
    ],
    todos: [
      { task: 'Confirm stage setup crew', dueDate: '2026-05-01T12:00:00Z', status: 'pending', assignedTo: 'Stage Manager', priority: 'high' },
      { task: 'Order portable restrooms', dueDate: '2026-05-15T17:00:00Z', status: 'pending', assignedTo: 'Logistics', priority: 'high' },
      { task: 'Secure food vendor contracts', dueDate: '2026-04-30T15:00:00Z', status: 'pending', assignedTo: 'Vendor Coordinator', priority: 'medium' },
      { task: 'Finalize artist schedule', dueDate: '2026-06-01T10:00:00Z', status: 'pending', assignedTo: 'Booking Manager', priority: 'urgent' },
      { task: 'Set up security perimeter', dueDate: '2026-06-19T14:00:00Z', status: 'pending', assignedTo: 'Security Team', priority: 'urgent' },
      { task: 'Test sound systems', dueDate: '2026-06-19T10:00:00Z', status: 'pending', assignedTo: 'Audio Tech', priority: 'urgent' }
    ]
  },
  {
    name: 'Web Development Workshop',
    description: 'Intensive hands-on workshop teaching React, Next.js, and modern web development practices. Build a full-stack application from scratch with expert guidance.',
    date: '2026-02-05T10:00:00Z',
    endDate: '2026-02-05T17:00:00Z',
    location: 'Tech Hub, San Francisco',
    venue: {
      name: 'TechHub SF',
      address: '717 Market St, San Francisco, CA 94103',
      capacity: 50,
      facilities: ['High-speed WiFi', 'Workstations', 'Coffee Bar', 'Projectors', 'Whiteboards']
    },
    capacity: 50,
    organizer: 'DevCamp',
    organizerContact: {
      email: 'hello@devcamp.io',
      phone: '+1 (555) 234-5678',
      website: 'https://devcamp.io'
    },
    category: 'Workshop',
    status: 'In Progress',
    attendees: 48,
    tickets: {
      total: 50,
      sold: 48,
      available: 2
    },
    pricing: {
      regular: 199,
      student: 99,
      group: 149
    },
    schedule: [
      { time: '10:00 AM', activity: 'Registration & Setup', day: 1 },
      { time: '10:30 AM', activity: 'Introduction to React Fundamentals', speaker: 'Sarah Martinez', day: 1 },
      { time: '12:00 PM', activity: 'Lunch Break', day: 1 },
      { time: '01:00 PM', activity: 'Building Components & State Management', speaker: 'Sarah Martinez', day: 1 },
      { time: '03:00 PM', activity: 'Break', day: 1 },
      { time: '03:15 PM', activity: 'Next.js & Full-Stack Development', speaker: 'Alex Thompson', day: 1 },
      { time: '05:00 PM', activity: 'Q&A and Project Showcase', day: 1 }
    ],
    speakers: [
      { name: 'Sarah Martinez', title: 'Senior Frontend Engineer, Meta', topic: 'React & Modern Frontend' },
      { name: 'Alex Thompson', title: 'Full-Stack Developer, Vercel', topic: 'Next.js & Deployment' }
    ],
    tags: ['React', 'Web Development', 'Workshop', 'Hands-on', 'Full-Stack'],
    timeline: [
      {
        step: 'Event Created',
        timestamp: '2026-01-05T11:00:00Z',
        status: 'completed',
        description: 'Workshop planning started',
        completedBy: 'Workshop Coordinator'
      },
      {
        step: 'Instructors Confirmed',
        timestamp: '2026-01-10T15:00:00Z',
        status: 'completed',
        description: 'Expert instructors Sarah and Alex confirmed',
        completedBy: 'Education Team'
      },
      {
        step: 'Curriculum Finalized',
        timestamp: '2026-01-20T10:00:00Z',
        status: 'completed',
        description: 'Workshop curriculum and materials prepared',
        completedBy: 'Content Team'
      },
      {
        step: 'Registration Opened',
        timestamp: '2026-01-25T09:00:00Z',
        status: 'completed',
        description: 'Public registration launched',
        completedBy: 'Marketing Team'
      },
      {
        step: 'Workshop Started',
        timestamp: '2026-02-05T10:00:00Z',
        status: 'completed',
        description: 'Workshop in progress with 48 attendees',
        completedBy: 'Event Staff'
      }
    ],
    todos: [
      { task: 'Prepare code examples', dueDate: '2026-02-04T20:00:00Z', status: 'completed', assignedTo: 'Sarah Martinez', priority: 'high' },
      { task: 'Test all workstations', dueDate: '2026-02-05T09:00:00Z', status: 'completed', assignedTo: 'Tech Support', priority: 'urgent' },
      { task: 'Print workshop materials', dueDate: '2026-02-04T17:00:00Z', status: 'completed', assignedTo: 'Admin', priority: 'medium' },
      { task: 'Order lunch for attendees', dueDate: '2026-02-05T11:30:00Z', status: 'in_progress', assignedTo: 'Catering', priority: 'high' },
      { task: 'Send follow-up emails', dueDate: '2026-02-06T10:00:00Z', status: 'pending', assignedTo: 'Marketing', priority: 'medium' },
      { task: 'Collect feedback forms', dueDate: '2026-02-05T17:30:00Z', status: 'pending', assignedTo: 'Event Staff', priority: 'medium' }
    ]
  },
  {
    name: 'Startup Pitch Competition',
    description: 'Premier startup pitch competition where founders present their innovative ideas to top-tier venture capitalists and angel investors. Compete for funding, mentorship, and exposure.',
    date: '2026-03-10T15:00:00Z',
    endDate: '2026-03-10T21:00:00Z',
    location: 'Innovation Center, Austin',
    venue: {
      name: 'Capital Factory',
      address: '701 Brazos St, Austin, TX 78701',
      capacity: 200,
      facilities: ['Pitch Stage', 'Investor Lounge', 'Networking Area', 'AV Equipment', 'Recording Studio']
    },
    capacity: 200,
    organizer: 'Startup Hub',
    organizerContact: {
      email: 'pitch@startuphub.com',
      phone: '+1 (555) 456-7890',
      website: 'https://startuphub.com'
    },
    category: 'Conference',
    status: 'Confirmed',
    attendees: 120,
    tickets: {
      total: 200,
      sold: 120,
      available: 80
    },
    pricing: {
      founder: 50,
      investor: 0,
      general: 75,
      student: 25
    },
    schedule: [
      { time: '03:00 PM', activity: 'Registration & Networking', day: 1 },
      { time: '04:00 PM', activity: 'Opening Remarks', speaker: 'Jennifer Park', day: 1 },
      { time: '04:15 PM', activity: 'Pitch Round 1: Pre-Seed Startups', day: 1 },
      { time: '05:30 PM', activity: 'Break & Networking', day: 1 },
      { time: '06:00 PM', activity: 'Pitch Round 2: Seed Startups', day: 1 },
      { time: '07:15 PM', activity: 'Investor Panel Q&A', day: 1 },
      { time: '08:00 PM', activity: 'Awards & Winner Announcement', day: 1 },
      { time: '08:30 PM', activity: 'Reception & Networking', day: 1 }
    ],
    speakers: [
      { name: 'Jennifer Park', title: 'Managing Partner, Venture Capital Firm', topic: 'Opening Keynote' },
      { name: 'David Chen', title: 'Angel Investor & Serial Entrepreneur', topic: 'Investor Panel' },
      { name: 'Rachel Foster', title: 'Partner, Sequoia Capital', topic: 'Investor Panel' },
      { name: 'Marcus Williams', title: 'Founder, Tech Unicorn Inc', topic: 'Success Story' }
    ],
    tags: ['Startup', 'Pitch', 'Investment', 'Networking', 'Entrepreneurship'],
    timeline: [
      {
        step: 'Event Created',
        timestamp: '2026-01-10T10:00:00Z',
        status: 'completed',
        description: 'Pitch competition planning initiated',
        completedBy: 'Event Director'
      },
      {
        step: 'Investor Panel Confirmed',
        timestamp: '2026-01-25T14:00:00Z',
        status: 'completed',
        description: 'Top VCs and angel investors confirmed participation',
        completedBy: 'Investor Relations'
      },
      {
        step: 'Startup Applications Open',
        timestamp: '2026-02-01T09:00:00Z',
        status: 'completed',
        description: 'Application portal opened for startup submissions',
        completedBy: 'Program Manager'
      },
      {
        step: 'Finalists Selected',
        timestamp: '2026-02-20T16:00:00Z',
        status: 'completed',
        description: '15 startups selected to pitch at the event',
        completedBy: 'Selection Committee'
      },
      {
        step: 'Ticket Sales Launched',
        timestamp: '2026-02-25T10:00:00Z',
        status: 'completed',
        description: 'Public ticket sales opened',
        completedBy: 'Marketing Team'
      }
    ],
    todos: [
      { task: 'Review finalist pitch decks', dueDate: '2026-03-05T17:00:00Z', status: 'completed', assignedTo: 'Selection Committee', priority: 'high' },
      { task: 'Prepare investor welcome packets', dueDate: '2026-03-08T15:00:00Z', status: 'pending', assignedTo: 'Investor Relations', priority: 'medium' },
      { task: 'Set up pitch stage and AV', dueDate: '2026-03-10T13:00:00Z', status: 'pending', assignedTo: 'Tech Team', priority: 'urgent' },
      { task: 'Confirm judges attendance', dueDate: '2026-03-09T12:00:00Z', status: 'pending', assignedTo: 'Program Manager', priority: 'high' },
      { task: 'Prepare award trophies', dueDate: '2026-03-10T14:00:00Z', status: 'pending', assignedTo: 'Event Coordinator', priority: 'medium' },
      { task: 'Organize networking reception', dueDate: '2026-03-10T14:30:00Z', status: 'pending', assignedTo: 'Catering', priority: 'high' }
    ]
  },
  {
    name: 'AI & Machine Learning Summit',
    description: 'Premier summit exploring the cutting edge of artificial intelligence, machine learning, and deep learning. Featuring research presentations, hands-on workshops, and insights from industry leaders.',
    date: '2026-04-05T08:30:00Z',
    endDate: '2026-04-06T18:00:00Z',
    location: 'Tech Arena, Seattle',
    venue: {
      name: 'Seattle Convention Center',
      address: '705 Pike St, Seattle, WA 98101',
      capacity: 800,
      facilities: ['Multiple Conference Rooms', 'Demo Area', 'Workshop Labs', 'Exhibition Hall', 'WiFi', 'Catering']
    },
    capacity: 800,
    organizer: 'AI Society',
    organizerContact: {
      email: 'contact@aisociety.org',
      phone: '+1 (555) 567-8901',
      website: 'https://aisummit2024.org'
    },
    category: 'Conference',
    status: 'Planning',
    attendees: 0,
    tickets: {
      total: 800,
      sold: 0,
      available: 800
    },
    pricing: {
      earlyBird: 399,
      regular: 549,
      academic: 249,
      vip: 899,
      virtual: 149
    },
    schedule: [
      { time: '08:30 AM', activity: 'Registration & Breakfast', day: 1 },
      { time: '09:30 AM', activity: 'Opening Keynote: The Next Decade of AI', speaker: 'Dr. Andrew Lee', day: 1 },
      { time: '11:00 AM', activity: 'Research Track: Latest in NLP', day: 1 },
      { time: '12:30 PM', activity: 'Lunch & Poster Session', day: 1 },
      { time: '02:00 PM', activity: 'Workshop: Building Production ML Systems', speaker: 'Maria Santos', day: 1 },
      { time: '04:00 PM', activity: 'Panel: Ethics in AI', day: 1 },
      { time: '06:00 PM', activity: 'Networking Reception', day: 1 },
      { time: '09:00 AM', activity: 'Day 2: Advanced Deep Learning', speaker: 'Dr. James Wilson', day: 2 },
      { time: '11:00 AM', activity: 'Industry Applications Track', day: 2 },
      { time: '01:00 PM', activity: 'Closing Keynote & Awards', day: 2 }
    ],
    speakers: [
      { name: 'Dr. Andrew Lee', title: 'Director of AI Research, OpenAI', topic: 'Future of AI' },
      { name: 'Maria Santos', title: 'ML Engineer, Google Brain', topic: 'Production ML Systems' },
      { name: 'Dr. James Wilson', title: 'Professor, MIT', topic: 'Deep Learning Research' },
      { name: 'Dr. Lisa Kumar', title: 'AI Ethics Lead, Microsoft', topic: 'Responsible AI' }
    ],
    tags: ['AI', 'Machine Learning', 'Deep Learning', 'Research', 'Innovation'],
    timeline: [
      {
        step: 'Event Created',
        timestamp: '2025-11-01T10:00:00Z',
        status: 'completed',
        description: 'AI Summit planning initiated for 2026',
        completedBy: 'Conference Chair'
      },
      {
        step: 'Call for Papers',
        timestamp: '2025-12-10T09:00:00Z',
        status: 'completed',
        description: 'Research paper submission portal opened',
        completedBy: 'Program Committee'
      },
      {
        step: 'Keynote Speakers Invited',
        timestamp: '2026-01-15T14:00:00Z',
        status: 'completed',
        description: 'Invitations sent to leading AI researchers',
        completedBy: 'Organizing Committee'
      },
      {
        step: 'Venue Booking',
        timestamp: '2026-02-10T11:00:00Z',
        status: 'completed',
        description: 'Seattle Convention Center confirmed for 2 days',
        completedBy: 'Logistics Team'
      },
      {
        step: 'Sponsorships Secured',
        timestamp: '2026-02-25T13:00:00Z',
        status: 'completed',
        description: 'Major tech companies signed as platinum sponsors',
        completedBy: 'Sponsorship Team'
      }
    ],
    todos: [
      { task: 'Review submitted research papers', dueDate: '2026-03-20T23:59:00Z', status: 'pending', assignedTo: 'Program Committee', priority: 'high' },
      { task: 'Finalize workshop lab setup', dueDate: '2026-04-01T16:00:00Z', status: 'pending', assignedTo: 'Workshop Coordinator', priority: 'high' },
      { task: 'Create conference mobile app', dueDate: '2026-03-25T17:00:00Z', status: 'pending', assignedTo: 'Dev Team', priority: 'medium' },
      { task: 'Coordinate speaker travel', dueDate: '2026-04-01T12:00:00Z', status: 'pending', assignedTo: 'Logistics', priority: 'high' },
      { task: 'Set up demo exhibition area', dueDate: '2026-04-04T14:00:00Z', status: 'pending', assignedTo: 'Exhibition Manager', priority: 'high' },
      { task: 'Prepare sponsor booth spaces', dueDate: '2026-04-04T16:00:00Z', status: 'pending', assignedTo: 'Sponsorship Team', priority: 'medium' }
    ]
  }
];

// Dummy Merchandise/Supplies Orders (scoped to events)
// These are items ordered FOR the event (merch, supplies, equipment)
const dummyMerchandise = [
  {
    eventId: 'tech-conference-2026', // Will be replaced with actual ID
    eventName: 'Tech Conference 2026',
    orderNumber: 'MERCH-001',
    itemType: 'Event Merchandise',
    items: [
      { name: 'Branded T-Shirts', quantity: 500, unitCost: 12.99 },
      { name: 'Conference Bags', quantity: 300, unitCost: 8.50 },
      { name: 'Lanyards', quantity: 1000, unitCost: 1.25 }
    ],
    supplier: 'PrintPro Supplies',
    totalAmount: 9575.00,
    shippingAddress: '655 W 34th St, New York, NY 10001',
    priority: 'High',
    status: 'Delivered',
    trackingNumber: 'SHIP-TRK9X7Y2Z',
    orderDate: '2026-01-20T10:00:00Z',
    estimatedDelivery: '2026-02-10T14:00:00Z',
    actualDelivery: '2026-02-08T11:30:00Z'
  },
  {
    eventId: 'summer-music-festival',
    eventName: 'Summer Music Festival',
    orderNumber: 'MERCH-002',
    itemType: 'Stage Equipment',
    items: [
      { name: 'PA System Rental', quantity: 2, unitCost: 1500.00 },
      { name: 'Stage Barriers', quantity: 50, unitCost: 45.00 },
      { name: 'Generator Rental', quantity: 3, unitCost: 800.00 }
    ],
    supplier: 'EventPro Equipment',
    totalAmount: 7650.00,
    shippingAddress: 'Central Park Great Lawn, New York, NY 10024',
    priority: 'Urgent',
    status: 'Processing',
    trackingNumber: 'SHIP-TRK8A3B4C',
    orderDate: '2026-03-15T09:00:00Z',
    estimatedDelivery: '2026-06-18T08:00:00Z',
    actualDelivery: null
  },
  {
    eventId: 'web-dev-workshop',
    eventName: 'Web Development Workshop',
    orderNumber: 'MERCH-003',
    itemType: 'Workshop Materials',
    items: [
      { name: 'Laptop Chargers', quantity: 10, unitCost: 25.00 },
      { name: 'Workshop Booklets', quantity: 50, unitCost: 5.00 },
      { name: 'USB Drives (16GB)', quantity: 50, unitCost: 8.00 }
    ],
    supplier: 'Tech Supplies Inc',
    totalAmount: 900.00,
    shippingAddress: '717 Market St, San Francisco, CA 94103',
    priority: 'Normal',
    status: 'Delivered',
    trackingNumber: 'SHIP-TRK5D6E7F',
    orderDate: '2026-01-25T14:00:00Z',
    estimatedDelivery: '2026-02-03T10:00:00Z',
    actualDelivery: '2026-02-01T13:45:00Z'
  },
  {
    eventId: 'startup-pitch',
    eventName: 'Startup Pitch Competition',
    orderNumber: 'MERCH-004',
    itemType: 'Event Swag',
    items: [
      { name: 'Startup Pitch Banners', quantity: 5, unitCost: 85.00 },
      { name: 'Investor Welcome Kits', quantity: 30, unitCost: 25.00 },
      { name: 'Pitch Deck Clickers', quantity: 15, unitCost: 15.00 }
    ],
    supplier: 'Event Branding Co',
    totalAmount: 1600.00,
    shippingAddress: '701 Brazos St, Austin, TX 78701',
    priority: 'Normal',
    status: 'Shipped',
    trackingNumber: 'SHIP-TRK2G8H9I',
    orderDate: '2026-02-20T11:00:00Z',
    estimatedDelivery: '2026-03-08T15:00:00Z',
    actualDelivery: null
  }
];

// Dummy Tickets Issued (scoped to events)
// These are tickets sold to attendees
const dummyTicketsIssued = [
  {
    eventId: 'tech-conference-2026',
    eventName: 'Tech Conference 2026',
    ticketNumber: 'TKT-TC-001',
    ticketType: 'Early Bird',
    holderName: 'Sarah Johnson',
    holderEmail: 'sarah.j@techcorp.com',
    price: 299.00,
    purchaseDate: '2026-01-22T14:30:00Z',
    status: 'confirmed',
    paymentMethod: 'Credit Card',
    transactionId: 'TXN-89234',
    checkInStatus: 'not_checked_in'
  },
  {
    eventId: 'tech-conference-2026',
    eventName: 'Tech Conference 2026',
    ticketNumber: 'TKT-TC-002',
    ticketType: 'VIP',
    holderName: 'Michael Chen',
    holderEmail: 'mchen@cloudscale.io',
    price: 599.00,
    purchaseDate: '2026-02-01T10:15:00Z',
    status: 'confirmed',
    paymentMethod: 'PayPal',
    transactionId: 'TXN-89456',
    checkInStatus: 'not_checked_in'
  },
  {
    eventId: 'summer-music-festival',
    eventName: 'Summer Music Festival',
    ticketNumber: 'TKT-SMF-001',
    ticketType: 'Three Day Pass',
    holderName: 'Emma Rodriguez',
    holderEmail: 'emma.r@email.com',
    price: 299.00,
    purchaseDate: '2026-03-01T16:20:00Z',
    status: 'confirmed',
    paymentMethod: 'Credit Card',
    transactionId: 'TXN-90123',
    checkInStatus: 'not_checked_in'
  },
  {
    eventId: 'web-dev-workshop',
    eventName: 'Web Development Workshop',
    ticketNumber: 'TKT-WDW-001',
    ticketType: 'Student',
    holderName: 'Alex Martinez',
    holderEmail: 'alex.m@university.edu',
    price: 99.00,
    purchaseDate: '2026-01-28T09:45:00Z',
    status: 'confirmed',
    paymentMethod: 'Student Discount',
    transactionId: 'TXN-87654',
    checkInStatus: 'checked_in'
  },
  {
    eventId: 'startup-pitch',
    eventName: 'Startup Pitch Competition',
    ticketNumber: 'TKT-SPC-001',
    ticketType: 'Founder',
    holderName: 'David Park',
    holderEmail: 'david@startuphub.com',
    price: 50.00,
    purchaseDate: '2026-02-28T11:00:00Z',
    status: 'confirmed',
    paymentMethod: 'Credit Card',
    transactionId: 'TXN-91234',
    checkInStatus: 'not_checked_in'
  }
];

// Dummy Shipments (scoped to events)
// Shipments of merchandise/equipment to event venues
const dummyShipments = [
  {
    eventId: 'tech-conference-2026',
    eventName: 'Tech Conference 2026',
    shipmentNumber: 'SHIP-001',
    carrier: 'FedEx',
    trackingNumber: 'SHIP-TRK9X7Y2Z',
    status: 'Delivered',
    origin: 'PrintPro Supplies, Chicago, IL',
    destination: '655 W 34th St, New York, NY 10001',
    contents: 'Conference merchandise (T-shirts, bags, lanyards)',
    weight: '250 lbs',
    dimensions: '48" x 40" x 36"',
    shippingDate: '2026-02-03T08:00:00Z',
    estimatedDelivery: '2026-02-10T14:00:00Z',
    deliveryDate: '2026-02-08T11:30:00Z',
    priority: 'High'
  },
  {
    eventId: 'summer-music-festival',
    eventName: 'Summer Music Festival',
    shipmentNumber: 'SHIP-002',
    carrier: 'UPS Freight',
    trackingNumber: 'SHIP-TRK8A3B4C',
    status: 'In Transit',
    origin: 'EventPro Equipment, Newark, NJ',
    destination: 'Central Park Great Lawn, New York, NY 10024',
    contents: 'Stage equipment (PA systems, barriers, generators)',
    weight: '1200 lbs',
    dimensions: '96" x 48" x 48"',
    shippingDate: '2026-06-15T09:00:00Z',
    estimatedDelivery: '2026-06-18T08:00:00Z',
    deliveryDate: null,
    priority: 'Urgent'
  },
  {
    eventId: 'web-dev-workshop',
    eventName: 'Web Development Workshop',
    shipmentNumber: 'SHIP-003',
    carrier: 'USPS Priority',
    trackingNumber: 'SHIP-TRK5D6E7F',
    status: 'Delivered',
    origin: 'Tech Supplies Inc, San Jose, CA',
    destination: '717 Market St, San Francisco, CA 94103',
    contents: 'Workshop materials (chargers, booklets, USB drives)',
    weight: '45 lbs',
    dimensions: '24" x 18" x 12"',
    shippingDate: '2026-01-28T10:00:00Z',
    estimatedDelivery: '2026-02-03T10:00:00Z',
    deliveryDate: '2026-02-01T13:45:00Z',
    priority: 'Normal'
  },
  {
    eventId: 'startup-pitch',
    eventName: 'Startup Pitch Competition',
    shipmentNumber: 'SHIP-004',
    carrier: 'DHL Express',
    trackingNumber: 'SHIP-TRK2G8H9I',
    status: 'In Transit',
    origin: 'Event Branding Co, Dallas, TX',
    destination: '701 Brazos St, Austin, TX 78701',
    contents: 'Event swag (banners, investor kits, clickers)',
    weight: '75 lbs',
    dimensions: '36" x 24" x 18"',
    shippingDate: '2026-03-05T11:00:00Z',
    estimatedDelivery: '2026-03-08T15:00:00Z',
    deliveryDate: null,
    priority: 'Normal'
  },
  {
    eventId: 'tech-conference-2026',
    eventName: 'Tech Conference 2026',
    shipmentNumber: 'SHIP-005',
    carrier: 'Local Courier',
    trackingNumber: 'SHIP-TRKLOCAL1',
    status: 'Delivered',
    origin: 'NYC Office Supply, Brooklyn, NY',
    destination: '655 W 34th St, New York, NY 10001',
    contents: 'Registration desk supplies (pens, clipboards, signs)',
    weight: '25 lbs',
    dimensions: '18" x 12" x 10"',
    shippingDate: '2026-02-14T09:00:00Z',
    estimatedDelivery: '2026-02-14T16:00:00Z',
    deliveryDate: '2026-02-14T14:30:00Z',
    priority: 'High'
  }
];

// Function to load all dummy data
export const loadDummyData = async () => {
  console.log('🚀 Starting to load dummy data...');

  try {
    // Clear all existing data first
    await clearAllCollections();

    // Load Events first and capture their IDs
    console.log('\n📅 Creating events...');
    const eventIdMap = {};

    for (const event of dummyEvents) {
      const { id, error } = await createEvent(event);
      if (error) {
        console.error(`❌ Error creating event "${event.name}":`, error);
      } else {
        console.log(`✅ Created event: ${event.name} (ID: ${id})`);
        // Map event names to IDs for linking merchandise and tickets
        eventIdMap[event.name] = id;
      }
    }

    // Load Merchandise (linked to events)
    console.log('\n📦 Creating merchandise/supplies orders...');
    for (const merch of dummyMerchandise) {
      // Update eventId with actual ID from Firebase
      const actualEventId = eventIdMap[merch.eventName];
      if (actualEventId) {
        merch.eventId = actualEventId;
      }

      const { id, error } = await createOrder(merch);
      if (error) {
        console.error(`❌ Error creating merchandise order ${merch.orderNumber}:`, error);
      } else {
        console.log(`✅ Created merchandise: ${merch.orderNumber} for ${merch.eventName} (ID: ${id})`);
      }
    }

    // Load Tickets Issued (linked to events)
    console.log('\n🎫 Creating tickets issued...');
    for (const ticket of dummyTicketsIssued) {
      // Update eventId with actual ID from Firebase
      const actualEventId = eventIdMap[ticket.eventName];
      if (actualEventId) {
        ticket.eventId = actualEventId;
      }

      const { id, error } = await createTicket(ticket);
      if (error) {
        console.error(`❌ Error creating ticket ${ticket.ticketNumber}:`, error);
      } else {
        console.log(`✅ Created ticket: ${ticket.ticketNumber} for ${ticket.holderName} (ID: ${id})`);
      }
    }

    // Load Shipments (linked to events)
    console.log('\n📦 Creating shipments...');
    for (const shipment of dummyShipments) {
      // Update eventId with actual ID from Firebase
      const actualEventId = eventIdMap[shipment.eventName];
      if (actualEventId) {
        shipment.eventId = actualEventId;
      }

      // Use addDoc directly since we don't have a createShipment function yet
      const { id, error } = await addDoc(collection(db, COLLECTIONS.SHIPMENTS), {
        ...shipment,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }).then(docRef => ({ id: docRef.id, error: null }))
        .catch(err => ({ id: null, error: err.message }));

      if (error) {
        console.error(`❌ Error creating shipment ${shipment.shipmentNumber}:`, error);
      } else {
        console.log(`✅ Created shipment: ${shipment.shipmentNumber} for ${shipment.eventName} (ID: ${id})`);
      }
    }

    // Create a few test users with roles for quick local testing
    try {
      console.log('\n👥 Creating test user accounts and roles...');

      const testUsers = [
        {
          name: 'Volunteer User',
          email: 'volunteer@example.com',
          password: 'volunteer123',
          roles: [
            { eventId: eventIdMap['Tech Conference 2026'], role: 'volunteer' },
            { eventId: eventIdMap['Summer Music Festival'], role: 'volunteer' }
          ]
        },
        {
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'admin123',
          roles: [
            { eventId: eventIdMap['Tech Conference 2026'], role: 'admin' }
          ]
        },
        {
          name: 'Sponsor User',
          email: 'sponsor@example.com',
          password: 'sponsor123',
          roles: [
            { eventId: eventIdMap['Summer Music Festival'], role: 'sponsor' }
          ]
        }
      ];

      for (const u of testUsers) {
        try {
          // Create auth account
          const authUser = await createUserWithEmailAndPassword(auth, u.email, u.password);
          const uid = authUser.user.uid;

          // Create Firestore user document with UID as document ID
          await setDoc(doc(db, COLLECTIONS.USERS, uid), {
            name: u.name,
            email: u.email,
            displayName: u.name,
            roles: u.roles,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          console.log(`✅ Created user: ${u.email} (Auth UID: ${uid})`);
        } catch (error) {
          // User might already exist, try to just update the Firestore doc
          if (error.code === 'auth/email-already-in-use') {
            console.log(`⚠️  User ${u.email} already exists in Auth, skipping...`);
          } else {
            console.error(`❌ Error creating user ${u.email}:`, error.message);
          }
        }
      }
    } catch (err) {
      console.error('❌ Failed to create test users:', err);
    }

    console.log('\n✨ Dummy data loaded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Events: ${dummyEvents.length}`);
    console.log(`   - Merchandise Orders: ${dummyMerchandise.length}`);
    console.log(`   - Tickets Issued: ${dummyTicketsIssued.length}`);
    console.log(`   - Shipments: ${dummyShipments.length}`);

  } catch (error) {
    console.error('\n❌ Error loading dummy data:', error);
  }
};

// Export individual data arrays for reference
export { dummyEvents, dummyMerchandise, dummyTicketsIssued, dummyShipments };
