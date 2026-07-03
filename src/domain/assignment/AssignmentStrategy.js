class AssignmentStrategy {
  /**
   * Computes the Haversine distance between two coordinates in km
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Ranks candidates based on pickup-zone matching, GPS proximity, and workloads.
   */
  rankAgentsForOrder(agentsList, { pickupLat, pickupLon, pickupZoneId }, workloadsMap) {
    // 1. Filter out agents that are not assigned to the pickup zone.
    const filteredAgents = agentsList.filter(agent => {
      return agent.current_zone_id === pickupZoneId && agent.is_available;
    });

    const candidates = filteredAgents.map(agent => {
      let distance = null;

      // Calculate distance if coordinates are mock simulated
      if (pickupLat !== null && pickupLon !== null && agent.latitude !== null && agent.longitude !== null) {
        distance = this.calculateDistance(pickupLat, pickupLon, agent.latitude, agent.longitude);
      }

      return {
        agent,
        distance,
        activeJobs: workloadsMap[agent.id] || 0
      };
    });

    candidates.sort((a, b) => {
      // Priority 1: GPS Proximity
      if (a.distance !== null && b.distance !== null) {
        if (Math.abs(a.distance - b.distance) > 0.15) {
          return a.distance - b.distance;
        }
        return a.activeJobs - b.activeJobs;
      }

      // Priority 2: Workload
      if (a.activeJobs !== b.activeJobs) {
        return a.activeJobs - b.activeJobs;
      }

      // Priority 3: ID String Tie-breaker (handles UUIDs safely)
      return String(a.agent.id).localeCompare(String(b.agent.id));
    });

    return candidates;
  }
}

module.exports = new AssignmentStrategy();
