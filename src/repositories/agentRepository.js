const { User, DeliveryAgent, Zone } = require('../models');

class AgentRepository {
  async findAllAgents() {
    const users = await User.findAll({
      where: { role: 'delivery_agent' },
      include: [
        {
          model: DeliveryAgent,
          as: 'deliveryAgent',
          include: [{ model: Zone, as: 'currentZone', attributes: ['id', 'name', 'code'] }]
        }
      ],
      attributes: ['id', 'name', 'email', 'phone', 'is_active'],
      order: [['name', 'ASC']]
    });

    return users.map(user => {
      const plain = user.get({ plain: true });
      const agentDetails = plain.deliveryAgent || {};

      return {
        id: plain.id,
        name: plain.name,
        email: plain.email,
        phone: plain.phone,
        is_active: plain.is_active,
        latitude: agentDetails.latitude,
        longitude: agentDetails.longitude,
        current_zone_id: agentDetails.current_zone_id,
        current_hub_prefix: agentDetails.current_zone_id,
        is_available: agentDetails.is_available,
        currentZone: agentDetails.currentZone ? {
          id: agentDetails.currentZone.id,
          name: agentDetails.currentZone.name,
          code: agentDetails.currentZone.code
        } : null
      };
    });
  }

  async findAgentById(id) {
    return await User.findOne({
      where: { id, role: 'delivery_agent' },
      include: [{ model: DeliveryAgent, as: 'deliveryAgent' }]
    });
  }

  async findAllCustomers() {
    return await User.findAll({
      where: { role: 'customer' },
      attributes: ['id', 'name', 'email', 'phone', 'is_active', 'customer_type'],
      order: [['name', 'ASC']]
    });
  }
}

module.exports = new AgentRepository();
