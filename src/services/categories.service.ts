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
  


  async getCategoryPath(parentId: string, name: string): Promise<{path: string, ancestors: ObjectId[]}>{
    const parentCategory = await this.findOneById(parentId);
    if(!parentCategory) {
      throw new ApiError('Parent Cateory not found', 404)
    }
    const path = `${parentCategory.path ?? ''}/${name}`
    const ancestors = parentCategory.ancestors ?? []
    ancestors.unshift(new ObjectId(parentId))
    return { path, ancestors};
  }

  async getPathOnParentChange(_id: string, parentId: string, name?: string): Promise<{path: string, ancestors: ObjectId[]}> {
    const existingCategory = await this.findOneById(_id);
    if(!existingCategory) {
      throw new ApiError('Parent not found', 404)
    }

    if(parentId == (existingCategory.parent ?? '')) {
      return { path: existingCategory.path, ancestors: existingCategory.ancestors }
    }
    return this.getCategoryPath(parentId, name ?? existingCategory.name)
  }
}
