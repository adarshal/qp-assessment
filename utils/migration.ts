import sequelize from './connection';
import { Baggage, BaggageCheckpoint } from '../models/baggage';
import User from '../models/user';
import GroceryItem from '../models/groceryItem';
import { Order, OrderItem, OrderStatus } from '../models/order';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const initializeDatabase = async () => {
  try {
    // Test the connection
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    // Force sync all models (this will drop tables if they exist)
    console.log('Syncing database models...');
    await sequelize.sync({ force: true });
    
    console.log('Database migration completed successfully.');
    
    // Create a default admin user if it doesn't exist
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123', // This will be hashed by the model hook
      role: 'admin',
      isVerified: true
    });
    console.log('Default admin user created.');

    // Create a regular user
    const regularUser = await User.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'user123',
      role: 'user',
      isVerified: true
    });
    console.log('Default regular user created.');

    // Create sample grocery items
    const groceryItems = await GroceryItem.bulkCreate([
      {
        name: 'Organic Apples',
        description: 'Fresh organic apples from local farms',
        price: 5.99,
        inventory: 100,
        category: 'Fruits',
        imageUrl: 'https://example.com/apple.jpg',
        isAvailable: true
      },
      {
        name: 'Whole Grain Bread',
        description: 'Freshly baked whole grain bread',
        price: 3.49,
        inventory: 50,
        category: 'Bakery',
        imageUrl: 'https://example.com/bread.jpg',
        isAvailable: true
      },
      {
        name: 'Free Range Eggs',
        description: 'Free range eggs from humanely raised chickens',
        price: 4.99,
        inventory: 80,
        category: 'Dairy & Eggs',
        imageUrl: 'https://example.com/eggs.jpg',
        isAvailable: true
      },
      {
        name: 'Organic Milk',
        description: 'Organic whole milk from grass-fed cows',
        price: 3.99,
        inventory: 45,
        category: 'Dairy & Eggs',
        imageUrl: 'https://example.com/milk.jpg',
        isAvailable: true
      },
      {
        name: 'Ground Coffee',
        description: 'Premium ground coffee beans',
        price: 8.99,
        inventory: 60,
        category: 'Beverages',
        imageUrl: 'https://example.com/coffee.jpg',
        isAvailable: true
      }
    ]);
    console.log('Sample grocery items created.');

    // Create a sample order for the regular user
    const order = await Order.create({
      userId: regularUser.id,
      totalAmount: 14.97,
      status: OrderStatus.DELIVERED,
      deliveryAddress: '123 Main St, Anytown, CA 12345',
      contactNumber: '555-123-4567'
    });

    // Add items to the order
    await OrderItem.bulkCreate([
      {
        orderId: order.id,
        groceryItemId: groceryItems[0].id, // Apples
        quantity: 1,
        price: groceryItems[0].price
      },
      {
        orderId: order.id,
        groceryItemId: groceryItems[1].id, // Bread
        quantity: 2,
        price: groceryItems[1].price
      },
      {
        orderId: order.id,
        groceryItemId: groceryItems[4].id, // Coffee
        quantity: 1,
        price: groceryItems[4].price
      }
    ]);
    console.log('Sample order created.');

    process.exit(0);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

initializeDatabase(); 