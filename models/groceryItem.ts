import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../utils/connection';

// Define interface for GroceryItem attributes
interface GroceryItemAttributes {
  id: number;
  name: string;
  description: string;
  price: number;
  inventory: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for GroceryItem creation attributes
interface GroceryItemCreationAttributes extends Optional<GroceryItemAttributes, 'id' | 'isAvailable' | 'createdAt' | 'updatedAt'> {}

// Extend the Model class
class GroceryItem extends Model<GroceryItemAttributes, GroceryItemCreationAttributes> implements GroceryItemAttributes {
  public id!: number;
  public name!: string;
  public description!: string;
  public price!: number;
  public inventory!: number;
  public category!: string;
  public imageUrl?: string;
  public isAvailable!: boolean;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

GroceryItem.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  inventory: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  imageUrl: {
    type: DataTypes.STRING,
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  sequelize,
  tableName: 'grocery_items',
  timestamps: true,
});

export default GroceryItem; 