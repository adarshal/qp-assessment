import { Sequelize } from 'sequelize';
import path from 'path';

// Create a new instance of Sequelize for SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.SQLITE_PATH || path.join(__dirname, '..', 'database.sqlite'),
  logging: false // Set to true if you want to see SQL queries in the console
});

export const connectToDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite Database Connection Successful!');
    // Sync all models with the database
    // Note: force: true will drop tables if they exist
    await sequelize.sync({ force: false });
    console.log('Database synchronized');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

export default sequelize;