const { User, DeliveryAgent } = require('../models');

class AgentService {
  async updateAgentLocation(agentId, { latitude, longitude, current_zone_id, current_hub_prefix }) {
    if (!agentId) {
      throw new Error('Agent ID is required.');
    }

    const agentUser = await User.findOne({
      where: { id: agentId, role: 'delivery_agent' },
      include: [{ model: DeliveryAgent, as: 'deliveryAgent' }]
    });

    if (!agentUser) {
      throw new Error('Agent not found.');
    }

    let agentProfile = agentUser.deliveryAgent;
    if (!agentProfile) {
      agentProfile = await DeliveryAgent.create({ user_id: agentUser.id });
    }

    const targetZoneId = (current_zone_id || current_hub_prefix || '').trim();

    agentProfile.latitude = latitude ? parseFloat(latitude) : null;
    agentProfile.longitude = longitude ? parseFloat(longitude) : null;
    agentProfile.current_zone_id = targetZoneId || null;
    agentProfile.is_available = Boolean(targetZoneId);
    await agentProfile.save();

    return await User.findOne({
      where: { id: agentId },
      include: [{ model: DeliveryAgent, as: 'deliveryAgent' }]
    });
  }
}

module.exports = new AgentService();
