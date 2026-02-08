import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import {
  listenToUserEvents,
  listenToUserOrders,
  createEventWithCollaboration,
  createOrder,
  updateEvent as updateEventInDb,
  updateOrder as updateOrderInDb
} from '../services/firebaseDbService';
import { listenToScheduleBlocks } from '../services/scheduleService';
import { listenToVolunteers } from '../services/volunteerService';
import { listenToVolunteerTasks } from '../services/volunteerTaskService';
import { initializeActivityTracking, clearActivities } from '../services/activityService';
import { getUserAccessibleEvents } from '../services/accessControlService';
import { useAuth } from './AuthContext';

const AppStateContext = createContext();

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};

// Initial state
const initialState = {
  events: [],
  orders: [],
  shipments: [],
  // Hackathon-specific state
  scheduleBlocks: [],
  volunteers: [],
  volunteerTasks: [],
  volunteerPredictions: null,
  analytics: {
    totalEvents: 0,
    totalOrders: 0,
    totalShipments: 0,
  },
  predictions: {
    deliveryPredictions: [],
    eventPredictions: [],
    demandForecasts: [],
  },
  volunteerStats: {
    totalRequired: 0,
    totalRegistered: 0,
    totalConfirmed: 0,
    gapCount: 0,
  },
  loading: {
    events: false,
    orders: false,
    shipments: false,
    scheduleBlocks: false,
    volunteers: false,
    volunteerTasks: false,
  },
  selectedEventId: null,
};

