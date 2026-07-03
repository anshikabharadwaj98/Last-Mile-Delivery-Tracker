const express = require('express');
const notificationService = require('../application/notificationService');
const assignmentService = require('../application/assignmentService');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /api/admin/audit-logs
 * @desc Retrieve all notification audit logs
 */
router.get('/audit-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const logs = await notificationService.getAuditLogs();
    res.json(logs);
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ error: 'Server error while fetching notification audit logs.' });
  }
});

/**
 * @route GET /api/admin/agents
 * @desc Get all registered delivery agents and their current workloads/zones
 */
router.get('/agents', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const agents = await assignmentService.getAllAgents();
    res.json(agents);
  } catch (err) {
    console.error('Error fetching agents:', err);
    res.status(500).json({ error: 'Server error while fetching agents.' });
  }
});

/**
 * @route GET /api/admin/customers
 * @desc Get all registered customers
 */
router.get('/customers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const customers = await assignmentService.getAllCustomers();
    res.json(customers);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Server error while fetching customers.' });
  }
});

module.exports = router;
