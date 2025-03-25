import { DataTypes, Model, Optional } from 'sequelize';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sequelize from '../utils/connection';

// Define the enum for roles
const RoleEnum = Object.freeze({
  USER: 'user',
  ADMIN: 'admin'
});

// Define interface for User attributes
interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  profile_first_name?: string;
  profile_last_name?: string;
  profile_phone?: string;
  profile_address?: string;
  isVerified: boolean;
  avatar_public_id?: string;
  avatar_url?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define interface for User creation attributes
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'isVerified' | 'role' | 'createdAt' | 'updatedAt'> {}

// Extend the Model class to include custom methods
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
  public role!: string;
  public profile_first_name?: string;
  public profile_last_name?: string;
  public profile_phone?: string;
  public profile_address?: string;
  public isVerified!: boolean;
  public avatar_public_id?: string;
  public avatar_url?: string;
  
  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Custom methods
  public SignAcessToken(): string {
    const token = jwt.sign({ id: this.id }, process.env.ACCESS_TOKEN || '', {
      expiresIn: process.env.EXPIRESIN || '5m',
    });
    return token;
  }

  public SignRefreshToken(): string {
    const token = jwt.sign({ id: this.id }, process.env.REFRESH_TOKEN || '', {
      expiresIn: process.env.EXPIRESIN_REFRESH || '3d'
    });
    return token;
  }
}

User.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM(...Object.values(RoleEnum)),
    defaultValue: RoleEnum.USER,
  },
  profile_first_name: {
    type: DataTypes.STRING,
  },
  profile_last_name: {
    type: DataTypes.STRING,
  },
  profile_phone: {
    type: DataTypes.STRING,
  },
  profile_address: {
    type: DataTypes.STRING,
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: true, //for assignment purpose
  },
  avatar_public_id: {
    type: DataTypes.STRING,
  },
  avatar_url: {
    type: DataTypes.STRING,
  },
}, {
  sequelize,
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
  },
});

export default User;