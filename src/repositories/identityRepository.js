const { User, DeliveryAgent, Zone } = require('../models');

class IdentityRepository {
  async findByEmail(email) {
    return await User.findOne({
      where: { email },
      include: [
        {
          model: DeliveryAgent,
          as: 'deliveryAgent',
          include: [{ model: Zone, as: 'currentZone', attributes: ['id', 'name', 'code'] }]
        }
      ]
    });
  }

  async findByGstin(gstin) {
    return await User.findOne({ where: { gstin } });
  }

  async findByVerificationToken(token) {
    const { Op } = require('sequelize');
    return await User.findOne({
      where: {
        verification_token: token,
        verification_token_expires: {
          [Op.gt]: new Date()
        }
      }
    });
  }

  async findById(id) {
    return await User.findByPk(id, {
      include: [
        {
          model: DeliveryAgent,
          as: 'deliveryAgent',
          include: [{ model: Zone, as: 'currentZone', attributes: ['id', 'name', 'code'] }]
        }
      ]
    });
  }

  async create(userData) {
    return await User.create(userData);
  }

  async save(userInstance) {
    return await userInstance.save();
  }
}

module.exports = new IdentityRepository();
