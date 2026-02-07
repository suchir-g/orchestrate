// Volunteer Task Service - Task definitions and time slot management
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

// ========== VOLUNTEER TASK CRUD OPERATIONS ==========

// Create a volunteer task
export const createVolunteerTask = async (taskData) => {
  // Initialize timeSlots if not provided
  const task = {
    ...taskData,
    timeSlots: taskData.timeSlots || []
  };

  return createDocument(COLLECTIONS.VOLUNTEER_TASKS, task);
};

// Get a single volunteer task by ID
export const getVolunteerTask = async (taskId) => {
  return getDocument(COLLECTIONS.VOLUNTEER_TASKS, taskId);
};

// Get all volunteer tasks for an event
export const getAllVolunteerTasks = async (eventId) => {
  return getAllDocuments(COLLECTIONS.VOLUNTEER_TASKS, [
    where('eventId', '==', eventId),
    orderBy('priority', 'asc'),
    orderBy('name', 'asc')
  ]);
};

// Get volunteer tasks by category
export const getVolunteerTasksByCategory = async (eventId, category) => {
  return getAllDocuments(COLLECTIONS.VOLUNTEER_TASKS, [
    where('eventId', '==', eventId),
    where('category', '==', category),
    orderBy('priority', 'asc')
  ]);
};

// Get volunteer tasks by priority
export const getVolunteerTasksByPriority = async (eventId, priority) => {
  return getAllDocuments(COLLECTIONS.VOLUNTEER_TASKS, [
    where('eventId', '==', eventId),
    where('priority', '==', priority),
    orderBy('name', 'asc')
  ]);
};

// Update a volunteer task
export const updateVolunteerTask = async (taskId, data) => {
  return updateDocument(COLLECTIONS.VOLUNTEER_TASKS, taskId, data);
};

// Delete a volunteer task
export const deleteVolunteerTask = async (taskId) => {
  return deleteDocument(COLLECTIONS.VOLUNTEER_TASKS, taskId);
};

// Listen to all volunteer tasks for an event (real-time updates)
export const listenToVolunteerTasks = (eventId, callback) => {
  return listenToCollection(
    COLLECTIONS.VOLUNTEER_TASKS,
    [where('eventId', '==', eventId), orderBy('priority', 'asc')],
    callback
  );
};

// ========== TIME SLOT OPERATIONS ==========

// Add a time slot to a task
export const addTimeSlot = async (taskId, timeSlotData) => {
  try {
    const { data: task } = await getVolunteerTask(taskId);

    if (!task) {
      return { error: 'Task not found' };
    }

    // Generate time slot ID
    const timeSlotId = `slot_${Date.now()}`;
    const newTimeSlot = {
      id: timeSlotId,
      ...timeSlotData,
      assignedVolunteers: timeSlotData.assignedVolunteers || [],
      status: 'open'
    };

    const updatedTimeSlots = [...(task.timeSlots || []), newTimeSlot];

    await updateVolunteerTask(taskId, {
      timeSlots: updatedTimeSlots
    });

    return { error: null, timeSlot: newTimeSlot };
  } catch (error) {
    console.error('Error adding time slot:', error);
    return { error: error.message };
  }
};

// Update a specific time slot
export const updateTimeSlot = async (taskId, timeSlotId, updates) => {
  try {
    const { data: task } = await getVolunteerTask(taskId);

    if (!task) {
      return { error: 'Task not found' };
    }

    const updatedTimeSlots = (task.timeSlots || []).map(slot =>
      slot.id === timeSlotId ? { ...slot, ...updates } : slot
    );

    await updateVolunteerTask(taskId, {
      timeSlots: updatedTimeSlots
    });

    return { error: null };
  } catch (error) {
    console.error('Error updating time slot:', error);
    return { error: error.message };
  }
};

// Update time slot status
export const updateTimeSlotStatus = async (taskId, timeSlotId, newStatus) => {
  return updateTimeSlot(taskId, timeSlotId, { status: newStatus });
};

