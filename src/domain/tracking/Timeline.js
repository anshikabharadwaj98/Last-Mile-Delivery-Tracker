class Timeline {
  /**
   * Translates a database tracking event into a formatted timeline structure
   */
  formatTimelineEntry(event, index, totalEvents) {
    const isLast = index === totalEvents - 1;
    const actorName = event.actor ? event.actor.name : 'System';
    const actorRole = event.actor ? event.actor.role.toUpperCase() : 'SYSTEM';

    return {
      id: event.id,
      status: event.status,
      created_at: event.timestamp || event.created_at || event.createdAt,
      actor: {
        name: actorName,
        role: actorRole.toLowerCase()
      },
      notes: event.notes || 'No description.',
      is_active: isLast,
      is_failed: isLast && event.status === 'Failed',
      is_delivered: isLast && event.status === 'Delivered'
    };
  }

  /**
   * Orchestrates formatting of the complete log array
   */
  buildTimeline(historyList = []) {
    const total = historyList.length;
    return historyList.map((event, index) => this.formatTimelineEntry(event, index, total));
  }
}

module.exports = new Timeline();
