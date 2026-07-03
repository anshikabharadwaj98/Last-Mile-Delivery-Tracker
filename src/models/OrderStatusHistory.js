const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class OrderStatusHistory extends Model {}

OrderStatusHistory.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false
  },
  actor_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'OrderStatusHistory',
  tableName: 'order_status_history',
  underscored: true,
  createdAt: 'timestamp',
  updatedAt: false,
  indexes: [
    {
      unique: false,
      fields: ['order_id']
    }
  ]
});

module.exports = OrderStatusHistory;
