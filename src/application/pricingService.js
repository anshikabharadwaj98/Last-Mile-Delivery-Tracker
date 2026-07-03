const pricingRepository = require('../repositories/pricingRepository');
const zoneRepository = require('../repositories/zoneRepository');
const pricingEngine = require('../domain/pricing/PricingEngine');

class PricingService {
  normalizePositiveNumber(value, fallbackValue = 0) {
    const normalized = parseFloat(value ?? fallbackValue);
    return Number.isFinite(normalized) ? normalized : NaN;
  }

  normalizePincode(value, label) {
    const normalized = String(value || '').trim();
    if (!/^[1-9][0-9]{5}$/.test(normalized)) {
      const err = new Error(label + ' must be a valid 6-digit Indian pincode.');
      err.statusCode = 400;
      throw err;
    }
    return normalized;
  }

  validateOrderType(orderType) {
    if (!['B2B', 'B2C'].includes(orderType)) {
      throw new Error('Order type must be either B2B or B2C.');
    }
  }

  validatePaymentType(paymentType) {
    if (!['Prepaid', 'COD'].includes(paymentType)) {
      throw new Error('Payment type must be either Prepaid or COD.');
    }
  }

  async calculateCharges({
    pickup_pincode,
    pickup_postal_code,
    drop_pincode,
    drop_postal_code,
    length,
    length_cm,
    breadth,
    width_cm,
    height,
    height_cm,
    actual_weight,
    actual_weight_kg,
    order_type,
    payment_type
  }) {
    this.validateOrderType(order_type);
    this.validatePaymentType(payment_type);

    const targetPickupPincode = this.normalizePincode(pickup_pincode || pickup_postal_code, 'Pickup pincode');
    const targetDropPincode = this.normalizePincode(drop_pincode || drop_postal_code, 'Drop pincode');
    const targetLength = this.normalizePositiveNumber(length ?? length_cm);
    const targetBreadth = this.normalizePositiveNumber(breadth ?? width_cm);
    const targetHeight = this.normalizePositiveNumber(height ?? height_cm);
    const targetActualWeight = this.normalizePositiveNumber(actual_weight ?? actual_weight_kg);

    const pickupArea = await zoneRepository.findAreaByPincode(targetPickupPincode);
    if (!pickupArea) {
      const err = new Error('Pickup pincode "' + targetPickupPincode + '" is not serviceable. Ask an admin to map it to a zone.');
      err.statusCode = 422;
      throw err;
    }

    const dropArea = await zoneRepository.findAreaByPincode(targetDropPincode);
    if (!dropArea) {
      const err = new Error('Drop pincode "' + targetDropPincode + '" is not serviceable. Ask an admin to map it to a zone.');
      err.statusCode = 422;
      throw err;
    }

    const pickupZone = pickupArea.zone;
    const dropZone = dropArea.zone;
    const rateType = pickupZone.id === dropZone.id ? 'intra' : 'inter';

    const rawVolumetricWeight = pricingEngine.calculateVolumetricWeight(targetLength, targetBreadth, targetHeight);
    const weights = pricingEngine.resolveCeilingWeights(targetActualWeight, rawVolumetricWeight);

    const exactZoneToId = rateType === 'intra' ? pickupZone.id : dropZone.id;
    let rateCard = await pricingRepository.findSpecificRateCard(order_type, rateType, pickupZone.id, exactZoneToId);
    if (!rateCard) {
      rateCard = await pricingRepository.findFallbackRateCard(order_type, rateType);
    }
    if (!rateCard) {
      throw new Error('No ' + order_type + ' ' + rateType + '-zone rate card configured for ' + pickupZone.name + ' to ' + dropZone.name + '.');
    }

    const codRule = await pricingRepository.findCODRule(order_type);
    if (payment_type === 'COD' && !codRule) {
      throw new Error('No COD surcharge rule configured for ' + order_type + ' orders.');
    }

    const chargeBreakdown = pricingEngine.calculateDeliveryChargeBreakdown(weights.finalBillableWeight, rateCard);
    const codResults = pricingEngine.applyCODRule(chargeBreakdown.deliveryCharge, payment_type, codRule);

    return {
      pickup_zone_id: pickupZone.id,
      pickup_zone_name: pickupZone.name,
      drop_zone_id: dropZone.id,
      drop_zone_name: dropZone.name,
      pickup_area_id: pickupArea.id,
      pickup_area_name: pickupArea.name,
      drop_area_id: dropArea.id,
      drop_area_name: dropArea.name,
      rate_type: rateType,
      rate_card_id: rateCard.id,
      rate_card_name: rateCard.name,
      raw_actual_weight: targetActualWeight,
      raw_volumetric_weight: Math.round(rawVolumetricWeight * 100) / 100,
      ceil_actual_weight: weights.ceilActualWeight,
      ceil_volumetric_weight: weights.ceilVolumetricWeight,
      final_billable_weight: weights.finalBillableWeight,
      volumetric_weight_kg: Math.round(rawVolumetricWeight * 100) / 100,
      chargeable_weight_kg: weights.finalBillableWeight,
      base_weight_kg: chargeBreakdown.baseWeight,
      base_charge: chargeBreakdown.baseRate,
      excess_weight_kg: chargeBreakdown.excessWeight,
      excess_rate_per_kg: chargeBreakdown.excessRatePerKg,
      excess_charge_total: chargeBreakdown.excessCharge,
      delivery_charge: chargeBreakdown.deliveryCharge,
      cod_surcharge: codResults.codSurcharge,
      total_charge: codResults.totalCharge
    };
  }

