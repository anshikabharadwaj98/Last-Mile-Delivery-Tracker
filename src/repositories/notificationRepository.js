const { Notification } = require('../models');

class NotificationRepository {
  async createNotification(notificationData) {
    return await Notification.create(notificationData);
  }

  async findAllLogs(limit = 100) {
    return await Notification.findAll({
      order: [['created_at', 'DESC']],
      limit
    });
  }
}

module.exports = new NotificationRepository();
