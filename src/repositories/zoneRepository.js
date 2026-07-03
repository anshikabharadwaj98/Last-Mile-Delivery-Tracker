const { Zone, Area } = require('../models');

class ZoneRepository {
  async findAllZones() {
    return await Zone.findAll({
      include: [{ model: Area, as: 'areas', where: { is_active: true }, required: false }],
      order: [['name', 'ASC'], [{ model: Area, as: 'areas' }, 'pincode', 'ASC']]
    });
  }

  async findZoneById(id) {
    return await Zone.findByPk(id, {
      include: [{ model: Area, as: 'areas', required: false }]
    });
  }

  async createZone({ name, code, description }) {
    return await Zone.create({
      name,
      code,
      description,
      is_active: true
    });
  }

  async findZoneByNameOrCode(name, code) {
    const { Op } = require('sequelize');
    return await Zone.findOne({
      where: {
        [Op.or]: [
          { code },
          { name }
        ]
      }
    });
  }

  async findAreaByPincode(pincode) {
    return await Area.findOne({
      where: { pincode, is_active: true },
      include: [{ model: Zone, as: 'zone', where: { is_active: true } }]
    });
  }

  async findAreaByPostalCode(postalCode) {
    return await this.findAreaByPincode(postalCode);
  }

  async createArea(areaData) {
    return await Area.create({
      name: areaData.name || areaData.place_name,
      pincode: areaData.pincode || areaData.postal_code,
      zone_id: areaData.zone_id,
      latitude: areaData.latitude,
      longitude: areaData.longitude,
      is_active: true
    });
  }
}

module.exports = new ZoneRepository();
