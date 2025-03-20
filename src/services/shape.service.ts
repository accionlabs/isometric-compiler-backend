import { Inject, Service } from 'typedi';
import { Shape } from '../entities/shape.entity';
import { BaseService } from './base.service';
import { AppDataSource } from '../configs/database';
import { FindOptionsWhere } from 'typeorm';
import { CategoryService } from './categories.service';

@Service()
export class ShapeService extends BaseService<Shape> {

  constructor() {
    super(AppDataSource.getRepository(Shape));
    // setTimeout(() => { 
    //   this.getRepository().createCollectionIndex({ name: 'text', 'metadata.description': 'text', tags: 'text' });
    //  }, 10000);

  }

  @Inject(() => CategoryService)
  private readonly categoryService: CategoryService

  async findWithFiltersAndCategoryDetails(
    filters: FindOptionsWhere<Shape>,
    page: number = 1,
    limit: number = 1000,
    sort: Record<string, 1 | -1> = { createdAt: -1 }
  ): Promise<{ data: Shape[], total: number }> {
    const repository = this.getRepository();
    const skip = (page - 1) * limit;

    // Convert sorting object to SQL ORDER BY clause
    const orderByClause = Object.entries(sort)
      .map(([key, value]) => `"${key}" ${value === 1 ? 'ASC' : 'DESC'}`)
      .join(', ');

    const query = `
        WITH total_count AS (
            SELECT COUNT(*) AS count FROM shapes WHERE ${Object.keys(filters).map((key, i) => `"${key}" = $${i + 1}`).join(' AND ')}
        )
        SELECT s.*, c.path AS category_path, (SELECT count FROM total_count) AS total
        FROM shapes s
        LEFT JOIN categories c ON s.category_id = c._id
        WHERE ${Object.keys(filters).map((key, i) => `"${key}" = $${i + 1}`).join(' AND ')}
        ORDER BY ${orderByClause}
        LIMIT $${Object.keys(filters).length + 1}
        OFFSET $${Object.keys(filters).length + 2};
    `;

    const filterValues = Object.values(filters);

    const result = await repository.query(query, [...filterValues, limit, skip]);

    return {
      data: result.map(({ total, category_path, ...shape }: any) => ({
        ...shape,
        categoryDetails: { path: category_path }
      })),
      total: result.length > 0 ? parseInt(result[0].total) : 0
    };
  }

  async search(query: string, { page = 1, limit = 10, filters }: {
    filters?: FindOptionsWhere<Shape>,
    page?: number;
    limit?: number;
  }): Promise<{ data: Shape[]; total: number; }> {
    const skip = limit * (page - 1)
    const repository = this.getRepository()
    const qb = repository
      .createQueryBuilder("shape")
      .leftJoinAndSelect("shape.category", "category")
      .where(`
        to_tsvector('english', coalesce(shape.name, '')) ||
        to_tsvector('english', coalesce(shape.metadata->>'description', '')) ||
        to_tsvector('english', array_to_string(shape.tags, ' ')) ||
        to_tsvector('english', coalesce(category.name, ''))
        @@ plainto_tsquery(:query)
      `, { query });

    // Apply filters dynamically
    if (filters)
      qb.andWhere(filters)

    // Get total count before applying pagination
    const total = await qb.getCount();

    // Apply pagination
    if (skip) {
      qb.skip(skip);
    }
    if (limit) {
      qb.take(limit);
    }

    const data = await qb.getMany();
    return { data, total };
  }


}
