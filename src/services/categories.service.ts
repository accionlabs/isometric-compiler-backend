import { Service } from 'typedi';
import { BaseService } from './base.service';
import { AppDataSource } from '../configs/database';
import { Category } from '../entities/categories.entity';
import { ObjectId } from 'mongodb'
import ApiError from '../utils/apiError';
import { FindOptionsWhere } from 'typeorm';

type CategoryWithCount = Category & { shapeCount: number }

@Service()
export class CategoryService extends BaseService<Category> {
  constructor() {
    super(AppDataSource.getMongoRepository(Category));
    setTimeout(() => { 
      this.getRepository().createCollectionIndex({ path: 'text' });
    }, 10000);
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

  async getCategoriesFlat() {
    const repository = this.getRepository();
    const pipeline = [
      {
        $match: {
          parent: null
        }
      },
      {
        $graphLookup: {
          from: "categories",
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "parent",
          as: "allDescendants",
          depthField: "level"
        }
      },
      {
        $unwind: {
          path: "$allDescendants",
          preserveNullAndEmptyArrays: true
        },

      },
      {
        $sort: {
          "allDescendants.level": 1
        }
      },
      {
        $group: {
          _id: "$_id",
          root: { $first: "$$ROOT" },
          sortedDescendants: { $push: "$allDescendants" },
        },
      },
      {
        $addFields: {
         
          totalCount: {
            $add: [
              { $size: "$sortedDescendants" },
              1,
            ],
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              "$root", // Keep root category fields
              { allDescendants: "$sortedDescendants" }, // Include all descendants
              { count: "$totalCount" }, // Add the total count
            ],
          },
        },
      },
    ];
  
    return repository.aggregate(pipeline).toArray();
  }  

  async getCategoriesNested() {
    const repository = this.getRepository();
    const pipeline = [
      {
        $lookup: {
          from: "shapes",
          let: { categoryId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$category", "$$categoryId"]
                }
              }
            },
            { 
              $project: {
                _id: 1
              }
             }
          ],
          as: "shapes",
        },
      },
      {
        $addFields: {
          shapeCount: { $size: "$shapes" }
        }
      },
      {
        $project: {
          shapes: 0
        }
      },
    ]
    
    const rootCategories = await repository.aggregate(pipeline).toArray() as any[]
    const buldCat: any = []
    rootCategories.forEach((category) => { 
      if (!category.parent) {
        buldCat.push(category)
      } else {
        const parent = buldCat.find((cat: any) => String(cat._id) === String(category.parent))
        if(parent) {
          parent.children = parent.children || []
          parent.children.push(category)
        } else {

        }
      }
     });
    return this.createNestedStructure(rootCategories)
  }


  private createNestedStructure(categories: CategoryWithCount[]) {
    const categoryMap: any = {};
    categories.forEach((category) => {
        categoryMap[String(category._id)] = { ...category, children: [] };
    });

    let rootCategories: any = [];
    categories.forEach((category) => {
        const parentId = category.parent;
        if (parentId) {
            if (categoryMap[String(parentId)]) {
                categoryMap[String(parentId)].children.push(categoryMap[String(category._id)]);
            }
        } else {
            rootCategories.push(categoryMap[String(category._id)]);
        }
    });
    function calculateShapeCount(category: any) {
        category.shapeCount = category.shapeCount || 0; 
        category.children.forEach((child: any) => {
            category.shapeCount += calculateShapeCount(child);
        });
        return category.shapeCount;
    }

    rootCategories.forEach(calculateShapeCount);

    return rootCategories;
}

  async getChildrenCategories(_id: string) {
    const repository = this.getRepository();
    const pipeline = [    {
      $match: {
        _id: new ObjectId(_id)
      }
    },
    {
      $graphLookup: {
        from: "categories",
        connectFromField: "_id",
        startWith: "$_id",
        connectToField: "parent",
        as: "children",
      }
    }]
    type CategoryEtention = Category & { children: Category[] }
    const result = await repository.aggregate(pipeline).toArray() as CategoryEtention[]
    return result[0]?.children || []
  }

  async search(
      text: string, 
      { filters = {}, limit = 1000, page = 1 }: {
      filters?: FindOptionsWhere<Category> | FindOptionsWhere<Category>[] | undefined, 
      limit?: number, 
      page?: number}
    ): Promise<Category[]> {
      const skip = (page - 1) * limit;
      const repository = this.getRepository();
      return repository.find({
          where: { $or: [ filters, { $text: { $search: text } } ] },
          skip,
          take: limit
        })
    }
}
