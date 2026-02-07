import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Chip,
  Box,
  Divider
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as PendingIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const RequestStatusTracker = ({ itemRequests = [], volunteerRequests = [] }) => {
  // Combine and sort all requests by date
  const allRequests = [
    ...itemRequests.map(r => ({ ...r, type: 'item' })),
    ...volunteerRequests.map(r => ({ ...r, type: 'volunteer' }))
  ].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckIcon sx={{ color: '#00ff88' }} />;
      case 'rejected':
        return <CancelIcon sx={{ color: '#ff6b9d' }} />;
      case 'pending':
        return <PendingIcon sx={{ color: '#ffa500' }} />;
      default:
        return <InfoIcon sx={{ color: '#00d4ff' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getRequestTitle = (request) => {
    if (request.type === 'item') {
      return `${request.itemName} (${request.quantity} ${request.unit})`;
    } else {
      return `${request.taskType} - ${request.requiredCount} volunteer${request.requiredCount > 1 ? 's' : ''}`;
    }
  };

  if (allRequests.length === 0) {
    return (
      <Card>
        <CardHeader title="Request Timeline" />
        <Divider />
        <CardContent>
          <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
            No requests yet. Submit your first item or volunteer request!
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Request Timeline & Status" />
      <Divider />
      <CardContent>
        <Timeline position="alternate">
          {allRequests.map((request, index) => (
            <TimelineItem key={request.id}>
              <TimelineSeparator>
                <TimelineDot>
                  {getStatusIcon(request.status)}
                </TimelineDot>
                {index < allRequests.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent sx={{ py: 2 }}>
                <Box
                  sx={{
                    background: 'rgba(0, 212, 255, 0.05)',
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    borderRadius: 2,
                    padding: 2
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {getRequestTitle(request)}
                    </Typography>
                    <Chip
                      label={request.status}
                      color={getStatusColor(request.status)}
                      size="small"
                      icon={getStatusIcon(request.status)}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Type: {request.type === 'item' ? 'Item Contribution' : 'Volunteer Request'}
                  </Typography>

                  {request.type === 'item' && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Category: {request.category}
                      </Typography>
                      {request.description && (
                        <Typography variant="body2" color="text.secondary">
                          {request.description}
                        </Typography>
                      )}
                    </>
                  )}

                  {request.type === 'volunteer' && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Location: {request.location}
                      </Typography>
                      {request.timeSlot && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          Time: {request.timeSlot.startTime} - {request.timeSlot.endTime}
                        </Typography>
                      )}
                      {request.description && (
                        <Typography variant="body2" color="text.secondary">
                          {request.description}
                        </Typography>
                      )}
                    </>
                  )}

                  {request.status === 'pending' && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#ffa500' }}>
                      ⏳ Awaiting approval from event organizers
                    </Typography>
                  )}

                  {request.status === 'approved' && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#00ff88' }}>
                      ✓ Approved and confirmed
                    </Typography>
                  )}

                  {request.status === 'rejected' && (
                    <>
                      <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#ff6b9d' }}>
                        ✗ Request was declined
                      </Typography>
                      {request.rejectionReason && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#ff6b9d' }}>
                          Reason: {request.rejectionReason}
                        </Typography>
                      )}
                    </>
                  )}
                </Box>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  );
};

export default RequestStatusTracker;