// Delete a time slot
export const deleteTimeSlot = async (taskId, timeSlotId) => {
  try {
    const { data: task } = await getVolunteerTask(taskId);

    if (!task) {
      return { error: 'Task not found' };
    }

    const updatedTimeSlots = (task.timeSlots || []).filter(slot => slot.id !== timeSlotId);

    await updateVolunteerTask(taskId, {
      timeSlots: updatedTimeSlots
    });

    return { error: null };
  } catch (error) {
    console.error('Error deleting time slot:', error);
    return { error: error.message };
  }
};

// Assign a volunteer to a time slot
export const assignVolunteerToTimeSlot = async (taskId, timeSlotId, volunteerId) => {
  try {
    const { data: task } = await getVolunteerTask(taskId);

    if (!task) {
      return { error: 'Task not found' };
    }

    const updatedTimeSlots = (task.timeSlots || []).map(slot => {
      if (slot.id === timeSlotId) {
        const assignedVolunteers = slot.assignedVolunteers || [];

        // Check if already assigned
        if (assignedVolunteers.includes(volunteerId)) {
          return slot;
        }

        // Check if slot is full
        if (assignedVolunteers.length >= slot.requiredVolunteers) {
          return slot; // Don't add if full
        }

        const newAssignedVolunteers = [...assignedVolunteers, volunteerId];

        // Update status based on assignments
        let newStatus = 'open';
        if (newAssignedVolunteers.length === slot.requiredVolunteers) {
          newStatus = 'filled';
        } else if (newAssignedVolunteers.length > 0) {
          newStatus = 'partially_filled';
        }

        return {
          ...slot,
          assignedVolunteers: newAssignedVolunteers,
          status: newStatus
        };
      }
      return slot;
    });

    await updateVolunteerTask(taskId, {
      timeSlots: updatedTimeSlots
    });

    return { error: null };
  } catch (error) {
    console.error('Error assigning volunteer to time slot:', error);
    return { error: error.message };
  }
};

// Unassign a volunteer from a time slot
export const unassignVolunteerFromTimeSlot = async (taskId, timeSlotId, volunteerId) => {
  try {
    const { data: task } = await getVolunteerTask(taskId);

    if (!task) {
      return { error: 'Task not found' };
    }

    const updatedTimeSlots = (task.timeSlots || []).map(slot => {
      if (slot.id === timeSlotId) {
        const newAssignedVolunteers = (slot.assignedVolunteers || []).filter(
          id => id !== volunteerId
        );

        // Update status based on assignments
        let newStatus = 'open';
        if (newAssignedVolunteers.length === slot.requiredVolunteers) {
          newStatus = 'filled';
        } else if (newAssignedVolunteers.length > 0) {
          newStatus = 'partially_filled';
        }

        return {
          ...slot,
          assignedVolunteers: newAssignedVolunteers,
          status: newStatus
        };
      }
      return slot;
    });

    await updateVolunteerTask(taskId, {
      timeSlots: updatedTimeSlots
    });

    return { error: null };
  } catch (error) {
    console.error('Error unassigning volunteer from time slot:', error);
    return { error: error.message };
  }
};

// ========== QUERY HELPERS ==========

// Get unfilled time slots (open or partially filled)
export const getUnfilledTimeSlots = async (eventId) => {
  try {
    const { data: tasks } = await getAllVolunteerTasks(eventId);

    if (!tasks) {
      return { data: [], error: 'No tasks found' };
    }

    const unfilledSlots = [];

    tasks.forEach(task => {
      (task.timeSlots || []).forEach(slot => {
        if (slot.status === 'open' || slot.status === 'partially_filled') {
          unfilledSlots.push({
            taskId: task.id,
            taskName: task.name,
            taskLocation: task.location,
            taskPriority: task.priority,
            ...slot
          });
        }
      });
    });

    // Sort by priority (urgent first)
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    unfilledSlots.sort((a, b) => priorityOrder[a.taskPriority] - priorityOrder[b.taskPriority]);

    return { data: unfilledSlots, error: null };
  } catch (error) {
    console.error('Error getting unfilled time slots:', error);
    return { data: [], error: error.message };
  }
};

