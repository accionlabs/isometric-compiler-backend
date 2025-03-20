import { DataSource } from 'typeorm';
import config from './index'
import { Shape } from '../entities/shape.entity';

export const AppDataSource = new DataSource({
  type: 'postgres', // Change 'mongodb' to 'postgres'
  host: config.database.host, // The host where your PostgreSQL database is running
  port: Number(config.database.port), // PostgreSQL default port is 5432
  username: config.database.username, // Database username
  password: config.database.password, // Database password
  database: config.database.name, // The name of your PostgreSQL database
  synchronize: true, // Automatically create database schema (disable in production)
  logging: false, // Set to true if you want to log SQL queries for debugging
  entities: [__dirname + '/../entities/*.entity{.ts,.js}'], // Path to your entities
  migrations: [__dirname + '/../migrations/*{.ts,.js}'], // Path to your migrations (if you are using migrations)
  // subscribers: [__dirname + '/../subscribers/*{.ts,.js}'], // Path to your subscribers (if you are using them)
  // Optionally, you can add extra configuration if needed:
  // ssl: true, // If you're using SSL connections
});
AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });