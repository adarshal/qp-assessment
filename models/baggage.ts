import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../utils/connection';

// Define interface for Baggage attributes
interface BaggageAttributes {
  id: number;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  checkInTime: Date;
  currentLocation: string; // Checkpoint ID or name
  expectedPath: string; // Storing as JSON string
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for Baggage creation attributes
interface BaggageCreationAttributes extends Optional<BaggageAttributes, 'id' | 'checkInTime' | 'createdAt' | 'updatedAt'> {}

// Extend the Model class
class Baggage extends Model<BaggageAttributes, BaggageCreationAttributes> implements BaggageAttributes {
  public id!: number;
  public airline!: string;
  public flightNumber!: string;
  public origin!: string;
  public destination!: string;
  public checkInTime!: Date;
  public currentLocation!: string; 
  public expectedPath!: string;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Baggage.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  airline: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  flightNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  origin: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  destination: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  checkInTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  currentLocation: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expectedPath: {
    type: DataTypes.TEXT, // Store as JSON string
    allowNull: false,
    get() {
      const rawValue = this.getDataValue('expectedPath');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value: string[]) {
      this.setDataValue('expectedPath', JSON.stringify(value));
    }
  }
}, {
  sequelize,
  tableName: 'baggages',
  timestamps: true,
});

// Create a separate model for actual path checkpoints
class BaggageCheckpoint extends Model {
  public id!: number;
  public baggageId!: number;
  public checkpoint!: string;
  public scannedAt!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

BaggageCheckpoint.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  baggageId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: Baggage,
      key: 'id',
    },
  },
  checkpoint: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  scannedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  tableName: 'baggage_checkpoints',
  timestamps: true,
});

// Set up the association
Baggage.hasMany(BaggageCheckpoint, { 
  foreignKey: 'baggageId',
  as: 'actualPath'
});
BaggageCheckpoint.belongsTo(Baggage, { 
  foreignKey: 'baggageId'
});

export { Baggage, BaggageCheckpoint };
