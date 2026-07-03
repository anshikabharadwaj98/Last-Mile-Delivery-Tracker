const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class CODRule extends Model {}

CODRule.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  order_type: {
    type: DataTypes.ENUM('B2B', 'B2C'),
    allowNull: false,
    unique: true
  },
  surcharge_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'CODRule',
  tableName: 'cod_rules',
  underscored: true
});

module.exports = CODRule;
