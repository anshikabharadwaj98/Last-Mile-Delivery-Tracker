class PricingEngine {
  calculateVolumetricWeight(length, breadth, height) {
    if (!Number.isFinite(length) || !Number.isFinite(breadth) || !Number.isFinite(height)) {
      throw new Error('Package dimensions must be valid numbers.');
    }
    if (length <= 0 || breadth <= 0 || height <= 0) {
      throw new Error('Package dimensions must be greater than zero.');
    }
    return (length * breadth * height) / 5000;
  }

  resolveCeilingWeights(actualWeight, rawVolumetricWeight) {
    if (!Number.isFinite(actualWeight) || !Number.isFinite(rawVolumetricWeight)) {
      throw new Error('Weight values must be valid numbers.');
    }
    if (actualWeight <= 0) {
      throw new Error('Actual weight must be greater than zero.');
    }

    const ceilActualWeight = Math.ceil(actualWeight);
    const ceilVolumetricWeight = Math.ceil(rawVolumetricWeight);
    const finalBillableWeight = Math.max(ceilActualWeight, ceilVolumetricWeight);

    return {
      ceilActualWeight,
      ceilVolumetricWeight,
      finalBillableWeight
    };
  }

  calculateDeliveryChargeBreakdown(billableWeight, rateCard) {
    if (!Number.isFinite(billableWeight) || billableWeight <= 0) {
      throw new Error('Billable weight must be a positive number.');
    }

    const baseWeight = parseFloat(rateCard.base_weight_kg || 1);
    const baseRate = parseFloat(rateCard.base_rate || 0);
    const excessRatePerKg = parseFloat(rateCard.excess_rate_per_kg || 0);

    if (!Number.isFinite(baseWeight) || baseWeight <= 0) {
      throw new Error('Base weight must be greater than zero.');
    }
    if (!Number.isFinite(baseRate) || baseRate < 0) {
      throw new Error('Base rate must be zero or greater.');
    }
    if (!Number.isFinite(excessRatePerKg) || excessRatePerKg < 0) {
      throw new Error('Excess rate per kg must be zero or greater.');
    }

    const excessWeight = Math.max(0, billableWeight - baseWeight);
    const excessCharge = Math.round(excessWeight * excessRatePerKg * 100) / 100;
    const deliveryCharge = Math.round((baseRate + excessCharge) * 100) / 100;

    return {
      baseWeight,
      baseRate,
      excessRatePerKg,
      excessWeight,
      excessCharge,
      deliveryCharge
    };
  }

  applyCODRule(deliveryCharge, paymentType, codRule) {
    if (!['Prepaid', 'COD'].includes(paymentType)) {
      throw new Error('Payment type must be either Prepaid or COD.');
    }

    let codSurcharge = 0.0;
    if (paymentType === 'COD' && codRule) {
      codSurcharge = parseFloat(codRule.surcharge_amount || 0);
    }

    codSurcharge = Math.round(codSurcharge * 100) / 100;
    const totalCharge = Math.round((deliveryCharge + codSurcharge) * 100) / 100;

    return {
      codSurcharge,
      totalCharge
    };
  }
}

module.exports = new PricingEngine();
