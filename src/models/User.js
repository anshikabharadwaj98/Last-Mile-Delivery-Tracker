const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class User extends Model {}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'customer', 'delivery_agent'),
    allowNull: false,
    defaultValue: 'customer'
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  customer_type: {
    type: DataTypes.ENUM('B2B', 'B2C'),
    allowNull: false,
    defaultValue: 'B2C'
  },
  company_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gstin: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  verification_token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  verification_token_expires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  underscored: true
});

module.exports = User;