// Get critical gaps (urgent tasks with no volunteers assigned)
export const getCriticalGaps = async (eventId) => {
  try {
    const { data: tasks } = await getVolunteerTasksByPriority(eventId, 'urgent');

    if (!tasks) {
      return { data: [], error: 'No urgent tasks found' };
    }

    const criticalGaps = [];

    tasks.forEach(task => {
      (task.timeSlots || []).forEach(slot => {
        const assignedCount = (slot.assignedVolunteers || []).length;
        if (assignedCount === 0) {
          criticalGaps.push({
            taskId: task.id,
            taskName: task.name,
            taskLocation: task.location,
            timeSlotId: slot.id,
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            requiredVolunteers: slot.requiredVolunteers
          });
        }
      });
    });

    return { data: criticalGaps, error: null };
  } catch (error) {
    console.error('Error getting critical gaps:', error);
    return { data: [], error: error.message };
  }
};

// Get time slots by date
export const getTimeSlotsByDate = async (eventId, targetDate) => {
  try {
    const { data: tasks } = await getAllVolunteerTasks(eventId);

    if (!tasks) {
      return { data: [], error: 'No tasks found' };
    }

    const slotsForDate = [];
    const targetDateString = new Date(targetDate).toDateString();

    tasks.forEach(task => {
      (task.timeSlots || []).forEach(slot => {
        const slotDateString = new Date(slot.date).toDateString();
        if (slotDateString === targetDateString) {
          slotsForDate.push({
            taskId: task.id,
            taskName: task.name,
            taskLocation: task.location,
            taskCategory: task.category,
            taskPriority: task.priority,
            ...slot
          });
        }
      });
    });

    // Sort by start time
    slotsForDate.sort((a, b) => {
      const aMinutes = timeToMinutes(a.startTime);
      const bMinutes = timeToMinutes(b.startTime);
      return aMinutes - bMinutes;
    });

    return { data: slotsForDate, error: null };
  } catch (error) {
    console.error('Error getting time slots by date:', error);
    return { data: [], error: error.message };
  }
};

// ========== STATISTICS ==========

// Get task statistics for an event
export const getTaskStats = async (eventId) => {
  try {
    const { data: tasks } = await getAllVolunteerTasks(eventId);

    if (!tasks) {
      return {
        data: { totalTasks: 0, totalTimeSlots: 0, filled: 0, unfilled: 0 },
        error: null
      };
    }

    let totalTimeSlots = 0;
    let filledSlots = 0;
    let partiallyFilledSlots = 0;
    let openSlots = 0;

    tasks.forEach(task => {
      (task.timeSlots || []).forEach(slot => {
        totalTimeSlots++;
        if (slot.status === 'filled') filledSlots++;
        if (slot.status === 'partially_filled') partiallyFilledSlots++;
        if (slot.status === 'open') openSlots++;
      });
    });

    const stats = {
      totalTasks: tasks.length,
      totalTimeSlots,
      filledSlots,
      partiallyFilledSlots,
      openSlots,
      fillRate: totalTimeSlots > 0 ? (filledSlots / totalTimeSlots * 100).toFixed(1) : 0,
      byCategory: {},
      byPriority: {}
    };

    // Count by category and priority
    tasks.forEach(task => {
      const category = task.category || 'unspecified';
      const priority = task.priority || 'medium';

      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
    });

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error getting task stats:', error);
    return { data: null, error: error.message };
  }
};

// ========== UTILITY FUNCTIONS ==========

// Convert time string (HH:MM) to minutes since midnight
const timeToMinutes = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Check if a time slot is fully staffed
export const isTimeSlotFullyStaffed = (timeSlot) => {
  const assigned = (timeSlot.assignedVolunteers || []).length;
  return assigned >= timeSlot.requiredVolunteers;
};

// Calculate staff shortfall for a time slot
export const calculateStaffShortfall = (timeSlot) => {
  const assigned = (timeSlot.assignedVolunteers || []).length;
  return Math.max(0, timeSlot.requiredVolunteers - assigned);
};
