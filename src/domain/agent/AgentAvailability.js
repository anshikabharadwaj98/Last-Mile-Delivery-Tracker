class AgentAvailability {
  /**
   * Checks if an agent profile is active and eligible for order assignments
   */
  isAvailable(user) {
    if (!user) return false;
    if (user.role !== 'delivery_agent' || !user.is_active) return false;
    
    // Check deliveryAgent sub-relation parameters
    if (user.deliveryAgent) {
      return user.deliveryAgent.is_available;
    }
    return true;
  }

  /**
   * Validates GPS coordinate ranges
   */
  isValidCoordinate(lat, lon) {
    if (lat === null || lon === null) return false;
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }
}

module.exports = new AgentAvailability();
