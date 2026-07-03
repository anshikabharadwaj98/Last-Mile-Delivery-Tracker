const { sequelize, User, Zone, Area, DeliveryAgent, RateCard, CODRule } = require('../models');
const bcrypt = require('bcryptjs');

async function createUser(data, password) {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  return await User.create({
    ...data,
    password_hash: passwordHash,
    is_verified: true
  });
}

async function createRate(name, orderType, rateType, baseRate, excessRate, zoneFrom = null, zoneTo = null) {
  return await RateCard.create({
    name,
    order_type: orderType,
    rate_type: rateType,
    zone_from_id: zoneFrom ? zoneFrom.id : null,
    zone_to_id: zoneTo ? zoneTo.id : null,
    base_weight_kg: 1.0,
    base_rate: baseRate,
    excess_rate_per_kg: excessRate
  });
}

async function seed() {
  console.log('Rebuilding database with exact pincode zone mappings...');
  await sequelize.sync({ force: true });

  const admin = await createUser({
    name: 'Logistics Supervisor',
    email: 'admin@tracker.com',
    role: 'admin'
  }, 'admin123');

  const customer = await createUser({
    name: 'Acme Corporates',
    email: 'customer@tracker.com',
    role: 'customer',
    customer_type: 'B2B',
    company_name: 'Acme Corporates Ltd',
    gstin: '07ACME1234A1Z1',
    address: '456 Business Lane, Okhla Phase 3, Delhi'
  }, 'customer123');

  const retailCustomer = await createUser({
    name: 'Riya Sharma',
    email: 'retail@tracker.com',
    role: 'customer',
    customer_type: 'B2C',
    address: '21 Central Market, Delhi'
  }, 'retail123');

  const agent1 = await createUser({
    name: 'Alex Rider (Agent A)',
    email: 'agent1@tracker.com',
    role: 'delivery_agent'
  }, 'agent123');

  const agent2 = await createUser({
    name: 'Bob Miller (Agent B)',
    email: 'agent2@tracker.com',
    role: 'delivery_agent'
  }, 'agent2123');

  const agent3 = await createUser({
    name: 'Charlie Green (Agent C)',
    email: 'agent3@tracker.com',
    role: 'delivery_agent'
  }, 'agent3123');

  const centralDelhi = await Zone.create({
    name: 'Central Delhi',
    code: 'CENTRAL_DELHI',
    description: 'Connaught Place and nearby central business areas'
  });
  const southDelhi = await Zone.create({
    name: 'South Delhi',
    code: 'SOUTH_DELHI',
    description: 'Saket, Okhla, and adjoining delivery areas'
  });
  const northDelhi = await Zone.create({
    name: 'North Delhi',
    code: 'NORTH_DELHI',
    description: 'North campus and Civil Lines service areas'
  });

  await Area.bulkCreate([
    { zone_id: centralDelhi.id, name: 'Connaught Place', pincode: '110001', latitude: 28.6304, longitude: 77.2177 },
    { zone_id: centralDelhi.id, name: 'Karol Bagh', pincode: '110005', latitude: 28.6433, longitude: 77.1895 },
    { zone_id: southDelhi.id, name: 'Saket', pincode: '110017', latitude: 28.5284, longitude: 77.2195 },
    { zone_id: southDelhi.id, name: 'Okhla Phase 3', pincode: '110020', latitude: 28.5362, longitude: 77.2740 },
    { zone_id: northDelhi.id, name: 'Delhi University North Campus', pincode: '110007', latitude: 28.6904, longitude: 77.2066 }
  ]);

  await DeliveryAgent.bulkCreate([
    { user_id: agent1.id, current_zone_id: centralDelhi.id, is_available: true, latitude: 28.6304, longitude: 77.2177 },
    { user_id: agent2.id, current_zone_id: southDelhi.id, is_available: true, latitude: 28.5284, longitude: 77.2195 },
    { user_id: agent3.id, current_zone_id: northDelhi.id, is_available: true, latitude: 28.6904, longitude: 77.2066 }
  ]);

  await CODRule.bulkCreate([
    { order_type: 'B2B', surcharge_amount: 15.00, description: 'Flat surcharge for COD B2B orders' },
    { order_type: 'B2C', surcharge_amount: 10.00, description: 'Flat surcharge for COD B2C orders' }
  ]);

  await createRate('Generic B2B Intra-Zone', 'B2B', 'intra', 35.00, 12.00);
  await createRate('Generic B2B Inter-Zone', 'B2B', 'inter', 55.00, 18.00);
  await createRate('Generic B2C Intra-Zone', 'B2C', 'intra', 30.00, 10.00);
  await createRate('Generic B2C Inter-Zone', 'B2C', 'inter', 45.00, 15.00);

  await createRate('Central to South B2B Priority', 'B2B', 'inter', 65.00, 20.00, centralDelhi, southDelhi);
  await createRate('South to Central B2C Retail', 'B2C', 'inter', 50.00, 16.00, southDelhi, centralDelhi);
  await createRate('Central Delhi B2B Same-Zone', 'B2B', 'intra', 32.00, 11.00, centralDelhi, centralDelhi);

  console.log('==================================================');
  console.log('DATABASE SEEDED SUCCESSFULLY');
  console.log('Admin:    admin@tracker.com    / admin123');
  console.log('Customer: customer@tracker.com / customer123');
  console.log('Retail:   retail@tracker.com   / retail123');
  console.log('Agent A:  agent1@tracker.com   / agent123');
  console.log('Agent B:  agent2@tracker.com   / agent2123');
  console.log('Agent C:  agent3@tracker.com   / agent3123');
  console.log('Mapped pincodes: 110001, 110005, 110017, 110020, 110007');
  console.log('==================================================');

  return { admin, customer, retailCustomer, agent1, agent2, agent3 };
}

if (require.main === module) {
  seed().catch(err => {
    console.error('Failed to seed database:', err);
    process.exit(1);
  });
}

module.exports = seed;
