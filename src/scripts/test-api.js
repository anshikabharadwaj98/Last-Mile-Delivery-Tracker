const { sequelize, User, DeliveryAgent } = require('../models');
const pricingService = require('../application/pricingService');
const orderService = require('../application/orderService');
const authService = require('../application/authService');

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectServiceabilityError(label, payload, expectedMessagePart) {
  try {
    await pricingService.calculateCharges(payload);
    throw new Error(`${label}: expected serviceability error, but charges were computed.`);
  } catch (err) {
    if (err.statusCode !== 422 || !err.message.includes(expectedMessagePart)) {
      throw new Error(`${label}: expected status 422 containing "${expectedMessagePart}", got "${err.message}" (status: ${err.statusCode})`);
    }
    console.log(`SUCCESS: ${label} blocked with status 422: "${err.message}"`);
  }
}

async function runTests() {
  console.log('Connecting to SQLite database at:', sequelize.options.storage);
  console.log('Running automated tests for exact pincode zone detection and rate cards...');

  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    const customer = await User.findOne({ where: { email: 'customer@tracker.com' } });
    const agentA = await User.findOne({ where: { email: 'agent1@tracker.com' } });
    const agentB = await User.findOne({ where: { email: 'agent2@tracker.com' } });
    const admin = await User.findOne({ where: { email: 'admin@tracker.com' } });

    if (!customer || !agentA || !agentB || !admin) {
      throw new Error('Test environment missing pre-seeded users. Please run npm run seed first.');
    }

    console.log(`Testing with Customer: ${customer.name}, Agent A: ${agentA.name}, Agent B: ${agentB.name}`);

    console.log('\n--- Test 1: Specific Intra-Zone B2B Prepaid Rate ---');
    const result1 = await pricingService.calculateCharges({
      pickup_pincode: '110001',
      drop_pincode: '110005',
      length: 10,
      breadth: 10,
      height: 10,
      actual_weight: 2.0,
      order_type: 'B2B',
      payment_type: 'Prepaid'
    });

    assertEqual(result1.pickup_zone_name, 'Central Delhi', 'Test 1 pickup zone');
    assertEqual(result1.drop_zone_name, 'Central Delhi', 'Test 1 drop zone');
    assertEqual(result1.rate_type, 'intra', 'Test 1 route type');
    assertEqual(result1.rate_card_name, 'Central Delhi B2B Same-Zone', 'Test 1 rate card');
    assertEqual(result1.total_charge, 43.00, 'Test 1 total charge');
    console.log('SUCCESS: Specific Central Delhi intra-zone B2B pricing is correct ($43.00).');

    console.log('\n--- Test 2: Specific Inter-Zone B2B COD Volumetric Rate ---');
    const result2 = await pricingService.calculateCharges({
      pickup_pincode: '110001',
      drop_pincode: '110017',
      length: 40,
      breadth: 30,
      height: 50,
      actual_weight: 3.0,
      order_type: 'B2B',
      payment_type: 'COD'
    });

    assertEqual(result2.pickup_zone_name, 'Central Delhi', 'Test 2 pickup zone');
    assertEqual(result2.drop_zone_name, 'South Delhi', 'Test 2 drop zone');
    assertEqual(result2.rate_type, 'inter', 'Test 2 route type');
    assertEqual(result2.rate_card_name, 'Central to South B2B Priority', 'Test 2 rate card');
    assertEqual(result2.chargeable_weight_kg, 12, 'Test 2 billable weight');
    assertEqual(result2.cod_surcharge, 15.00, 'Test 2 COD surcharge');
    assertEqual(result2.total_charge, 300.00, 'Test 2 total charge');
    console.log('SUCCESS: Specific Central-to-South B2B COD volumetric pricing is correct ($300.00).');

    console.log('\n--- Test 3: Generic Fallback Inter-Zone B2C Rate ---');
    const result3 = await pricingService.calculateCharges({
      pickup_pincode: '110007',
      drop_pincode: '110020',
      length: 10,
      breadth: 10,
      height: 10,
      actual_weight: 1.0,
      order_type: 'B2C',
      payment_type: 'Prepaid'
    });

    assertEqual(result3.pickup_zone_name, 'North Delhi', 'Test 3 pickup zone');
    assertEqual(result3.drop_zone_name, 'South Delhi', 'Test 3 drop zone');
    assertEqual(result3.rate_card_name, 'Generic B2C Inter-Zone', 'Test 3 fallback rate card');
    assertEqual(result3.total_charge, 45.00, 'Test 3 total charge');
    console.log('SUCCESS: Generic fallback inter-zone B2C pricing is correct ($45.00).');

    console.log('\n--- Test 4: Order Creation Uses UUID Customer ID and Auto-Assigns Pickup-Zone Agent ---');
    const createResult1 = await orderService.createOrder({
      customer_id: customer.id,
      pickup_address: 'Connaught Place pickup',
      pickup_pincode: '110001',
      drop_address: 'Karol Bagh drop',
      drop_pincode: '110005',
      length: 10,
      breadth: 10,
      height: 10,
      actual_weight: 1.0,
      order_type: 'B2B',
      payment_type: 'Prepaid'
    }, admin);

    const order1 = createResult1.order;
    const assigned1 = createResult1.assigned_agent;
    assertEqual(order1.customer_id, customer.id, 'Test 4 admin-created order customer UUID');
    assert(assigned1 && assigned1.id === agentA.id, `Test 4 expected Agent A (${agentA.id}), got ${assigned1 ? assigned1.id : 'None'}`);
    console.log('SUCCESS: Admin-created order keeps UUID customer ID and auto-assigns Agent A.');

    console.log('\n--- Test 5: Workload Balancing Within Pickup Zone ---');
    await DeliveryAgent.update(
      { current_zone_id: order1.pickup_zone_id, latitude: 28.6304, longitude: 77.2177, is_available: true },
      { where: { user_id: agentB.id } }
    );

    const createResult2 = await orderService.createOrder({
      customer_id: customer.id,
      pickup_address: 'Connaught Place second pickup',
      pickup_pincode: '110001',
      drop_address: 'Karol Bagh second drop',
      drop_pincode: '110005',
      length: 10,
      breadth: 10,
      height: 10,
      actual_weight: 1.0,
      order_type: 'B2B',
      payment_type: 'Prepaid'
    }, admin);

    const assigned2 = createResult2.assigned_agent;
    assert(assigned2 && assigned2.id === agentB.id, `Test 5 expected Agent B (${agentB.id}), got ${assigned2 ? assigned2.id : 'None'}`);
    console.log('SUCCESS: Workload tie-breaker selected Agent B with lower active workload.');

    console.log('\n--- Test 6: Exact Pincode Serviceability Guards ---');
    await expectServiceabilityError('Unmapped drop pincode', {
      pickup_pincode: '110001',
      drop_pincode: '400001',
      length: 10,
      breadth: 10,
      height: 10,
      actual_weight: 1.0,
      order_type: 'B2C',
      payment_type: 'Prepaid'
    }, 'Drop pincode');

    await expectServiceabilityError('Unmapped pickup pincode', {
      pickup_pincode: '999001',
      drop_pincode: '110001',
      length: 10,
      breadth: 10,
      height: 10,
      actual_weight: 1.0,
      order_type: 'B2C',
      payment_type: 'Prepaid'
    }, 'Pickup pincode');

    console.log('\n--- Test 7: Weight Ceiling Rule Verification ---');
    const result7 = await pricingService.calculateCharges({
      pickup_pincode: '110001',
      drop_pincode: '110005',
      length: 22,
      breadth: 20,
      height: 27,
      actual_weight: 1.2,
      order_type: 'B2B',
      payment_type: 'Prepaid'
    });

    assertEqual(result7.ceil_actual_weight, 2, 'Test 7 ceil actual weight');
    assertEqual(result7.ceil_volumetric_weight, 3, 'Test 7 ceil volumetric weight');
    assertEqual(result7.final_billable_weight, 3, 'Test 7 final billable weight');
    console.log('SUCCESS: Weight ceiling rule bills on the higher rounded-up weight.');

    console.log('\n--- Test 8: Email Verification and Customer Classification Flow ---');
    const genericRes = await authService.register({
      company_name: 'Test Generic Corp',
      company_address: '789 Testing St',
      email: `generic_test_${Date.now()}@gmail.com`,
      password: 'password123',
      role: 'customer'
    });
    assertEqual(genericRes.user.customer_type, 'B2C', 'Test 8 generic email classification');
    console.log('SUCCESS: Registration without GSTIN plus generic email is classified as B2C.');

    const gstinRes = await authService.register({
      company_name: 'Test GSTIN Generic Corp',
      company_address: '789 Testing St',
      email: `gstin_generic_${Date.now()}@gmail.com`,
      password: 'password123',
      gstin: `07GENERIC_${Date.now()}`.substring(0, 15),
      role: 'customer'
    });
    assertEqual(gstinRes.user.customer_type, 'B2B', 'Test 8 GSTIN classification');
    console.log('SUCCESS: Registration with GSTIN plus generic email is classified as B2B.');

    const corpRes = await authService.register({
      company_name: 'Test Corp Auto',
      company_address: '789 Testing St',
      email: `auto_corp_${Date.now()}@mybusiness.com`,
      password: 'password123',
      role: 'customer'
    });
    assertEqual(corpRes.user.customer_type, 'B2B', 'Test 8 corporate email classification');
    console.log('SUCCESS: Registration with corporate email is classified as B2B.');

    const randEmail = `test_${Date.now()}@testcompany.com`;
    const regResult = await authService.register({
      company_name: 'Test Verify Corp',
      company_address: '789 Testing St',
      email: randEmail,
      password: 'password123',
      role: 'customer'
    });

    assertEqual(regResult.user.is_verified, false, 'Test 8 initial verification flag');

    try {
      await authService.login({ email: randEmail, password: 'password123' });
      throw new Error('Test 8 expected login to fail for unverified user, but it succeeded.');
    } catch (loginErr) {
      assert(loginErr.message.includes('verify your email'), `Test 8 expected verification error, got: ${loginErr.message}`);
      console.log('SUCCESS: Unverified user login is blocked.');
    }

    const dbUser = await User.findOne({ where: { email: randEmail } });
    assert(dbUser && dbUser.verification_token, 'Test 8 verification token generated');

    await authService.verifyEmail(dbUser.verification_token);
    const loginResult = await authService.login({ email: randEmail, password: 'password123' });
    assert(loginResult.token, 'Test 8 token returned after verification');
    console.log('SUCCESS: Email verification enables login.');

    console.log('\n==================================================');
    console.log('  ALL EXACT-PINCODE DELIVERY TESTS PASSED');
    console.log('==================================================');
  } catch (error) {
    console.error('\nTEST RUN ENCOUNTERED AN ERROR:');
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = runTests;
