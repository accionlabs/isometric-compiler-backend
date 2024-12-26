import { Service } from 'typedi';
import { BaseService } from './base.service';
import { AppDataSource } from '../configs/database';
import { Category } from '../entities/categories.entity';
import { ObjectId } from 'mongodb'
import ApiError from '../utils/apiError';

@Service()
export class CategoryService extends BaseService<Category> {
  constructor() {
    super(AppDataSource.getMongoRepository(Category));
  }
  


  async getCategoryPath(parentId: string, name: string): Promise<string>{
    const parentCategory = await this.findOneById(parentId);
    if(!parentCategory) {
      throw new ApiError('Parent Cateory not found', 404)
    }
    console.log("parentCategory", parentCategory)
    const path = `${parentCategory.path ?? ''}/${name}`
    console.log("path", path)
    
    console.log("now path", path)
    return path;
  }
}
