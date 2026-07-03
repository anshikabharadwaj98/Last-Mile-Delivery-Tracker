const { OrderStatusHistory, User } = require('../models');

class TrackingRepository {
  /**
   * Logs a state mutation into the append-only history log
   */
  async createEvent(eventData) {
    return await OrderStatusHistory.create(eventData);
  }

  /**
   * Retrieves the full timeline log of status transitions for an order
   */
  async findTimelineForOrder(orderId) {
    return await OrderStatusHistory.findAll({
      where: { order_id: orderId },
      include: [{ model: User, as: 'actor', attributes: ['id', 'name', 'role'] }],
      order: [['timestamp', 'ASC']]
    });
  }
}

module.exports = new TrackingRepository();
