const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Area extends Model {}

Area.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  zone_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'zones',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  pincode: {
    type: DataTypes.STRING(6),
    allowNull: false,
    unique: true,
    validate: {
      is: /^[1-9][0-9]{5}$/
    }
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'Area',
  tableName: 'areas',
  underscored: true,
  indexes: [
    {
      unique: false,
      fields: ['zone_id']
    }
  ]
});

module.exports = Area;
