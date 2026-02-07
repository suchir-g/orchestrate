// Volunteer Service - Volunteer management and assignment
import {
  createDocument,
  getDocument,
  getAllDocuments,
  updateDocument,
  deleteDocument,
  listenToCollection,
  COLLECTIONS,
  where,
  orderBy,
  arrayUnion,
  arrayRemove
} from './firebaseDbService';

// ========== VOLUNTEER CRUD OPERATIONS ==========

// Create a volunteer
export const createVolunteer = async (volunteerData) => {
  return createDocument(COLLECTIONS.VOLUNTEERS, volunteerData);
};

// Get a single volunteer by ID
export const getVolunteer = async (volunteerId) => {
  return getDocument(COLLECTIONS.VOLUNTEERS, volunteerId);
};

// Get all volunteers for an event
export const getAllVolunteers = async (eventId) => {
  return getAllDocuments(COLLECTIONS.VOLUNTEERS, [
    where('eventId', '==', eventId),
    orderBy('name', 'asc')
  ]);
};

// Update a volunteer
export const updateVolunteer = async (volunteerId, data) => {
  return updateDocument(COLLECTIONS.VOLUNTEERS, volunteerId, data);
};

// Delete a volunteer
export const deleteVolunteer = async (volunteerId) => {
  return deleteDocument(COLLECTIONS.VOLUNTEERS, volunteerId);
};

// Listen to all volunteers for an event (real-time updates)
export const listenToVolunteers = (eventId, callback) => {
  return listenToCollection(
    COLLECTIONS.VOLUNTEERS,
    [where('eventId', '==', eventId), orderBy('name', 'asc')],
    callback
  );
};

// ========== ASSIGNMENT OPERATIONS ==========

// Assign a volunteer to a task
export const assignVolunteerToTask = async (volunteerId, taskId, timeSlotId, location) => {
  try {
    const { data: volunteer } = await getVolunteer(volunteerId);

    if (!volunteer) {
      return { error: 'Volunteer not found' };
    }

    // Create assignment object
    const assignment = {
      taskId,
      timeSlotId,
      location,
      status: 'assigned',
      assignedAt: new Date().toISOString()
    };

    // Add assignment to volunteer's assignments array
    const currentAssignments = volunteer.assignments || [];

    // Check if already assigned to this task/timeslot
    const existing = currentAssignments.find(
      a => a.taskId === taskId && a.timeSlotId === timeSlotId
    );

    if (existing) {
      return { error: 'Volunteer already assigned to this task/time slot' };
    }

    await updateVolunteer(volunteerId, {
      assignments: [...currentAssignments, assignment]
    });

    return { error: null, assignment };
  } catch (error) {
    console.error('Error assigning volunteer to task:', error);
    return { error: error.message };
  }
};

// Unassign a volunteer from a task
export const unassignVolunteerFromTask = async (volunteerId, taskId, timeSlotId) => {
  try {
    const { data: volunteer } = await getVolunteer(volunteerId);

    if (!volunteer) {
      return { error: 'Volunteer not found' };
    }

    const currentAssignments = volunteer.assignments || [];
    const updatedAssignments = currentAssignments.filter(
      a => !(a.taskId === taskId && a.timeSlotId === timeSlotId)
    );

    await updateVolunteer(volunteerId, {
      assignments: updatedAssignments
    });

    return { error: null };
  } catch (error) {
    console.error('Error unassigning volunteer from task:', error);
    return { error: error.message };
  }
};

// Update assignment status
export const updateAssignmentStatus = async (volunteerId, taskId, timeSlotId, newStatus) => {
  try {
    const { data: volunteer } = await getVolunteer(volunteerId);

    if (!volunteer) {
      return { error: 'Volunteer not found' };
    }

    const currentAssignments = volunteer.assignments || [];
    const updatedAssignments = currentAssignments.map(assignment => {
      if (assignment.taskId === taskId && assignment.timeSlotId === timeSlotId) {
        return { ...assignment, status: newStatus };
      }
      return assignment;
    });

    await updateVolunteer(volunteerId, {
      assignments: updatedAssignments
    });

    return { error: null };
  } catch (error) {
    console.error('Error updating assignment status:', error);
    return { error: error.message };
  }
};

// ========== BACKGROUND CHECK OPERATIONS ==========

// Update background check status
export const updateBackgroundCheckStatus = async (volunteerId, status, completedDate = null, expiryDate = null) => {
  try {
    const backgroundCheck = {
      status,
      ...(completedDate && { completedDate }),
      ...(expiryDate && { expiryDate })
    };

    await updateVolunteer(volunteerId, { backgroundCheck });
    return { error: null };
  } catch (error) {
    console.error('Error updating background check status:', error);
    return { error: error.message };
  }
};

// ========== QUERY HELPERS ==========

