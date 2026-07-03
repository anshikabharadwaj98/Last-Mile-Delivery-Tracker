const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Order extends Model {}

Order.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  customer_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  creator_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  assigned_agent_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  pickup_zone_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'zones',
      key: 'id'
    }
  },
  drop_zone_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'zones',
      key: 'id'
    }
  },
  rate_type: {
    type: DataTypes.ENUM('intra', 'inter'),
    allowNull: false
  },
  pickup_address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  pickup_pincode: {
    type: DataTypes.STRING(6),
    allowNull: false
  },
  drop_address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  drop_pincode: {
    type: DataTypes.STRING(6),
    allowNull: false
  },
  length: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  breadth: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  height: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  raw_actual_weight: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  raw_volumetric_weight: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  ceil_actual_weight: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ceil_volumetric_weight: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  final_billable_weight: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  calculated_distance: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  order_type: {
    type: DataTypes.ENUM('B2B', 'B2C'),
    allowNull: false
  },
  payment_type: {
    type: DataTypes.ENUM('Prepaid', 'COD'),
    allowNull: false
  },
  cod_surcharge: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.0
  },
  delivery_charge: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  final_calculated_charge: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  current_status: {
    type: DataTypes.ENUM('Pending', 'Assigned', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Failed'),
    allowNull: false,
    defaultValue: 'Pending'
  },
  rescheduled_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  failed_reason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pickup_postal_code: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.pickup_pincode;
    }
  },
  drop_postal_code: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.drop_pincode;
    }
  },
  length_cm: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.length;
    }
  },
  width_cm: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.breadth;
    }
  },
  height_cm: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.height;
    }
  },
  actual_weight_kg: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.raw_actual_weight;
    }
  },
  volumetric_weight_kg: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.raw_volumetric_weight;
    }
  },
  chargeable_weight_kg: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.final_billable_weight;
    }
  },
  total_charge: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.final_calculated_charge;
    }
  },
  status: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.current_status;
    }
  },
  reschedule_date: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.rescheduled_date;
    }
  },
  pickupZone: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.pickupZoneRef;
    }
  },
  dropZone: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.dropZoneRef;
    }
  }
}, {
  sequelize,
  modelName: 'Order',
  tableName: 'orders',
  underscored: true
});

module.exports = Order;
