const { Op } = require('sequelize');
const { RateCard, Zone, CODRule } = require('../models');

class PricingRepository {
  async findAllRateCards() {
    return await RateCard.findAll({
      include: [
        { model: Zone, as: 'fromZone' },
        { model: Zone, as: 'toZone' }
      ],
      order: [['order_type', 'ASC'], ['rate_type', 'ASC'], ['name', 'ASC']]
    });
  }

  async findSpecificRateCard(orderType, rateType, zoneFromId, zoneToId) {
    return await RateCard.findOne({
      where: {
        order_type: orderType,
        rate_type: rateType,
        zone_from_id: zoneFromId,
        zone_to_id: zoneToId
      },
      include: [
        { model: Zone, as: 'fromZone' },
        { model: Zone, as: 'toZone' }
      ]
    });
  }

  async findFallbackRateCard(orderType, rateType) {
    return await RateCard.findOne({
      where: {
        order_type: orderType,
        rate_type: rateType,
        zone_from_id: { [Op.is]: null },
        zone_to_id: { [Op.is]: null }
      },
      include: [
        { model: Zone, as: 'fromZone' },
        { model: Zone, as: 'toZone' }
      ]
    });
  }

  async findRateCardByRoute({ order_type, rate_type, zone_from_id, zone_to_id }) {
    return await RateCard.findOne({
      where: {
        order_type,
        rate_type,
        zone_from_id: zone_from_id ? zone_from_id : { [Op.is]: null },
        zone_to_id: zone_to_id ? zone_to_id : { [Op.is]: null }
      }
    });
  }

  async upsertRateCard(rcData) {
    const existing = await this.findRateCardByRoute(rcData);
    if (existing) {
      existing.name = rcData.name;
      existing.base_weight_kg = rcData.base_weight_kg;
      existing.base_rate = rcData.base_rate;
      existing.excess_rate_per_kg = rcData.excess_rate_per_kg;
      await existing.save();
      return existing;
    }

    return await RateCard.create(rcData);
  }

  async createRateCard(rcData) {
    return await RateCard.create(rcData);
  }

  async findRateCardById(id) {
    return await RateCard.findByPk(id);
  }

  async saveRateCard(rcInstance) {
    return await rcInstance.save();
  }

  async findAllCODRules() {
    return await CODRule.findAll({ order: [['order_type', 'ASC']] });
  }

  async findCODRule(orderType) {
    return await CODRule.findOne({ where: { order_type: orderType } });
  }

  async upsertCODRule(orderType, surchargeAmount, description) {
    const [rule] = await CODRule.findOrCreate({
      where: { order_type: orderType },
      defaults: {
        surcharge_amount: surchargeAmount,
        description: description ||           'Flat surcharge for COD ' + orderType + ' orders'
      }
    });

    rule.surcharge_amount = parseFloat(surchargeAmount);
    rule.description = description || rule.description;
    await rule.save();
    return rule;
  }
}

module.exports = new PricingRepository();
