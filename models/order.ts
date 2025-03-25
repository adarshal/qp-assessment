import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../utils/connection';
import User from './user';
import GroceryItem from './groceryItem';

// Define OrderStatus enum
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

// Define interface for Order attributes
interface OrderAttributes {
  id: number;
  userId: number;
  totalAmount: number;
  status: string;
  deliveryAddress?: string;
  contactNumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for Order creation attributes
interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

// Order Model
class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: number;
  public userId!: number;
  public totalAmount!: number;
  public status!: string;
  public deliveryAddress?: string;
  public contactNumber?: string;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Order.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM(...Object.values(OrderStatus)),
    defaultValue: OrderStatus.PENDING,
  },
  deliveryAddress: {
    type: DataTypes.TEXT,
  },
  contactNumber: {
    type: DataTypes.STRING,
  }
}, {
  sequelize,
  tableName: 'orders',
  timestamps: true,
});

// Define interface for OrderItem attributes
interface OrderItemAttributes {
  id: number;
  orderId: number;
  groceryItemId: number;
  quantity: number;
  price: number; // Price at the time of order
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for OrderItem creation attributes
interface OrderItemCreationAttributes extends Optional<OrderItemAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// OrderItem Model
class OrderItem extends Model<OrderItemAttributes, OrderItemCreationAttributes> implements OrderItemAttributes {
  public id!: number;
  public orderId!: number;
  public groceryItemId!: number;
  public quantity!: number;
  public price!: number;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

OrderItem.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  orderId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: Order,
      key: 'id',
    },
  },
  groceryItemId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: GroceryItem,
      key: 'id',
    },
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0
    }
  }
}, {
  sequelize,
  tableName: 'order_items',
  timestamps: true,
});

// Set up associations
User.hasMany(Order, { 
  foreignKey: 'userId',
  as: 'orders' 
});
Order.belongsTo(User, { 
  foreignKey: 'userId'
});

Order.hasMany(OrderItem, { 
  foreignKey: 'orderId',
  as: 'items',
  onDelete: 'CASCADE'
});
OrderItem.belongsTo(Order, { 
  foreignKey: 'orderId'
});

GroceryItem.hasMany(OrderItem, { 
  foreignKey: 'groceryItemId',
  as: 'orderItems' 
});
OrderItem.belongsTo(GroceryItem, { 
  foreignKey: 'groceryItemId'
});

export { Order, OrderItem }; 