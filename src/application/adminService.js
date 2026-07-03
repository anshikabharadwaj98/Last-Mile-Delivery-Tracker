const zoneRepository = require('../repositories/zoneRepository');

class AdminService {
  async createZone({ name, code, description }) {
    if (!name || !code) {
      throw new Error('Zone name and code are required.');
    }

    const normalizedCode = code.trim().toUpperCase();
    const existingZone = await zoneRepository.findZoneByNameOrCode(name.trim(), normalizedCode);
    if (existingZone) {
      throw new Error('A zone with this name or code already exists.');
    }

    return await zoneRepository.createZone({
      name: name.trim(),
      code: normalizedCode,
      description: description ? description.trim() : null
    });
  }

  async assignAreaToZone({ name, place_name, pincode, postal_code, zone_id, latitude, longitude }) {
    const targetPincode = (pincode || postal_code || '').trim();
    const targetPlaceName = (name || place_name || '').trim();

    if (!targetPlaceName || !targetPincode || !zone_id) {
      throw new Error('Area place name, pincode/postal code, and zone ID are required.');
    }

    const zone = await zoneRepository.findZoneById(zone_id);
    if (!zone) {
      throw new Error('Target zone not found.');
    }

    const existingArea = await zoneRepository.findAreaByPincode(targetPincode);
    if (existingArea) {
      throw new Error('Pincode "' + targetPincode + '" is already assigned to a zone.');
    }

    return await zoneRepository.createArea({
      name: targetPlaceName,
      pincode: targetPincode,
      zone_id,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null
    });
  }
}

module.exports = new AdminService();