// Get volunteers by availability (specific date and time range)
export const getVolunteersByAvailability = async (eventId, date, startTime, endTime) => {
  try {
    const { data: volunteers } = await getAllVolunteers(eventId);

    if (!volunteers) {
      return { data: [], error: 'No volunteers found' };
    }

    // Filter volunteers who are available at the specified date/time
    const availableVolunteers = volunteers.filter(volunteer => {
      const availability = volunteer.availability || [];

      return availability.some(slot => {
        // Check if date matches
        const slotDate = new Date(slot.date).toDateString();
        const targetDate = new Date(date).toDateString();

        if (slotDate !== targetDate) {
          return false;
        }

        // Check if available
        if (!slot.available) {
          return false;
        }

        // Check if time range overlaps
        const slotStart = timeToMinutes(slot.startTime);
        const slotEnd = timeToMinutes(slot.endTime);
        const targetStart = timeToMinutes(startTime);
        const targetEnd = timeToMinutes(endTime);

        return targetStart >= slotStart && targetEnd <= slotEnd;
      });
    });

    return { data: availableVolunteers, error: null };
  } catch (error) {
    console.error('Error getting volunteers by availability:', error);
    return { data: [], error: error.message };
  }
};

// Get volunteers by skills
export const getVolunteersBySkill = async (eventId, requiredSkills) => {
  try {
    const { data: volunteers } = await getAllVolunteers(eventId);

    if (!volunteers) {
      return { data: [], error: 'No volunteers found' };
    }

    // Filter volunteers who have at least one of the required skills
    const matchingVolunteers = volunteers.filter(volunteer => {
      const volunteerSkills = volunteer.skills || [];
      return requiredSkills.some(skill => volunteerSkills.includes(skill));
    });

    // Sort by number of matching skills (most matches first)
    matchingVolunteers.sort((a, b) => {
      const aMatches = (a.skills || []).filter(s => requiredSkills.includes(s)).length;
      const bMatches = (b.skills || []).filter(s => requiredSkills.includes(s)).length;
      return bMatches - aMatches;
    });

    return { data: matchingVolunteers, error: null };
  } catch (error) {
    console.error('Error getting volunteers by skill:', error);
    return { data: [], error: error.message };
  }
};

// Get volunteers by role
export const getVolunteersByRole = async (eventId, role) => {
  return getAllDocuments(COLLECTIONS.VOLUNTEERS, [
    where('eventId', '==', eventId),
    where('role', '==', role),
    orderBy('name', 'asc')
  ]);
};

// Get volunteers by check-in status
export const getVolunteersByCheckInStatus = async (eventId, checkInStatus) => {
  return getAllDocuments(COLLECTIONS.VOLUNTEERS, [
    where('eventId', '==', eventId),
    where('checkInStatus', '==', checkInStatus),
    orderBy('name', 'asc')
  ]);
};

// Get unassigned volunteers (no assignments)
export const getUnassignedVolunteers = async (eventId) => {
  try {
    const { data: volunteers } = await getAllVolunteers(eventId);

    if (!volunteers) {
      return { data: [], error: 'No volunteers found' };
    }

    const unassigned = volunteers.filter(volunteer => {
      const assignments = volunteer.assignments || [];
      return assignments.length === 0;
    });

    return { data: unassigned, error: null };
  } catch (error) {
    console.error('Error getting unassigned volunteers:', error);
    return { data: [], error: error.message };
  }
};

// ========== STATISTICS ==========

// Get volunteer statistics for an event
export const getVolunteerStats = async (eventId) => {
  try {
    const { data: volunteers } = await getAllVolunteers(eventId);

    if (!volunteers) {
      return {
        data: { total: 0, confirmed: 0, checkedIn: 0, assigned: 0 },
        error: null
      };
    }

    const stats = {
      total: volunteers.length,
      confirmed: volunteers.filter(v => v.status === 'confirmed').length,
      checkedIn: volunteers.filter(v => v.checkInStatus === 'checked_in').length,
      assigned: volunteers.filter(v => (v.assignments || []).length > 0).length,
      unassigned: volunteers.filter(v => (v.assignments || []).length === 0).length,
      byRole: {},
      bySkill: {}
    };

    // Count by role
    volunteers.forEach(v => {
      const role = v.role || 'unspecified';
      stats.byRole[role] = (stats.byRole[role] || 0) + 1;
    });

    // Count by skill
    volunteers.forEach(v => {
      (v.skills || []).forEach(skill => {
        stats.bySkill[skill] = (stats.bySkill[skill] || 0) + 1;
      });
    });

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error getting volunteer stats:', error);
    return { data: null, error: error.message };
  }
};

// ========== UTILITY FUNCTIONS ==========

// Convert time string (HH:MM) to minutes since midnight
const timeToMinutes = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Calculate total hours worked by a volunteer
export const calculateVolunteerHours = (volunteer) => {
  const assignments = volunteer.assignments || [];

  // This is a simplified calculation
  // In a real implementation, you'd track actual clock-in/clock-out times
  return assignments.filter(a => a.status === 'completed').length * 3; // Assume 3 hours per shift
};

// Check if volunteer has required skills
export const hasRequiredSkills = (volunteer, requiredSkills) => {
  const volunteerSkills = volunteer.skills || [];
  return requiredSkills.every(skill => volunteerSkills.includes(skill));
};
