import { MongoError, ObjectId } from 'mongodb';
import { DeepPartial, ObjectLiteral, MongoRepository,FindOptionsWhere } from 'typeorm';
import ApiError from '../utils/apiError';


export abstract class BaseService<T extends ObjectLiteral> {
  constructor(private readonly repository: MongoRepository<T>) { }

  async findWithFilters(
    filters: FindOptionsWhere<T>, 
    page: number = 1,
    limit: number = 1000,
    sort: Record<string, 1 | -1> = { createdAt: -1 }
  ): Promise<{ data: T[]; total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.find({
        where: filters,
        skip,
        take: limit,
        order: sort,
      }),
      this.repository.countDocuments(filters),
    ]);
    return { data, total };
  }


  async getCount(filters: FindOptionsWhere<T>): Promise<number> { 
    return this.repository.countDocuments(filters);
   }

  async findAll(): Promise<T[]> {
    return this.repository.find({});
  }

  getRepository(): MongoRepository<T> {
    return this.repository
  }

  async findOneById(id: string): Promise<T | null> {
    return this.repository.findOneBy({ _id: new ObjectId(id) });
  }

  async create(data: DeepPartial<T>): Promise<T> {
    try {
      const entity = this.repository.create(data); // Now correctly typed
      return await this.repository.save(entity);
    }
    catch (e) {
      if (this.isDuplicateError(e)) {
        const duplicateInfo = this.getDuplicateKeyInfo(e);
        throw new ApiError(`Duplicate entry found for key: ${duplicateInfo.key}, value: ${duplicateInfo.value}`, 409); // Customize the error message
      }
      throw e
    }
  }

  private isDuplicateError(error: any): boolean {
    // Check if the error is a MongoDB duplicate key error
    return error instanceof MongoError && error.code === 11000;
  }

  private getDuplicateKeyInfo(error: any): { key: string; value: string } {
    if (error.writeErrors && error.writeErrors.length > 0) {
      const writeError = error.writeErrors[0];
      const match = writeError.errmsg.match(/dup key: \{ (\w+): "(.*?)" \}/); // Extract key-value from errmsg
      if (match) {
        return { key: match[1], value: match[2] };
      }
    }
  
    return { key: 'unknown', value: 'unknown' };
  }


  async update(id: string, data: DeepPartial<T>): Promise<T | null> {
    const entity = await this.findOneById(id);
    if (!entity) {
      throw new ApiError("entity not found", 404);
    }
    Object.assign(entity, data);
    return this.repository.save(entity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result?.affected ? result.affected > 0 : false;
  }

  async deleteMany(query: ObjectLiteral): Promise<number> {
    const result = await this.repository.deleteMany(query);
    return result?.deletedCount || 0;
  }

  async updateMany(query: ObjectLiteral, data: DeepPartial<T>): Promise<number> {
    const result = await this.repository.updateMany(query, { $set: data }); 
    return result?.modifiedCount || 0;
  }
}
