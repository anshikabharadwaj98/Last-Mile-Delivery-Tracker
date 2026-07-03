const express = require('express');
const orderService = require('../application/orderService');
const pricingService = require('../application/pricingService');
const { authenticateToken, requireAdmin, requireCustomer } = require('../middleware/auth');

const router = express.Router();

/**
 * @route POST /api/orders/calculate
 * @desc Previews pricing calculations before confirming order creation
 */
router.post('/calculate', authenticateToken, async (req, res) => {
  try {
    const breakdown = await pricingService.calculateCharges(req.body);
    res.json(breakdown);
  } catch (err) {
    console.error('Pricing preview error:', err);
    res.status(400).json({ error: err.message || 'Error calculating order charges.' });
  }
});

/**
 * @route POST /api/orders
 * @desc Creates a new delivery order. Supports Admin creation on behalf of customers.
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const data = await orderService.createOrder(req.body, req.user);
    res.status(201).json({
      message: 'Order created successfully!',
      ...data
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(400).json({ error: err.message || 'Error creating order.' });
  }
});

/**
 * @route GET /api/orders
 * @desc Returns list of orders scoped by user role. Admins can filter results.
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const orders = await orderService.getOrdersList(req.user, req.query);
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders list:', err);
    res.status(500).json({ error: 'Server error while fetching orders.' });
  }
});

/**
 * @route GET /api/orders/:id
 * @desc Get detailed order view including timeline tracking history
 */
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const data = await orderService.getOrderDetails(id, req.user);
    res.json({
      ...data.order.get({ plain: true }),
      history: data.timeline
    });
  } catch (err) {
    console.error('Error fetching order details:', err);
    res.status(400).json({ error: err.message || 'Error while fetching order details.' });
  }
});

/**
 * @route POST /api/orders/:id/assign
 * @desc Assigns an agent manually or triggers auto-assignment (Admin only)
 */
router.post('/:id/assign', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { agent_id, auto } = req.body;

  try {
    const data = await orderService.assignAgent(id, agent_id, auto, req.user);
    res.json({
      message: 'Agent assigned successfully!',
      ...data
    });
  } catch (err) {
    console.error('Assignment error:', err);
    res.status(400).json({ error: err.message || 'Error during assignment.' });
  }
});

/**
 * @route PUT /api/orders/:id/status
 * @desc Update order status. Allowed for assigned Agent and Admin.
 */
router.put('/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status, failed_reason } = req.body;

  try {
    const order = await orderService.updateOrderStatus(id, status, failed_reason, req.user);
    res.json({
      message: `Order status updated to "${status}".`,
      order
    });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(400).json({ error: err.message || 'Error while updating order status.' });
  }
});

/**
 * @route POST /api/orders/:id/reschedule
 * @desc Reschedules a failed order for a new date. Triggers agent auto-assignment. (Customer only)
 */
router.post('/:id/reschedule', authenticateToken, requireCustomer, async (req, res) => {
  const { id } = req.params;
  const { reschedule_date } = req.body;

  try {
    const data = await orderService.rescheduleOrder(id, reschedule_date, req.user);
    res.json({
      message: 'Order rescheduled successfully! A fresh agent has been assigned.',
      ...data
    });
  } catch (err) {
    console.error('Rescheduling error:', err);
    res.status(400).json({ error: err.message || 'Error while rescheduling order.' });
  }
});

module.exports = router;
