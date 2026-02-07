// Schedule Service - Hour-by-hour schedule management
import {
  createDocument,
  getDocument,
  getAllDocuments,
  updateDocument,
  deleteDocument,
  listenToCollection,
  COLLECTIONS,
  where,
  orderBy
} from './firebaseDbService';

// ========== SCHEDULE BLOCK CRUD OPERATIONS ==========

// Create a schedule block
export const createScheduleBlock = async (blockData) => {
  return createDocument(COLLECTIONS.SCHEDULE_BLOCKS, blockData);
};

// Get a single schedule block by ID
export const getScheduleBlock = async (blockId) => {
  return getDocument(COLLECTIONS.SCHEDULE_BLOCKS, blockId);
};

// Get all schedule blocks for an event
export const getAllScheduleBlocks = async (eventId) => {
  const result = await getAllDocuments(COLLECTIONS.SCHEDULE_BLOCKS, [
    where('eventId', '==', eventId)
  ]);

  // Sort on client side to avoid composite index requirement
  if (result.data && Array.isArray(result.data)) {
    result.data.sort((a, b) => {
      // First sort by day
      if (a.day !== b.day) {
        return (a.day || 1) - (b.day || 1);
      }
      // Then sort by start time
      const timeA = a.startTime?.split(':').map(Number) || [0, 0];
      const timeB = b.startTime?.split(':').map(Number) || [0, 0];
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });
  }

  return result;
};

// Get schedule blocks for a specific day
export const getScheduleBlocksByDay = async (eventId, day) => {
  const result = await getAllDocuments(COLLECTIONS.SCHEDULE_BLOCKS, [
    where('eventId', '==', eventId),
    where('day', '==', day)
  ]);

  // Sort on client side by start time
  if (result.data && Array.isArray(result.data)) {
    result.data.sort((a, b) => {
      const timeA = a.startTime?.split(':').map(Number) || [0, 0];
      const timeB = b.startTime?.split(':').map(Number) || [0, 0];
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });
  }

  return result;
};

// Update a schedule block
export const updateScheduleBlock = async (blockId, data) => {
  return updateDocument(COLLECTIONS.SCHEDULE_BLOCKS, blockId, data);
};

// Delete a schedule block
export const deleteScheduleBlock = async (blockId) => {
  return deleteDocument(COLLECTIONS.SCHEDULE_BLOCKS, blockId);
};

// Listen to all schedule blocks for an event (real-time updates)
export const listenToScheduleBlocks = (eventId, callback) => {
  return listenToCollection(
    COLLECTIONS.SCHEDULE_BLOCKS,
    [where('eventId', '==', eventId)],
    (data) => {
      // Sort on client side before passing to callback
      if (Array.isArray(data)) {
        data.sort((a, b) => {
          // First sort by day
          if (a.day !== b.day) {
            return (a.day || 1) - (b.day || 1);
          }
          // Then sort by start time
          const timeA = a.startTime?.split(':').map(Number) || [0, 0];
          const timeB = b.startTime?.split(':').map(Number) || [0, 0];
          return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
        });
      }
      callback(data);
    }
  );
};

// ========== HELPER FUNCTIONS ==========

// Check if a time slot conflicts with existing blocks
export const checkTimeSlotConflict = async (eventId, location, day, startTime, endTime, excludeBlockId = null) => {
  try {
    const { data: blocks } = await getScheduleBlocksByDay(eventId, day);

    if (!blocks || blocks.length === 0) {
      return { hasConflict: false, conflictingBlocks: [] };
    }

    const conflictingBlocks = blocks.filter(block => {
      // Skip the block being edited
      if (excludeBlockId && block.id === excludeBlockId) {
        return false;
      }

      // Check if same location
      if (block.location !== location) {
        return false;
      }

      // Convert times to minutes for comparison
      const blockStart = timeToMinutes(block.startTime);
      const blockEnd = timeToMinutes(block.endTime);
      const newStart = timeToMinutes(startTime);
      const newEnd = timeToMinutes(endTime);

      // Check for overlap
      return (newStart < blockEnd && newEnd > blockStart);
    });

    return {
      hasConflict: conflictingBlocks.length > 0,
      conflictingBlocks
    };
  } catch (error) {
    console.error('Error checking time slot conflict:', error);
    return { hasConflict: false, conflictingBlocks: [], error: error.message };
  }
};

