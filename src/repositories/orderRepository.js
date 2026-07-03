const { Order, User, Zone, DeliveryAgent, OrderStatusHistory } = require('../models');

class OrderRepository {
  async findById(id) {
    const order = await Order.findOne({
      where: { id },
      include: [
        { model: User, as: 'customer', attributes: ['id', 'name', 'email', 'phone'] },
        {
          model: User,
          as: 'agent',
          attributes: ['id', 'name', 'email', 'phone'],
          include: [{ model: DeliveryAgent, as: 'deliveryAgent', attributes: ['latitude', 'longitude', 'current_zone_id'] }]
        },
        { model: Zone, as: 'pickupZoneRef' },
        { model: Zone, as: 'dropZoneRef' },
        {
          model: OrderStatusHistory,
          as: 'history',
          include: [{ model: User, as: 'actor', attributes: ['id', 'name', 'role'] }]
        }
      ],
      order: [[{ model: OrderStatusHistory, as: 'history' }, 'timestamp', 'ASC']]
    });

    if (order && order.agent && order.agent.deliveryAgent) {
      order.agent.setDataValue('latitude', order.agent.deliveryAgent.latitude);
      order.agent.setDataValue('longitude', order.agent.deliveryAgent.longitude);
      order.agent.setDataValue('current_zone_id', order.agent.deliveryAgent.current_zone_id);
    }
    return order;
  }

  async findAll(options = {}) {
    return await Order.findAll({
      where: options.where || {},
      include: [
        { model: User, as: 'customer', attributes: ['id', 'name', 'email', 'phone'] },
        { model: User, as: 'agent', attributes: ['id', 'name', 'email', 'phone'] },
        { model: Zone, as: 'pickupZoneRef' },
        { model: Zone, as: 'dropZoneRef' }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  async create(orderData) {
    return await Order.create(orderData);
  }

  async save(orderInstance) {
    return await orderInstance.save();
  }

  async countActiveJobsForAgent(agentId) {
    const { Op } = require('sequelize');
    return await Order.count({
      where: {
        assigned_agent_id: agentId,
        current_status: {
          [Op.in]: ['Pending', 'Assigned', 'Picked Up', 'In Transit', 'Out for Delivery']
        }
      }
    });
  }
}

module.exports = new OrderRepository();
