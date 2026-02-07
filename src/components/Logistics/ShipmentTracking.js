import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  LocalShipping as ShippingIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  DirectionsCar as TruckIcon,
  Store as WarehouseIcon,
  Home as DeliveryIcon,
  Flight as AirIcon,
} from '@mui/icons-material';
import { useAppState } from '../../context/AppStateContext';

const ShipmentTracking = () => {
  const { shipments, orders } = useAppState();
  const [selectedShipment, setSelectedShipment] = useState(null);

  // Generate mock shipment data based on orders
  const generateShipmentsFromOrders = () => {
    return orders
      .filter(order => ['Shipped', 'Delivered'].includes(order.status))
      .map(order => ({
        id: order.id,
        trackingNumber: order.trackingNumber,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        destination: order.shippingAddress || 'Customer Address',
        status: order.status === 'Shipped' ? 'In Transit' : 'Delivered',
        carrier: 'Express Logistics',
        service: order.priority === 'Urgent' ? 'Express Delivery' : 'Standard Delivery',
        estimatedDelivery: order.estimatedDelivery,
        currentLocation: order.status === 'Shipped' ? 'Distribution Hub' : 'Delivered',
        timeline: [
          {
            status: 'Package Picked Up',
            location: 'Origin Warehouse',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Package has been picked up from sender',
            completed: true,
          },
          {
            status: 'In Transit',
            location: 'Distribution Center',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Package is being transported to destination city',
            completed: true,
          },
          {
            status: 'Out for Delivery',
            location: 'Local Delivery Hub',
            timestamp: order.status === 'Delivered' ? 
              new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() : 
              new Date().toISOString(),
            description: 'Package is out for delivery to final destination',
            completed: order.status === 'Delivered',
          },
          {
            status: 'Delivered',
            location: 'Customer Address',
            timestamp: order.status === 'Delivered' ? new Date().toISOString() : null,
            description: 'Package has been delivered successfully',
            completed: order.status === 'Delivered',
          },
        ],
      }));
  };

  const shipmentData = generateShipmentsFromOrders();

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Transit': return 'primary';
      case 'Out for Delivery': return 'warning';
      case 'Delivered': return 'success';
      case 'Delayed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Package Picked Up': return <WarehouseIcon />;
      case 'In Transit': return <TruckIcon />;
      case 'Out for Delivery': return <ShippingIcon />;
      case 'Delivered': return <DeliveryIcon />;
      default: return <CheckCircleIcon />;
    }
  };

  const ShipmentCard = ({ shipment }) => (
    <Card sx={{ 
      '&:hover': { transform: 'translateY(-2px)' }, 
      transition: 'transform 0.2s',
      cursor: 'pointer' 
    }}
    onClick={() => setSelectedShipment(shipment)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="h2">
            {shipment.trackingNumber}
          </Typography>
          <Chip
            label={shipment.status}
            color={getStatusColor(shipment.status)}
            size="small"
          />
        </Box>
        
        <Typography color="text.secondary" gutterBottom>
          Order: {shipment.orderNumber}
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <LocationIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">Current: {shipment.currentLocation}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <DeliveryIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">{shipment.customerName}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <ShippingIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">{shipment.carrier} - {shipment.service}</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ScheduleIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">
              Est. Delivery: {new Date(shipment.estimatedDelivery).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          size="small"
          fullWidth
          onClick={(e) => {
            e.stopPropagation();
            setSelectedShipment(shipment);
          }}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );

  const ShipmentTimeline = ({ shipment }) => (
    <Stepper orientation="vertical" sx={{ mt: 2 }}>
      {shipment.timeline.map((step, index) => (
        <Step key={index} active={true} completed={step.completed}>
          <StepLabel
            icon={step.completed ? getStatusIcon(step.status) : <CheckCircleIcon />}
            sx={{
              '& .MuiStepLabel-iconContainer': {
                color: step.completed ? 'success.main' : 'text.secondary',
              },
            }}
          >
            <Typography variant="subtitle2">{step.status}</Typography>
            <Typography variant="caption" color="text.secondary">
              {step.location} • {step.timestamp ? new Date(step.timestamp).toLocaleString() : 'Pending'}
            </Typography>
          </StepLabel>
          <StepContent>
            <Typography variant="body2" color="text.secondary">
              {step.description}
            </Typography>
          </StepContent>
        </Step>
      ))}
    </Stepper>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          🚚 Shipment Tracking
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Real-time tracking of shipments and deliveries with detailed timeline
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {shipmentData.map((shipment) => (
          <Grid item xs={12} md={6} lg={4} key={shipment.id}>
            <ShipmentCard shipment={shipment} />
          </Grid>
        ))}
      </Grid>

      {shipmentData.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ShippingIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No shipments to track
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Shipments will appear here when orders are marked as shipped
          </Typography>
        </Box>
      )}

      {/* Shipment Details Dialog */}
      <Dialog
        open={Boolean(selectedShipment)}
        onClose={() => setSelectedShipment(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <ShippingIcon sx={{ mr: 1 }} />
          Shipment Details - {selectedShipment?.trackingNumber}
        </DialogTitle>
        <DialogContent>
          {selectedShipment && (
            <>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Order Number
                    </Typography>
                    <Typography variant="body1">{selectedShipment.orderNumber}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Customer
                    </Typography>
                    <Typography variant="body1">{selectedShipment.customerName}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Carrier
                    </Typography>
                    <Typography variant="body1">{selectedShipment.carrier}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Service Type
                    </Typography>
                    <Typography variant="body1">{selectedShipment.service}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Destination
                    </Typography>
                    <Typography variant="body1">{selectedShipment.destination}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Typography variant="h6" gutterBottom>
                📍 Tracking Timeline
              </Typography>
              <ShipmentTimeline shipment={selectedShipment} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(selectedShipment?.trackingNumber);
            }}
          >
            Copy Tracking Number
          </Button>
          <Button onClick={() => setSelectedShipment(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ShipmentTracking;