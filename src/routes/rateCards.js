const express = require('express');
const pricingService = require('../application/pricingService');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /api/rate-cards
 * @desc Get all rate cards and dynamic COD surcharge settings
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const data = await pricingService.getRateCardsAndCODRules();
    res.json(data);
  } catch (err) {
    console.error('Error fetching rate cards:', err);
    res.status(500).json({ error: 'Server error while fetching configurations.' });
  }
});

/**
 * @route POST /api/rate-cards
 * @desc Create or update a rate card (Admin only)
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rateCard = await pricingService.saveRateCard(req.body);
    res.status(201).json({
      message: 'Rate card configuration saved successfully!',
      rateCard
    });
  } catch (err) {
    console.error('Error saving rate card:', err);
    res.status(400).json({ error: err.message || 'Error saving rate card.' });
  }
});

/**
 * @route POST /api/rate-cards/settings
 * @desc Create or update a COD rule surcharge amount (Admin only)
 */
router.post('/settings', authenticateToken, requireAdmin, async (req, res) => {
  const { key, value, description } = req.body;

  try {
    // Check if key is standard COD surcharge format
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Setting key and value are required.' });
    }

    let orderType = 'B2C';
    if (key.includes('B2B')) orderType = 'B2B';

    const rule = await pricingService.saveCODRule(orderType, value, description);
    res.json({
      message: `COD surcharge for ${orderType} updated successfully!`,
      setting: {
        key,
        value: String(rule.surcharge_amount),
        description: rule.description
      }
    });
  } catch (err) {
    console.error('Error saving COD surcharge:', err);
    res.status(400).json({ error: err.message || 'Error saving COD setting.' });
  }
});

module.exports = router;
