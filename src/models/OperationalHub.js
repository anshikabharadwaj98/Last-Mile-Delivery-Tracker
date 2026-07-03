const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class OperationalHub extends Model {}

OperationalHub.init({
  prefix: {
    type: DataTypes.STRING(3),
    primaryKey: true,
    allowNull: false,
    validate: {
      is: /^[1-9][0-9]{2}$/ // Matches 3-digit pincode prefix
    }
  },
  hub_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'OperationalHub',
  tableName: 'operational_hubs',
  timestamps: false,
  underscored: true
});

module.exports = OperationalHub;
