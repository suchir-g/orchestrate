import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  Stack
} from '@mui/material';
import { useAppState } from '../../context/AppStateContext';
import * as authService from '../../services/authorizationService';

const ItemRequestForm = ({ eventId, onSubmit, onCancel }) => {
  const { state } = useAppState();

  const [formData, setFormData] = useState({
    itemName: '',
    category: 'food',
    quantity: 1,
    unit: 'units',
    description: '',
    relatedScheduleBlocks: []
  });

  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);

  const categories = [
    'food',
    'equipment',
    'signage',
    'supplies',
    'furniture',
    'decorations',
    'other'
  ];

  const units = ['units', 'packs', 'boxes', 'kg', 'liters', 'gallons'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleValidate = async () => {
    setLoading(true);
    try {
      // Get existing items for the event
      const existingItems = state.providedItems || [];

      // Validate against existing items
      const validation = authService.validateSponsorItemRequest(formData, existingItems);

      setConflicts(validation.conflicts);
      return validation.isValid;
    } catch (error) {
      console.error('Error validating item request:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const isValid = await handleValidate();

    if (!isValid && conflicts.length > 0) {
      // Show conflicts but allow user to proceed if they want
      const shouldContinue = window.confirm(
        `There are ${conflicts.length} potential conflict(s) with existing items. Continue anyway?`
      );
      if (!shouldContinue) return;
    }

    onSubmit({
      ...formData,
      eventId
    });
  };

  return (
    <>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Request Item Contribution
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2}>
          {conflicts.length > 0 && (
            <Alert severity="warning">
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Potential Conflicts:
              </Typography>
              {conflicts.map((conflict, idx) => (
                <Typography key={idx} variant="caption" display="block" sx={{ mb: 0.5 }}>
                  • {conflict.message}
                </Typography>
              ))}
            </Alert>
          )}

          <TextField
            label="Item Name"
            name="itemName"
            value={formData.itemName}
            onChange={handleChange}
            fullWidth
            placeholder="e.g., Vegetarian Pizza (20 boxes)"
          />

          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={formData.category}
              onChange={handleChange}
              label="Category"
            >
              {categories.map(cat => (
                <MenuItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Quantity"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange}
              inputProps={{ min: 1 }}
              sx={{ flex: 1 }}
            />
            <FormControl sx={{ flex: 1 }}>
              <InputLabel>Unit</InputLabel>
              <Select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                label="Unit"
              >
                {units.map(unit => (
                  <MenuItem key={unit} value={unit}>
                    {unit}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TextField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
            placeholder="Provide additional details about your item contribution..."
          />

          <TextField
            label="Delivery Date/Time"
            name="deliveryDateTime"
            type="datetime-local"
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Delivery Location"
            name="deliveryLocation"
            fullWidth
            placeholder="Where should the item be delivered?"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.itemName || loading}
        >
          {loading ? 'Validating...' : 'Submit Request'}
        </Button>
      </DialogActions>
    </>
  );
};

export default ItemRequestForm;
