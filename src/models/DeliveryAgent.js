const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class DeliveryAgent extends Model {}

DeliveryAgent.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  current_zone_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'zones',
      key: 'id'
    }
  },
  current_hub_prefix: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.current_zone_id;
    },
    set(value) {
      this.setDataValue('current_zone_id', value);
    }
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'DeliveryAgent',
  tableName: 'delivery_agents',
  underscored: true,
  indexes: [
    {
      unique: false,
      fields: ['current_zone_id', 'is_available']
    }
  ]
});

module.exports = DeliveryAgent;
