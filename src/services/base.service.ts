import { MongoError } from 'mongodb';
import { DeepPartial, Repository, ObjectLiteral } from 'typeorm';
import ApiError from '../utils/apiError';

export abstract class BaseService<T extends ObjectLiteral> {
  constructor(private readonly repository: Repository<T>) {}

  async findAll(): Promise<T[]> {
    return this.repository.find({});
  }

  async findOneById(id: string): Promise<T | null> {
    return this.repository.findOneBy({ id } as any);
  }

  async create(data: DeepPartial<T>): Promise<T> {
    try {
        const entity = this.repository.create(data); // Now correctly typed
        return await this.repository.save(entity);
    }
    catch(e) {
        console.log("in catch create")
        if (this.isDuplicateError(e)) {
            const duplicateInfo = this.getDuplicateKeyInfo(e);
            throw new ApiError( `Duplicate entry found for key: ${duplicateInfo.key}, value: ${duplicateInfo.value}`, 409); // Customize the error message
          }
        throw e
    }
  }

  private isDuplicateError(error: any): boolean {
    console.log("error.code", error)
    // Check if the error is a MongoDB duplicate key error
    return error instanceof MongoError && error.code === 11000;
  }

  private getDuplicateKeyInfo(error: any): { key: string; value: string } {
    if (error.keyPattern && error.keyValue) {
      const key = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[key];
      return { key, value };
    }
  
    // Fallback to parsing the error message if keyPattern and keyValue are missing
    const match = error.errmsg?.match(/index: (\w+).*dup key: { : "(.*?)" }/);
    if (match) {
      return { key: match[1], value: match[2] };
    }
  
    return { key: 'unknown', value: 'unknown' };
  }
  

  async update(id: string, data: DeepPartial<T>): Promise<T | null> {
    const entity = await this.findOneById(id);
    if (!entity) {
      return null;
    }
    Object.assign(entity, data);
    return this.repository.save(entity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result?.affected ?  result.affected > 0 : false;
  }
}