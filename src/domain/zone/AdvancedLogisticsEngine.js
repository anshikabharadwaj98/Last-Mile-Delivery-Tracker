// Hardcoded System Bracket Interface Boundaries
const DISTANCE_BRACKETS = {
  HYPER_LOCAL: { min: 0.0,  max: 2.0,  key: 'HYPER_LOCAL'  },
  NEIGHBORING: { min: 2.1,  max: 5.0,  key: 'NEIGHBORING'  },
  SUB_ZONE:    { min: 5.1,  max: 12.0, key: 'SUB_ZONE'     },
  CITY_WIDE:   { min: 12.1, max: 30.0, key: 'CITY_WIDE'    }
};

// Hardcoded coordinate lookup to support simulated GPS coordinates
const PINCODE_COORDINATES = {
  '110001': { latitude: 28.6304, longitude: 77.2177 },
  '110005': { latitude: 28.6433, longitude: 77.1895 },
  '110007': { latitude: 28.6904, longitude: 77.2066 },
  '110017': { latitude: 28.5284, longitude: 77.2195 },
  '110048': { latitude: 28.5244, longitude: 77.2343 },
  '110070': { latitude: 28.5414, longitude: 77.1557 },
  '208025': { latitude: 26.4499, longitude: 80.3319 },
  '208026': { latitude: 26.4650, longitude: 80.3450 }
};

class AdvancedLogisticsEngine {
  /**
   * Resolves coordinates for Indian Pincodes
   */
  getPincodeCoordinates(pincode) {
    return PINCODE_COORDINATES[pincode] || null;
  }

  /**
   * Deterministic math engine parsing pure pincode strings down to absolute distance.
   */
  computeDistance(pickup, drop) {
    const pinRegex = /^[1-9][0-9]{5}$/;
    if (!pinRegex.test(pickup) || !pinRegex.test(drop)) {
      throw new Error("Invalid Format: Target pincodes must be exactly 6 digits.");
    }

    const pickupPrefix = pickup.substring(0, 3);
    const dropPrefix = drop.substring(0, 3);

    // Rule 1: Prefix Guard checking
    if (pickupPrefix !== dropPrefix) {
      const err = new Error(`Cross-Hub Violation: Deliveries between separate sorting hubs (${pickupPrefix} -> ${dropPrefix}) are not serviced.`);
      err.statusCode = 422;
      throw err;
    }

    // Rule 2: Same Pincode Match -> Deterministic distance between 1.0 and 2.0 km using modulo hash
    if (pickup === drop) {
      const pinValue = parseInt(pickup, 10);
      const decimalFactor = (pinValue % 11) / 10; 
      return Math.round((1.0 + decimalFactor) * 10) / 10;
    }

    // Rule 3: Adjacent Matrix Step Rule -> Suffix Diff * 3.5 km Step
    const pickupSuffix = parseInt(pickup.substring(3), 10);
    const dropSuffix = parseInt(drop.substring(3), 10);
    const suffixDifference = Math.abs(pickupSuffix - dropSuffix);
    
    return Math.round((suffixDifference * 3.5) * 10) / 10;
  }

  /**
   * Drops calculated raw distance value into the system's hardcoded brackets.
   */
  resolveBracket(distance) {
    for (const zone of Object.values(DISTANCE_BRACKETS)) {
      if (distance >= zone.min && distance <= zone.max) {
        return zone.key;
      }
    }
    const err = new Error(`Radius Boundary Breach: Calculated travel distance of ${distance}km exceeds the 30km last-mile cap.`);
    err.statusCode = 422;
    throw err;
  }
}

module.exports = new AdvancedLogisticsEngine();
