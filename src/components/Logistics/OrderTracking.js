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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stepper,
  Step,
  StepLabel,
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
} from '@mui/icons-material';
import { useAppState } from '../../context/AppStateContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const OrderTracking = () => {
  const { orders, addOrder, updateOrder, setLoading } = useAppState();
  const { user } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerEmail: '',
    items: '',
    totalAmount: '',
    shippingAddress: '',
    priority: 'Normal',
  });

  const orderStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  const priorityLevels = ['Low', 'Normal', 'High', 'Urgent'];

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
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
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
      case 'Delivered': return 'success';
      case 'Cancelled': return 'error';
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
          {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          📦 Order Tracking & Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Track and manage customer orders with real-time status updates
        </Typography>
      </Box>

      <Paper sx={{
        mb: 3,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        borderRadius: 2,
      }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="All Orders" />
          <Tab label="Active Orders" />
          <Tab label="Shipped Orders" />
          <Tab label="Delivered Orders" />
        </Tabs>
      </Paper>

      <Grid container spacing={3}>
        {orders
          .filter(order => {
            switch (tabValue) {
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

export default OrderTracking;