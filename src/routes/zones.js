const express = require('express');
const zoneRepository = require('../repositories/zoneRepository');
const adminService = require('../application/adminService');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /api/zones
 * @desc Get all zones with their corresponding areas
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const zones = await zoneRepository.findAllZones();
    res.json(zones);
  } catch (err) {
    console.error('Error fetching zones:', err);
    res.status(500).json({ error: 'Server error while fetching zones.' });
  }
});

/**
 * @route POST /api/zones
 * @desc Create a new zone (Admin only)
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const zone = await adminService.createZone(req.body);
    res.status(201).json({
      message: 'Zone created successfully!',
      zone
    });
  } catch (err) {
    console.error('Error creating zone:', err);
    res.status(400).json({ error: err.message || 'Error creating zone.' });
  }
});

/**
 * @route POST /api/zones/areas
 * @desc Add an area (postal code) to a zone (Admin only)
 */
router.post('/areas', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const area = await adminService.assignAreaToZone(req.body);
    res.status(201).json({
      message: 'Area added to zone successfully!',
      area
    });
  } catch (err) {
    console.error('Error adding area to zone:', err);
    res.status(400).json({ error: err.message || 'Error adding area.' });
  }
});

module.exports = router;
