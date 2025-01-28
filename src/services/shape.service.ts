import { Inject, Service } from 'typedi';
import { Shape } from '../entities/shape.entity';
import { BaseService } from './base.service';
import { AppDataSource } from '../configs/database';
import { FindOptionsWhere } from 'typeorm';
import { CategoryService } from './categories.service';

@Service()
export class ShapeService extends BaseService<Shape> {

  constructor() {
    super(AppDataSource.getMongoRepository(Shape));
    setTimeout(() => { 
      this.getRepository().createCollectionIndex({ name: 'text', 'metadata.description': 'text', tags: 'text' });
     }, 10000);
    
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
      
        const pipeline = [
          { $match: filters },
          { $sort: sort },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: "categories",
              let: { category: "$category" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ["$_id", "$$category"]
                    }
                  }
                },
                { 
                  $project: {
                    path: 1
                  }
                 }
              ],
              as: "categoryDetails",
            },
          },
          {
            $unwind: { path: '$categoryDetails', preserveNullAndEmptyArrays: true }, // Unwind categoryDetails
          },
        ];
      
        const [data, total] = await Promise.all([
          repository.aggregate(pipeline).toArray(),
          repository.countDocuments(filters),
        ]);
      
        return { data, total };
      }

  async search(
    text: string, 
    { filters = {}, limit = 1000, page = 1 }: {
    filters?: FindOptionsWhere<Shape> | FindOptionsWhere<Shape>[] | undefined, 
    limit?: number, 
    page?: number}
  ): Promise<{ data: Shape[]; total: number }> {
    const skip = (page - 1) * limit;
    const categoryids = (await this.categoryService.search(text, {})).map((category) => category._id);
    const repository = this.getRepository();
    const query = { $and : [
      filters,
      { $or: [
        { $text: { $search: text } },
        { category: { $in: categoryids } }
      ]}
    ]}
    const pipeline = [
      {
        $match: query
      },
      {
        $lookup: {
          from: "categories",
          let: { category: "$category" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$category"]
                }
              }
            },
            { 
              $project: {
                path: 1
              }
             }
          ],
          as: "categoryDetails",
        },
      },
      {
        $unwind: {
          path: "$categoryDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      }
    ]

    const [data, total] = await Promise.all([
      repository.aggregate(pipeline).toArray() as any,
      repository.countDocuments(query),
    ]);
    return { data, total };

  }

}
