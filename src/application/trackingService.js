const trackingRepository = require('../repositories/trackingRepository');
const timelineDomain = require('../domain/tracking/Timeline');

class TrackingService {
  /**
   * Logs a new order tracking status event
   */
  async logEvent(orderId, status, actorId, notes) {
    return await trackingRepository.createEvent({
      order_id: orderId,
      status,
      actor_id: actorId,
      notes
    });
  }

  /**
   * Fetches and formats the order tracking history timeline
   */
  async getFormattedTimeline(orderId) {
    const rawEvents = await trackingRepository.findTimelineForOrder(orderId);
    return timelineDomain.buildTimeline(rawEvents);
  }
}

module.exports = new TrackingService();
