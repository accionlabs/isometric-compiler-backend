import { DataSource } from 'typeorm';
import config from './index'
import { Shape } from '../entities/shape.entity';
console.log("sjapeeeeee", Shape)

export const AppDataSource = new DataSource({
    type: 'mongodb',
    host: config.database.host,
    port: Number(config.database.port),
    database: config.database.name,
    useUnifiedTopology: true,
    synchronize: true, // Disable in production
    logging: false,
    entities: [Shape],
  });

  AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });