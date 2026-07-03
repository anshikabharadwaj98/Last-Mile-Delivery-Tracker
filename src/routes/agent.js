const express = require('express');
const agentService = require('../application/agentService');
const { authenticateToken, requireAgent } = require('../middleware/auth');

const router = express.Router();

router.put('/location', authenticateToken, requireAgent, async (req, res) => {
  try {
    const agent = await agentService.updateAgentLocation(req.user.id, req.body);
    const profile = agent.deliveryAgent;

    res.json({
      message: 'Agent location and zone updated successfully!',
      agent: {
        id: agent.id,
        name: agent.name,
        latitude: profile ? profile.latitude : null,
        longitude: profile ? profile.longitude : null,
        current_zone_id: profile ? profile.current_zone_id : null
      }
    });
  } catch (err) {
    console.error('Error updating agent location:', err);
    res.status(400).json({ error: err.message || 'Error while updating location.' });
  }
});

module.exports = router;
