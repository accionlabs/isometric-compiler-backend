import { Repository, DeepPartial, ObjectLiteral, FindManyOptions, FindOneOptions, FindOptionsOrder, FindOptionsWhere, FindOptionsRelations, FindOptionsSelect, FindOptionsSelectByString } from 'typeorm';
import ApiError from '../utils/apiError';

export abstract class BaseService<T extends ObjectLiteral> {
  constructor(private readonly repository: Repository<T>) { }

  async findWithFilters(
    filters: FindOptionsWhere<T>,
    page: number = 1,
    limit: number = 1000,
    sort: FindOptionsOrder<T>,
    relations?: FindOptionsRelations<T>,
    select?: FindOptionsSelect<T>,
  ): Promise<{ data: T[]; total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.find({
        select: select,
        where: filters,
        skip,
        take: limit,
        order: sort,
        relations
      }),
      this.repository.count({ where: filters }),
    ]);
    return { data, total };
  }

  async getCount(filters: FindOptionsWhere<T>): Promise<number> {
    return this.repository.count({ where: filters });
  }

  async findAll(): Promise<T[]> {
    return this.repository.find();
  }

  getRepository(): Repository<T> {
    return this.repository;
  }

  async findOneById(id: number, relations?: FindOptionsRelations<T>): Promise<T | null> {
    const options: FindOneOptions<T> = {
      where: { _id: id } as any, // Workaround for TypeScript's strict typing
      relations,
    };
    return this.repository.findOne(options);
  }

  async create(data: DeepPartial<T>): Promise<T> {
    try {
      const entity = this.repository.create(data);
      return await this.repository.save(entity);
    } catch (e) {
      if (this.isDuplicateError(e)) {
        const duplicateInfo = this.getDuplicateKeyInfo(e);
        throw new ApiError(`Duplicate entry found for key: ${duplicateInfo.key}, value: ${duplicateInfo.value}`, 409);
      }
      throw e;
    }
  }

  private isDuplicateError(error: any): boolean {
    return error.code === '23505'; // PostgreSQL unique constraint violation
  }

  private getDuplicateKeyInfo(error: any): { key: string; value: string } {
    if (error.detail) {
      const match = error.detail.match(/Key \((\w+)\)=\((.*?)\)/);
      if (match) {
        return { key: match[1], value: match[2] };
      }
    }
    return { key: 'unknown', value: 'unknown' };
  }

  async update(id: number, data: DeepPartial<T>): Promise<T | null> {
    const entity = await this.findOneById(id);
    if (!entity) {
      throw new ApiError("Entity not found", 404);
    }
    Object.assign(entity, data);
    return this.repository.save(entity);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async deleteMany(query: Partial<T>): Promise<number> {
    const result = await this.repository.createQueryBuilder()
      .delete()
      .from(this.repository.metadata.name)
      .where(query)
      .execute();
    return result.affected || 0;
  }

  async updateMany(query: Partial<T>, data: DeepPartial<T>): Promise<number> {
    const result = await this.repository.createQueryBuilder()
      .update(this.repository.metadata.name)
      .set(data)
      .where(query)
      .execute();
    return result.affected || 0;
  }

  async createMany(data: DeepPartial<T>[]): Promise<T[]> {
    try {
      const entities = this.repository.create(data);
      return await this.repository.save(entities);
    } catch (e) {
      if (this.isDuplicateError(e)) {
        const duplicateInfo = this.getDuplicateKeyInfo(e);
        throw new ApiError(`Duplicate entry found for key: ${duplicateInfo.key}, value: ${duplicateInfo.value}`, 409);
      }
      throw e;
    }
  }

}
