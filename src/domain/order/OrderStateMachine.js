class OrderStateMachine {
  constructor() {
    // Defines valid lifecycle state transitions (re-integrates 'Assigned' state)
    this.transitions = {
      'Pending': ['Assigned', 'Cancelled'],
      'Assigned': ['Picked Up', 'Pending', 'Cancelled'],
      'Picked Up': ['In Transit'],
      'In Transit': ['Out for Delivery'],
      'Out for Delivery': ['Delivered', 'Failed'],
      'Failed': ['Pending', 'Cancelled'], // Rescheduling transitions back to Pending
      'Cancelled': []
    };
  }

  /**
   * Validates if a transition from current to next status is permitted.
   */
  validateTransition(currentStatus, nextStatus) {
    if (currentStatus === nextStatus) return true;

    const allowed = this.transitions[currentStatus];
    if (!allowed || !allowed.includes(nextStatus)) {
      throw new Error(`Invalid status transition: Cannot change order status from "${currentStatus}" to "${nextStatus}".`);
    }

    return true;
  }

  /**
   * Helper to check if order is active (in-progress delivery).
   */
  isActive(status) {
    return ['Pending', 'Assigned', 'Picked Up', 'In Transit', 'Out for Delivery'].includes(status);
  }

  /**
   * Helper to check if order has reached a terminal successful state.
   */
  isCompleted(status) {
    return status === 'Delivered';
  }
}

module.exports = new OrderStateMachine();
