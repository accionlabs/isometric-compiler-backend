import { Service } from 'typedi';
import { Shape } from '../entities/shape.entity';
import { BaseService } from './base.service';
import { AppDataSource } from '../configs/database';

@Service()
export class ShapeService extends BaseService<Shape> {

  constructor() {
    console.log("xxxxxxxxxxxxxxxxxx",AppDataSource.entityMetadatas.map(metadata => metadata.name));
    super(AppDataSource.getMongoRepository(Shape));
  }
}