// Action types
const ActionTypes = {
  SET_EVENTS: 'SET_EVENTS',
  ADD_EVENT: 'ADD_EVENT',
  UPDATE_EVENT: 'UPDATE_EVENT',
  SET_ORDERS: 'SET_ORDERS',
  ADD_ORDER: 'ADD_ORDER',
  UPDATE_ORDER: 'UPDATE_ORDER',
  SET_SHIPMENTS: 'SET_SHIPMENTS',
  ADD_SHIPMENT: 'ADD_SHIPMENT',
  UPDATE_SHIPMENT: 'UPDATE_SHIPMENT',
  SET_ANALYTICS: 'SET_ANALYTICS',
  SET_PREDICTIONS: 'SET_PREDICTIONS',
  SET_LOADING: 'SET_LOADING',
  // Hackathon-specific action types
  SET_SCHEDULE_BLOCKS: 'SET_SCHEDULE_BLOCKS',
  ADD_SCHEDULE_BLOCK: 'ADD_SCHEDULE_BLOCK',
  UPDATE_SCHEDULE_BLOCK: 'UPDATE_SCHEDULE_BLOCK',
  DELETE_SCHEDULE_BLOCK: 'DELETE_SCHEDULE_BLOCK',
  SET_VOLUNTEERS: 'SET_VOLUNTEERS',
  ADD_VOLUNTEER: 'ADD_VOLUNTEER',
  UPDATE_VOLUNTEER: 'UPDATE_VOLUNTEER',
  DELETE_VOLUNTEER: 'DELETE_VOLUNTEER',
  SET_VOLUNTEER_TASKS: 'SET_VOLUNTEER_TASKS',
  ADD_VOLUNTEER_TASK: 'ADD_VOLUNTEER_TASK',
  UPDATE_VOLUNTEER_TASK: 'UPDATE_VOLUNTEER_TASK',
  DELETE_VOLUNTEER_TASK: 'DELETE_VOLUNTEER_TASK',
  SET_VOLUNTEER_PREDICTIONS: 'SET_VOLUNTEER_PREDICTIONS',
  SET_VOLUNTEER_STATS: 'SET_VOLUNTEER_STATS',
  SET_SELECTED_EVENT_ID: 'SET_SELECTED_EVENT_ID',
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_EVENTS:
      return { ...state, events: action.payload };
    case ActionTypes.ADD_EVENT:
      return { ...state, events: [...state.events, action.payload] };
    case ActionTypes.UPDATE_EVENT:
      return {
        ...state,
        events: state.events.map(event =>
          event.id === action.payload.id ? action.payload : event
        )
      };
    case ActionTypes.SET_ORDERS:
      return { ...state, orders: action.payload };
    case ActionTypes.ADD_ORDER:
      return { ...state, orders: [...state.orders, action.payload] };
    case ActionTypes.UPDATE_ORDER:
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.id ? action.payload : order
        )
      };
    case ActionTypes.SET_SHIPMENTS:
      return { ...state, shipments: action.payload };
    case ActionTypes.ADD_SHIPMENT:
      return { ...state, shipments: [...state.shipments, action.payload] };
    case ActionTypes.UPDATE_SHIPMENT:
      return {
        ...state,
        shipments: state.shipments.map(shipment =>
          shipment.id === action.payload.id ? action.payload : shipment
        )
      };
    case ActionTypes.SET_ANALYTICS:
      return { ...state, analytics: { ...state.analytics, ...action.payload } };
    case ActionTypes.SET_PREDICTIONS:
      return { ...state, predictions: { ...state.predictions, ...action.payload } };
    case ActionTypes.SET_LOADING:
      return { ...state, loading: { ...state.loading, ...action.payload } };

    // Hackathon-specific reducer cases
    case ActionTypes.SET_SCHEDULE_BLOCKS:
      return { ...state, scheduleBlocks: action.payload };
    case ActionTypes.ADD_SCHEDULE_BLOCK:
      return { ...state, scheduleBlocks: [...state.scheduleBlocks, action.payload] };
    case ActionTypes.UPDATE_SCHEDULE_BLOCK:
      return {
        ...state,
        scheduleBlocks: state.scheduleBlocks.map(block =>
          block.id === action.payload.id ? action.payload : block
        )
      };
    case ActionTypes.DELETE_SCHEDULE_BLOCK:
      return {
        ...state,
        scheduleBlocks: state.scheduleBlocks.filter(block => block.id !== action.payload)
      };

    case ActionTypes.SET_VOLUNTEERS:
      return { ...state, volunteers: action.payload };
    case ActionTypes.ADD_VOLUNTEER:
      return { ...state, volunteers: [...state.volunteers, action.payload] };
    case ActionTypes.UPDATE_VOLUNTEER:
      return {
        ...state,
        volunteers: state.volunteers.map(volunteer =>
          volunteer.id === action.payload.id ? action.payload : volunteer
        )
      };
    case ActionTypes.DELETE_VOLUNTEER:
      return {
        ...state,
        volunteers: state.volunteers.filter(volunteer => volunteer.id !== action.payload)
      };

    case ActionTypes.SET_VOLUNTEER_TASKS:
      return { ...state, volunteerTasks: action.payload };
    case ActionTypes.ADD_VOLUNTEER_TASK:
      return { ...state, volunteerTasks: [...state.volunteerTasks, action.payload] };
    case ActionTypes.UPDATE_VOLUNTEER_TASK:
      return {
        ...state,
        volunteerTasks: state.volunteerTasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        )
      };
    case ActionTypes.DELETE_VOLUNTEER_TASK:
      return {
        ...state,
        volunteerTasks: state.volunteerTasks.filter(task => task.id !== action.payload)
      };

    case ActionTypes.SET_VOLUNTEER_PREDICTIONS:
      return { ...state, volunteerPredictions: action.payload };
    case ActionTypes.SET_VOLUNTEER_STATS:
      return { ...state, volunteerStats: { ...state.volunteerStats, ...action.payload } };

    case ActionTypes.SET_SELECTED_EVENT_ID:
      return { ...state, selectedEventId: action.payload };
    default:
      return state;
  }
};

export const AppStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user, userRole } = useAuth();

  // Action creators
  const actions = useMemo(() => ({
    setEvents: (events) => dispatch({ type: ActionTypes.SET_EVENTS, payload: events }),
    addEvent: async (event) => {
      // Write to Firestore with RBAC fields - listeners will update local state
      if (!user) {
        console.error('User must be authenticated to create events');
        return { id: null, error: 'User not authenticated' };
      }
      const { id, error } = await createEventWithCollaboration(event, user.uid);
      if (error) {
        console.error('Error creating event:', error);
        throw new Error(error);
      }
      return { id, error };
    },
    updateEvent: async (event) => {
      const { id, ...updateData } = event;
      const { error } = await updateEventInDb(id, updateData);
      if (error) {
        console.error('Error updating event:', error);
        throw new Error(error);
      }
      return { error };
    },
    setOrders: (orders) => dispatch({ type: ActionTypes.SET_ORDERS, payload: orders }),
    addOrder: async (order) => {
      // Write to Firestore - listeners will update local state
      const { id, error } = await createOrder(order);
      if (error) {
        console.error('Error creating order:', error);
        throw new Error(error);
      }
      return { id, error };
    },
    updateOrder: async (order) => {
      const { id, ...updateData } = order;
      const { error } = await updateOrderInDb(id, updateData);
      if (error) {
        console.error('Error updating order:', error);
        throw new Error(error);
      }
      return { error };
    },
    setShipments: (shipments) => dispatch({ type: ActionTypes.SET_SHIPMENTS, payload: shipments }),
    addShipment: (shipment) => dispatch({ type: ActionTypes.ADD_SHIPMENT, payload: shipment }),
    updateShipment: (shipment) => dispatch({ type: ActionTypes.UPDATE_SHIPMENT, payload: shipment }),
    // Ticket functions removed - now using NFT blockchain ticketing system
    setAnalytics: (analytics) => dispatch({ type: ActionTypes.SET_ANALYTICS, payload: analytics }),
    setPredictions: (predictions) => dispatch({ type: ActionTypes.SET_PREDICTIONS, payload: predictions }),
    setLoading: (loading) => dispatch({ type: ActionTypes.SET_LOADING, payload: loading }),
    // Hackathon-specific action creators
    setScheduleBlocks: (blocks) => dispatch({ type: ActionTypes.SET_SCHEDULE_BLOCKS, payload: blocks }),
    addScheduleBlock: (block) => dispatch({ type: ActionTypes.ADD_SCHEDULE_BLOCK, payload: block }),
    updateScheduleBlock: (block) => dispatch({ type: ActionTypes.UPDATE_SCHEDULE_BLOCK, payload: block }),
    deleteScheduleBlock: (blockId) => dispatch({ type: ActionTypes.DELETE_SCHEDULE_BLOCK, payload: blockId }),
    setVolunteers: (volunteers) => dispatch({ type: ActionTypes.SET_VOLUNTEERS, payload: volunteers }),
    addVolunteer: (volunteer) => dispatch({ type: ActionTypes.ADD_VOLUNTEER, payload: volunteer }),
    updateVolunteer: (volunteer) => dispatch({ type: ActionTypes.UPDATE_VOLUNTEER, payload: volunteer }),
    deleteVolunteer: (volunteerId) => dispatch({ type: ActionTypes.DELETE_VOLUNTEER, payload: volunteerId }),
    setVolunteerTasks: (tasks) => dispatch({ type: ActionTypes.SET_VOLUNTEER_TASKS, payload: tasks }),
    addVolunteerTask: (task) => dispatch({ type: ActionTypes.ADD_VOLUNTEER_TASK, payload: task }),
    updateVolunteerTask: (task) => dispatch({ type: ActionTypes.UPDATE_VOLUNTEER_TASK, payload: task }),
    deleteVolunteerTask: (taskId) => dispatch({ type: ActionTypes.DELETE_VOLUNTEER_TASK, payload: taskId }),
    setVolunteerPredictions: (predictions) => dispatch({ type: ActionTypes.SET_VOLUNTEER_PREDICTIONS, payload: predictions }),
    setVolunteerStats: (stats) => dispatch({ type: ActionTypes.SET_VOLUNTEER_STATS, payload: stats }),
    setSelectedEventId: (eventId) => dispatch({ type: ActionTypes.SET_SELECTED_EVENT_ID, payload: eventId }),
  }), [user]);

  // Listen to Firebase real-time updates
  useEffect(() => {
    // Only set up listeners if user is authenticated
    if (!user) {
      console.log('⏸️  No user authenticated, skipping Firebase listeners');
      // Clear state when user logs out
      dispatch({ type: ActionTypes.SET_EVENTS, payload: [] });
      dispatch({ type: ActionTypes.SET_ORDERS, payload: [] });
      dispatch({ type: ActionTypes.SET_TICKETS, payload: [] });
      // Note: We don't clear activities on logout to preserve history
      return;
    }

    console.log('🔥 Setting up user-scoped Firebase listeners for user:', user.uid);

    // Fetch ALL accessible events (including collaborated, volunteer, sponsor events)
    const fetchAccessibleEvents = async () => {
      const currentUserRole = userRole || 'attendee';
      const { data: accessibleEvents, error } = await getUserAccessibleEvents(user.uid, currentUserRole);

      if (!error && accessibleEvents) {
        console.log(`📅 Accessible events loaded for role "${currentUserRole}":`, accessibleEvents.length);
        dispatch({ type: ActionTypes.SET_EVENTS, payload: accessibleEvents });
      } else if (error) {
        console.error('Error loading accessible events:', error);
      }
    };

    // Initial fetch
    fetchAccessibleEvents();

    // Set up real-time listener for user's owned events (for immediate updates)
    const unsubscribeEvents = listenToUserEvents(user.uid, (ownedEvents) => {
      console.log('📅 User owned events updated from Firebase:', ownedEvents.length);
      // Re-fetch all accessible events to include collaborated events
      fetchAccessibleEvents();
    });

    // Periodic refresh for collaborated events (every 30 seconds)
    const refreshInterval = setInterval(fetchAccessibleEvents, 30000);

    // Listen to user's orders
    const unsubscribeOrders = listenToUserOrders(user.uid, (orders) => {
      console.log('📦 User orders updated from Firebase:', orders.length);
      dispatch({ type: ActionTypes.SET_ORDERS, payload: orders });
    });

    // Initialize activity tracking (removed 'tickets' - now using NFT system)
    const unsubscribeActivities = initializeActivityTracking(user.uid, ['events', 'orders']);

    // TODO: Add event selection state and enable hackathon listeners
    // Once we have a selectedEventId state, uncomment these listeners:
    //
    // const unsubscribeScheduleBlocks = listenToScheduleBlocks(selectedEventId, (blocks) => {
    //   console.log('📅 Schedule blocks updated:', blocks.length);
    //   dispatch({ type: ActionTypes.SET_SCHEDULE_BLOCKS, payload: blocks });
    // });
    //
    // const unsubscribeVolunteers = listenToVolunteers(selectedEventId, (volunteers) => {
    //   console.log('👥 Volunteers updated:', volunteers.length);
    //   dispatch({ type: ActionTypes.SET_VOLUNTEERS, payload: volunteers });
    // });
    //
    // const unsubscribeVolunteerTasks = listenToVolunteerTasks(selectedEventId, (tasks) => {
    //   console.log('📋 Volunteer tasks updated:', tasks.length);
    //   dispatch({ type: ActionTypes.SET_VOLUNTEER_TASKS, payload: tasks });
    // });

    // Cleanup listeners on unmount
    return () => {
      console.log('🔥 Cleaning up user-scoped Firebase listeners...');
      unsubscribeEvents();
      unsubscribeOrders();
      unsubscribeActivities();
      clearInterval(refreshInterval);
      // Add cleanup for hackathon listeners when enabled:
      // unsubscribeScheduleBlocks();
      // unsubscribeVolunteers();
      // unsubscribeVolunteerTasks();
    };
  }, [user, userRole]); // Re-run when user changes (login/logout) or role changes

  // Listener for selected event data (Sub-collections)
  useEffect(() => {
    if (!user || !state.selectedEventId) return;

    console.log('🔄 Setting up event listeners for:', state.selectedEventId);

    const unsubscribeScheduleBlocks = listenToScheduleBlocks(state.selectedEventId, (blocks) => {
      // console.log('📅 Schedule blocks updated:', blocks.length);
      dispatch({ type: ActionTypes.SET_SCHEDULE_BLOCKS, payload: blocks });
    });

    const unsubscribeVolunteers = listenToVolunteers(state.selectedEventId, (volunteers) => {
      // console.log('👥 Volunteers updated:', volunteers.length);
      dispatch({ type: ActionTypes.SET_VOLUNTEERS, payload: volunteers });
    });

    const unsubscribeVolunteerTasks = listenToVolunteerTasks(state.selectedEventId, (tasks) => {
      // console.log('📋 Volunteer tasks updated:', tasks.length);
      dispatch({ type: ActionTypes.SET_VOLUNTEER_TASKS, payload: tasks });
    });

    return () => {
      console.log('Cleaning up event listeners');
      unsubscribeScheduleBlocks();
      unsubscribeVolunteers();
      unsubscribeVolunteerTasks();
    };
  }, [user, state.selectedEventId]);

  const value = {
    ...state,
    ...actions,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};