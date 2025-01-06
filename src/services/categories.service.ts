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

  private buildTree(categories: Category[], parentId: ObjectId | null = null): Category[] {
    return categories
      .filter(category => String(category.parent) === String(parentId))
      .map(category => ({
        ...category,
        children: this.buildTree(categories, category._id)
      }));
  }

  async getCategoriesNested() {
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
          as: "children",
          depthField: "level"
        }
      },
      {
        $unwind: {
          path: "$children",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: {
          "children.level": 1
        }
      },
      {
        $group: {
          _id: "$_id",
          root: { $first: "$$ROOT" },
          sortedDescendants: { $push: "$children" }
        }
      },
      {
        $addFields: {
          "root.children": {
            $map: {
              input: "$sortedDescendants",
              as: "child",
              in: {
                $mergeObjects: [
                  "$$child",
                  {
                    totalChildrenCount: {
                      $size: {
                        $filter: {
                          input: "$sortedDescendants",
                          as: "descendant",
                          cond: { $eq: ["$$descendant.parent", "$$child._id"] }
                        }
                      }
                    }
                  }
                ]
              }
            }
          },
          "root.totalChildrenCount": {
            $size: "$sortedDescendants"
          }
        }
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ["$root", { children: "$root.children" }]
          }
        }
      }
    ];
    
    const rootCategories = await repository.aggregate(pipeline).toArray() as any[]
    return rootCategories.map(root => ({
      ...root,
      children: this.buildTree(root.children, root._id)
    }));
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
}