// Get schedule formatted as a grid for UI display
export const getScheduleGrid = async (eventId, day) => {
  try {
    const { data: blocks } = await getScheduleBlocksByDay(eventId, day);

    if (!blocks) {
      return { data: [], error: 'No blocks found' };
    }

    // Group blocks by track for parallel sessions
    const tracks = {};
    blocks.forEach(block => {
      const track = block.track || 'Main';
      if (!tracks[track]) {
        tracks[track] = [];
      }
      tracks[track].push(block);
    });

    return { data: tracks, error: null };
  } catch (error) {
    console.error('Error getting schedule grid:', error);
    return { data: {}, error: error.message };
  }
};

// Register a user for a session
export const registerForSession = async (blockId, userId, userName) => {
  try {
    const { data: block } = await getScheduleBlock(blockId);

    if (!block) {
      return { error: 'Schedule block not found' };
    }

    if (!block.requiresRegistration) {
      return { error: 'This session does not require registration' };
    }

    // Check capacity
    if (block.capacity && block.registered >= block.capacity) {
      return { error: 'Session is full' };
    }

    // Check if already registered
    const registeredUsers = block.registeredUsers || [];
    if (registeredUsers.includes(userId)) {
      return { error: 'Already registered for this session' };
    }

    // Update block with new registration
    await updateScheduleBlock(blockId, {
      registered: (block.registered || 0) + 1,
      registeredUsers: [...registeredUsers, userId]
    });

    return { error: null };
  } catch (error) {
    console.error('Error registering for session:', error);
    return { error: error.message };
  }
};

// Unregister a user from a session
export const unregisterFromSession = async (blockId, userId) => {
  try {
    const { data: block } = await getScheduleBlock(blockId);

    if (!block) {
      return { error: 'Schedule block not found' };
    }

    const registeredUsers = block.registeredUsers || [];
    if (!registeredUsers.includes(userId)) {
      return { error: 'Not registered for this session' };
    }

    // Update block
    await updateScheduleBlock(blockId, {
      registered: Math.max(0, (block.registered || 0) - 1),
      registeredUsers: registeredUsers.filter(id => id !== userId)
    });

    return { error: null };
  } catch (error) {
    console.error('Error unregistering from session:', error);
    return { error: error.message };
  }
};

// Get parallel sessions at a specific time
export const getParallelSessions = async (eventId, day, timeSlot) => {
  try {
    const { data: blocks } = await getScheduleBlocksByDay(eventId, day);

    if (!blocks) {
      return { data: [], error: 'No blocks found' };
    }

    // Find sessions that overlap with the given time slot
    const timeInMinutes = timeToMinutes(timeSlot);
    const parallelSessions = blocks.filter(block => {
      const blockStart = timeToMinutes(block.startTime);
      const blockEnd = timeToMinutes(block.endTime);
      return timeInMinutes >= blockStart && timeInMinutes < blockEnd;
    });

    return { data: parallelSessions, error: null };
  } catch (error) {
    console.error('Error getting parallel sessions:', error);
    return { data: [], error: error.message };
  }
};

// ========== UTILITY FUNCTIONS ==========

// Convert time string (HH:MM) to minutes since midnight
const timeToMinutes = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Convert minutes since midnight to time string (HH:MM)
export const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Calculate duration between two times in minutes
export const calculateDuration = (startTime, endTime) => {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
};

// Validate time format (HH:MM)
export const isValidTimeFormat = (timeString) => {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(timeString);
};

// Check if start time is before end time
export const isValidTimeRange = (startTime, endTime) => {
  return timeToMinutes(startTime) < timeToMinutes(endTime);
};