  async getRateCardsAndCODRules() {
    const rateCards = await pricingRepository.findAllRateCards();
    const settings = await pricingRepository.findAllCODRules();
    const settingsFormatted = settings.map(rule => ({
      key: 'cod_surcharge_' + rule.order_type,
      value: String(rule.surcharge_amount),
      description: rule.description
    }));

    return { rateCards, settings: settingsFormatted };
  }

  async saveRateCard(rcData) {
    const mapped = {
      name: String(rcData.name || '').trim(),
      zone_from_id: rcData.zone_from_id || null,
      zone_to_id: rcData.zone_to_id || null,
      rate_type: rcData.rate_type,
      order_type: rcData.order_type,
      base_weight_kg: this.normalizePositiveNumber(rcData.base_weight_kg, 1),
      base_rate: this.normalizePositiveNumber(rcData.base_rate, 0),
      excess_rate_per_kg: this.normalizePositiveNumber(rcData.excess_rate_per_kg, 0)
    };

    if (!mapped.name) {
      throw new Error('Rate card name is required.');
    }
    this.validateOrderType(mapped.order_type);
    if (!['intra', 'inter'].includes(mapped.rate_type)) {
      throw new Error('Rate type must be either intra or inter.');
    }
    if (!Number.isFinite(mapped.base_weight_kg) || mapped.base_weight_kg <= 0) {
      throw new Error('Base weight must be greater than zero.');
    }
    if (!Number.isFinite(mapped.base_rate) || mapped.base_rate < 0) {
      throw new Error('Base rate must be zero or greater.');
    }
    if (!Number.isFinite(mapped.excess_rate_per_kg) || mapped.excess_rate_per_kg < 0) {
      throw new Error('Excess rate per kg must be zero or greater.');
    }

    const hasFromZone = Boolean(mapped.zone_from_id);
    const hasToZone = Boolean(mapped.zone_to_id);
    if (hasFromZone !== hasToZone) {
      throw new Error('For a specific route override, both from-zone and to-zone are required. Leave both empty for a fallback rate card.');
    }

    if (mapped.rate_type === 'intra' && hasFromZone && mapped.zone_from_id !== mapped.zone_to_id) {
      throw new Error('Intra-zone rate cards must use the same zone as both from-zone and to-zone.');
    }
    if (mapped.rate_type === 'inter' && hasFromZone && mapped.zone_from_id === mapped.zone_to_id) {
      throw new Error('Inter-zone rate cards must use two different zones.');
    }

    return await pricingRepository.upsertRateCard(mapped);
  }

  async saveCODRule(orderType, amount, description) {
    this.validateOrderType(orderType);
    const normalizedAmount = parseFloat(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount < 0) {
      throw new Error('COD surcharge amount must be zero or greater.');
    }
    return await pricingRepository.upsertCODRule(orderType, normalizedAmount, description);
  }
}

module.exports = new PricingService();
