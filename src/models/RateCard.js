const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class RateCard extends Model {}

RateCard.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  zone_from_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'zones',
      key: 'id'
    }
  },
  zone_to_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'zones',
      key: 'id'
    }
  },
  rate_type: {
    type: DataTypes.ENUM('intra', 'inter'),
    allowNull: false
  },
  order_type: {
    type: DataTypes.ENUM('B2B', 'B2C'),
    allowNull: false
  },
  base_weight_kg: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 1.00
  },
  base_rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  excess_rate_per_kg: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  zoneFrom: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.fromZone || null;
    }
  },
  zoneTo: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.toZone || null;
    }
  },
  bracket_key: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.rate_type;
    }
  },
  base_multiplier: {
    type: DataTypes.VIRTUAL,
    get() {
      return parseFloat(this.excess_rate_per_kg);
    }
  },
  fixed_surcharge: {
    type: DataTypes.VIRTUAL,
    get() {
      return parseFloat(this.base_rate);
    }
  },
  cod_surcharge: {
    type: DataTypes.VIRTUAL,
    get() {
      return 0;
    }
  }
}, {
  sequelize,
  modelName: 'RateCard',
  tableName: 'rate_cards',
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['zone_from_id', 'zone_to_id', 'rate_type', 'order_type']
    }
  ]
});

module.exports = RateCard;
