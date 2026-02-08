import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Fab,
  Tab,
  Tabs,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  ShoppingCart as OrderIcon,
  LocalShipping as ShippingIcon,
  Inventory as InventoryIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  DirectionsCar as TruckIcon,
  Store as WarehouseIcon,
  Home as DeliveryIcon,
} from '@mui/icons-material';
import { useAppState } from '../../context/AppStateContext';
import { useAuth } from '../../context/AuthContext';
import { canManageCollaborators } from '../../services/accessControlService';
import toast from 'react-hot-toast';

const LogisticsTracker = () => {
  const { orders, addOrder, updateOrder } = useAppState();
  const { user } = useAuth();
  const { userRole } = useAuth();
  const [mainTabValue, setMainTabValue] = useState(0);
  const [orderTabValue, setOrderTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerEmail: '',
    items: '',
    totalAmount: '',
    shippingAddress: '',
    priority: 'Normal',
  });

  const priorityLevels = ['Low', 'Normal', 'High', 'Urgent'];

  // Generate shipment data based on shipped/delivered orders
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

  // Map of eventId -> boolean whether current user can manage collaborators
  const [manageMap, setManageMap] = useState({});

  useEffect(() => {
    const loadPermissions = async () => {
      if (!user) return;
      const events = Array.from(new Set(orders.map(o => o.eventId).filter(Boolean)));
      const map = {};
      await Promise.all(events.map(async (ev) => {
        try {
          const ok = await canManageCollaborators(ev, user.uid, userRole);
          map[ev] = Boolean(ok);
        } catch (e) {
          map[ev] = false;
        }
      }));
      setManageMap(map);
    };
    loadPermissions();
  }, [orders, user, userRole]);

  const handleCreateOrder = async () => {
    if (!user) {
      toast.error('Please sign in to create orders');
      return;
    }

    if (!newOrder.customerName || !newOrder.items || !newOrder.totalAmount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const orderData = {
        orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
        ...newOrder,
        createdBy: user.uid,
        status: 'Pending',
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        trackingNumber: `TRK${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        timeline: [
          {
            status: 'Order Placed',
            timestamp: new Date().toISOString(),
            description: 'Order has been placed and is pending confirmation',
            location: 'Order Management System',
          },
        ],
      };

      await addOrder(orderData);
      toast.success('Order created successfully!');

      setNewOrder({
        customerName: '',
        customerEmail: '',
        items: '',
        totalAmount: '',
        shippingAddress: '',
        priority: 'Normal',
      });
      setOpenDialog(false);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
    }
  };

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const statusDescriptions = {
      'Confirmed': 'Order confirmed and payment processed',
      'Processing': 'Order is being prepared and packed',
      'Shipped': 'Order has been shipped and is in transit',
      'Delivered': 'Order has been delivered to customer',
      'Cancelled': 'Order has been cancelled',
    };

    const updatedTimeline = [...order.timeline];
    updatedTimeline.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      description: statusDescriptions[newStatus] || `Status changed to ${newStatus}`,
      location: newStatus === 'Shipped' ? 'Distribution Center' : 'Warehouse',
    });

    updateOrder({
      ...order,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      timeline: updatedTimeline,
    });

    toast.success(`Order status updated to ${newStatus}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'default';
      case 'Confirmed': return 'primary';
      case 'Processing': return 'info';
      case 'Shipped': return 'warning';
      case 'In Transit': return 'primary';
      case 'Delivered': return 'success';
      case 'Out for Delivery': return 'warning';
      case 'Cancelled': return 'error';
      case 'Delayed': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low': return 'default';
      case 'Normal': return 'primary';
      case 'High': return 'warning';
      case 'Urgent': return 'error';
      default: return 'default';
    }
  };

  const getProgressValue = (status) => {
    const statusProgress = {
      'Pending': 10,
      'Confirmed': 25,
      'Processing': 50,
      'Shipped': 75,
      'Delivered': 100,
      'Cancelled': 0,
    };
    return statusProgress[status] || 0;
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

  // Order Card Component
  const OrderCard = ({ order }) => (
    <Card sx={{
      height: '100%',
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      borderRadius: 2,
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      },
      transition: 'all 0.3s ease-in-out'
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" component="h2">
              {order.orderNumber}
            </Typography>
            {order.eventName && (
              <Typography variant="caption" color="primary" display="block">
                📅 Event: {order.eventName}
              </Typography>
            )}
            {order.supplier && (
              <Typography variant="caption" color="text.secondary" display="block">
                🏢 Supplier: {order.supplier}
              </Typography>
            )}
          </Box>
          <Box>
            <Chip
              label={order.status}
              color={getStatusColor(order.status)}
              size="small"
              sx={{ mr: 1 }}
            />
            <Chip
              label={order.priority}
              color={getPriorityColor(order.priority)}
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={getProgressValue(order.status)}
            sx={{ height: 8, borderRadius: 5 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {getProgressValue(order.status)}% Complete
          </Typography>
        </Box>
        
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <PersonIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">{order.customerName}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
            <InventoryIcon sx={{ fontSize: 16, mr: 1, mt: 0.5, color: 'text.secondary' }} />
            <Box>
              {Array.isArray(order.items) ? (
                <>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {order.itemType || 'Items'}:
                  </Typography>
                  {order.items.map((item, idx) => (
                    <Typography key={idx} variant="body2">
                      {item.quantity}x {item.name}
                    </Typography>
                  ))}
                </>
              ) : (
                <Typography variant="body2">{order.items}</Typography>
              )}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>💰 ${order.totalAmount}</Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <ScheduleIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">
              Est. Delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ShippingIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2">Tracking: {order.trackingNumber}</Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 2 }}>
          {order.status !== 'Delivered' && order.status !== 'Cancelled' && (manageMap[order.eventId]) && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                const nextStatus = order.status === 'Pending' ? 'Confirmed' : 
                                 order.status === 'Confirmed' ? 'Processing' :
                                 order.status === 'Processing' ? 'Shipped' : 'Delivered';
                handleUpdateOrderStatus(order.id, nextStatus);
              }}
              sx={{ mr: 1 }}
            >
              Next Stage
            </Button>
          )}
          <Button
            variant="text"
            size="small"
            onClick={() => {
              navigator.clipboard.writeText(order.trackingNumber);
              toast.success('Tracking number copied!');
            }}
          >
            Copy Tracking
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  // Shipment Card Component
  const ShipmentCard = ({ shipment }) => (
    <Card sx={{ 
      '&:hover': { transform: 'translateY(-2px)' }, 
      transition: 'transform 0.2s',
      cursor: 'pointer',
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      borderRadius: 2,
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

  // Shipment Timeline Component
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
          📦 Logistics Tracker
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Unified order and shipment management with real-time tracking
        </Typography>
      </Box>

      {/* Main Tab Navigation */}
      <Paper sx={{
        mb: 3,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        borderRadius: 2,
      }}>
        <Tabs value={mainTabValue} onChange={(e, newValue) => setMainTabValue(newValue)}>
          <Tab label={`📋 Orders (${orders.length})`} />
          <Tab label={`🚚 Shipments (${shipmentData.length})`} />
        </Tabs>
      </Paper>

      {/* ORDERS TAB */}
      {mainTabValue === 0 && (
        <Box>
          <Paper sx={{
            mb: 3,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
          }}>
            <Tabs value={orderTabValue} onChange={(e, newValue) => setOrderTabValue(newValue)}>
              <Tab label="All Orders" />
              <Tab label="Active Orders" />
              <Tab label="Shipped Orders" />
              <Tab label="Delivered Orders" />
            </Tabs>
          </Paper>

          <Grid container spacing={3}>
            {orders
              .filter(order => {
                switch (orderTabValue) {
                  case 1: return ['Pending', 'Confirmed', 'Processing'].includes(order.status);
                  case 2: return order.status === 'Shipped';
                  case 3: return order.status === 'Delivered';
                  default: return true;
                }
              })
              .map((order) => (
                <Grid item xs={12} md={6} lg={4} key={order.id}>
                  <OrderCard order={order} />
                </Grid>
              ))}
          </Grid>

          {orders.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <OrderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No orders created yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first order to start tracking and managing orders
              </Typography>
              <Button variant="contained" onClick={() => setOpenDialog(true)}>
                Create First Order
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* SHIPMENTS TAB */}
      {mainTabValue === 1 && (
        <Box>
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
        </Box>
      )}

      {/* Create Order Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>📦 Create New Order</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Customer Name *"
            fullWidth
            variant="outlined"
            value={newOrder.customerName}
            onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Customer Email"
            type="email"
            fullWidth
            variant="outlined"
            value={newOrder.customerEmail}
            onChange={(e) => setNewOrder({ ...newOrder, customerEmail: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Items *"
            fullWidth
            variant="outlined"
            value={newOrder.items}
            onChange={(e) => setNewOrder({ ...newOrder, items: e.target.value })}
            placeholder="e.g., 2x T-shirts, 1x Jeans"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Total Amount (USD) *"
            type="number"
            fullWidth
            variant="outlined"
            value={newOrder.totalAmount}
            onChange={(e) => setNewOrder({ ...newOrder, totalAmount: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Shipping Address"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newOrder.shippingAddress}
            onChange={(e) => setNewOrder({ ...newOrder, shippingAddress: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            select
            margin="dense"
            label="Priority"
            fullWidth
            variant="outlined"
            value={newOrder.priority}
            onChange={(e) => setNewOrder({ ...newOrder, priority: e.target.value })}
            SelectProps={{
              native: true,
            }}
          >
            {priorityLevels.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateOrder} variant="contained">
            Create Order
          </Button>
        </DialogActions>
      </Dialog>

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

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add order"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setOpenDialog(true)}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
};

export default LogisticsTracker;
