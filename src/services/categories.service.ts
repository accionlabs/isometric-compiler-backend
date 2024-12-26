import { Service } from 'typedi';
import { BaseService } from './base.service';
import { AppDataSource } from '../configs/database';
import { Category } from '../entities/categories.entity';

@Service()
export class CategoryService extends BaseService<Category> {
  constructor() {
    super(AppDataSource.getMongoRepository(Category));
  }
  


  getCategoryPath(parentId: string){
    const categoryRepository = this.getRepository()
    
  }
}
