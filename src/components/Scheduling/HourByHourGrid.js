import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
} from '@mui/icons-material';

const HourByHourGrid = ({ dayBlocks, currentDay, eventId, onEditBlock, onDeleteBlock }) => {
  // Generate time slots from 8 AM to 10 PM (14 hours)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 8; hour <= 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  // Get unique tracks
  const tracks = useMemo(() => {
    const trackSet = new Set(dayBlocks.map(block => block.track || 'Main'));
    return Array.from(trackSet);
  }, [dayBlocks]);

  // Convert time string to minutes since midnight
  const timeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Calculate position and height of a block
  const getBlockStyle = (block) => {
    const startMinutes = timeToMinutes(block.startTime);
    const endMinutes = timeToMinutes(block.endTime);
    const duration = endMinutes - startMinutes;

    // Grid starts at 8:00 AM (480 minutes)
    const gridStartMinutes = 8 * 60;
    const top = ((startMinutes - gridStartMinutes) / 60) * 80; // 80px per hour
    const height = (duration / 60) * 80;

    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  // Get block color based on type
  const getTypeColor = (type) => {
    switch (type) {
      case 'keynote': return 'rgba(255, 107, 157, 0.9)';
      case 'workshop': return 'rgba(0, 212, 255, 0.9)';
      case 'session': return 'rgba(76, 175, 80, 0.9)';
      case 'break': return 'rgba(158, 158, 158, 0.9)';
      case 'meal': return 'rgba(255, 152, 0, 0.9)';
      default: return 'rgba(33, 150, 243, 0.9)';
    }
  };

  // Group blocks by track
  const blocksByTrack = useMemo(() => {
    const grouped = {};
    tracks.forEach(track => {
      grouped[track] = dayBlocks.filter(block => (block.track || 'Main') === track);
    });
    return grouped;
  }, [dayBlocks, tracks]);

  return (
    <Paper
      sx={{
        p: 3,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        overflow: 'auto',
      }}
    >
      <Box sx={{ display: 'flex', minWidth: tracks.length * 300 + 100 }}>
        {/* Time column */}
        <Box sx={{ width: 100, flexShrink: 0, position: 'relative' }}>
          <Box sx={{ height: 60, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Typography variant="caption" sx={{ p: 1 }}>
              Time
            </Typography>
          </Box>
          {timeSlots.map((time, index) => (
            <Box
              key={time}
              sx={{
                height: 80,
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                px: 1,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {time}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Track columns */}
        {tracks.map(track => (
          <Box
            key={track}
            sx={{
              flex: 1,
              minWidth: 300,
              position: 'relative',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Track header */}
            <Box
              sx={{
                height: 60,
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(45deg, rgba(0, 212, 255, 0.1) 30%, rgba(255, 107, 157, 0.1) 90%)',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {track}
              </Typography>
            </Box>

            {/* Time grid */}
            <Box sx={{ position: 'relative' }}>
              {timeSlots.map((time, index) => (
                <Box
                  key={time}
                  sx={{
                    height: 80,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                />
              ))}

              {/* Schedule blocks */}
              {blocksByTrack[track]?.map(block => (
                <Box
                  key={block.id}
                  sx={{
                    position: 'absolute',
                    left: 8,
                    right: 8,
                    ...getBlockStyle(block),
                    background: getTypeColor(block.type),
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: 2,
                    p: 1.5,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                      zIndex: 10,
                    },
                  }}
                  onClick={() => onEditBlock(block)}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 0.5 }}>
                    <Chip
                      label={block.type}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                      }}
                    />
                    <Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditBlock(block);
                        }}
                        sx={{
                          color: 'white',
                          width: 24,
                          height: 24,
                          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                        }}
                      >
                        <EditIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteBlock(block.id);
                        }}
                        sx={{
                          color: 'white',
                          width: 24,
                          height: 24,
                          '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.3)' },
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: 'white',
                      mb: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {block.title}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    ⏰ {block.startTime} - {block.endTime}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    📍 {block.location}
                  </Typography>

                  {block.speakers && block.speakers.length > 0 && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      🎤 {block.speakers.map(s => s.name).join(', ')}
                    </Typography>
                  )}

                  {block.capacity && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <PeopleIcon sx={{ fontSize: 14, color: 'white', mr: 0.5 }} />
                      <Typography variant="caption" sx={{ color: 'white' }}>
                        {block.registered || 0}/{block.capacity}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>

      {dayBlocks.length === 0 && (
        <Box
          sx={{
            p: 8,
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" color="text.secondary">
            No schedule blocks for this day
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Click the + button to add your first schedule block
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default HourByHourGrid;
