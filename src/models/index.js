const sequelize = require('../config/database');
const User = require('./User');
const OperationalHub = require('./OperationalHub');
const Zone = require('./Zone');
const Area = require('./Area');
const DeliveryAgent = require('./DeliveryAgent');
const RateCard = require('./RateCard');
const CODRule = require('./CODRule');
const Order = require('./Order');
const OrderStatusHistory = require('./OrderStatusHistory');
const Notification = require('./Notification');

// User <-> DeliveryAgent (1-to-1)
User.hasOne(DeliveryAgent, { foreignKey: 'user_id', as: 'deliveryAgent', onDelete: 'CASCADE' });
DeliveryAgent.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Zone <-> Area (1-to-many)
Zone.hasMany(Area, { foreignKey: 'zone_id', as: 'areas', onDelete: 'CASCADE' });
Area.belongsTo(Zone, { foreignKey: 'zone_id', as: 'zone' });

// Zone <-> DeliveryAgent (1-to-many)
Zone.hasMany(DeliveryAgent, { foreignKey: 'current_zone_id', as: 'agents', onDelete: 'SET NULL' });
DeliveryAgent.belongsTo(Zone, { foreignKey: 'current_zone_id', as: 'currentZone' });

// Zone <-> RateCard (from/to)
Zone.hasMany(RateCard, { foreignKey: 'zone_from_id', as: 'outboundRateCards', onDelete: 'CASCADE' });
RateCard.belongsTo(Zone, { foreignKey: 'zone_from_id', as: 'fromZone' });

Zone.hasMany(RateCard, { foreignKey: 'zone_to_id', as: 'inboundRateCards', onDelete: 'CASCADE' });
RateCard.belongsTo(Zone, { foreignKey: 'zone_to_id', as: 'toZone' });

// User <-> Order (Customer, Creator, Agent)
User.hasMany(Order, { foreignKey: 'customer_id', as: 'customerOrders', onDelete: 'RESTRICT' });
Order.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });

User.hasMany(Order, { foreignKey: 'creator_id', as: 'createdOrders', onDelete: 'RESTRICT' });
Order.belongsTo(User, { foreignKey: 'creator_id', as: 'creator' });

User.hasMany(Order, { foreignKey: 'assigned_agent_id', as: 'assignedOrders', onDelete: 'SET NULL' });
Order.belongsTo(User, { foreignKey: 'assigned_agent_id', as: 'agent' });

// Zone <-> Order (pickup/drop)
Zone.hasMany(Order, { foreignKey: 'pickup_zone_id', as: 'pickupOrders', onDelete: 'RESTRICT' });
Order.belongsTo(Zone, { foreignKey: 'pickup_zone_id', as: 'pickupZoneRef' });

Zone.hasMany(Order, { foreignKey: 'drop_zone_id', as: 'dropOrders', onDelete: 'RESTRICT' });
Order.belongsTo(Zone, { foreignKey: 'drop_zone_id', as: 'dropZoneRef' });

// Order <-> OrderStatusHistory (1-to-many)
Order.hasMany(OrderStatusHistory, { foreignKey: 'order_id', as: 'history', onDelete: 'CASCADE' });
OrderStatusHistory.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// User <-> OrderStatusHistory (Actor)
User.hasMany(OrderStatusHistory, { foreignKey: 'actor_id', as: 'historyActions', onDelete: 'RESTRICT' });
OrderStatusHistory.belongsTo(User, { foreignKey: 'actor_id', as: 'actor' });

module.exports = {
  sequelize,
  User,
  OperationalHub,
  Zone,
  Area,
  DeliveryAgent,
  RateCard,
  CODRule,
  Order,
  OrderStatusHistory,
  Notification
};
