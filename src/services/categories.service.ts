import { Service } from 'typedi';
import { BaseService } from './base.service';
import { AppDataSource } from '../configs/database';
import { Category } from '../entities/categories.entity';
import ApiError from '../utils/apiError';

type CategoryWithCount = Category & { shapeCount: number }

@Service()
export class CategoryService extends BaseService<Category> {
  constructor() {
    super(AppDataSource.getRepository(Category));
    // setTimeout(() => {
    //   this.getRepository().createCollectionIndex({ path: 'text' });
    // }, 10000);
  }



  async getCategoryPath(parentId: number, name: string): Promise<{ path: string, ancestors: number[] }> {
    const parentCategory = await this.findOneById(parentId);
    if (!parentCategory) {
      throw new ApiError('Parent Cateory not found', 404)
    }
    const path = `${parentCategory.path ?? ''}/${name}`
    const ancestors = parentCategory.ancestors ?? []
    ancestors.unshift(parentId)
    return { path, ancestors };
  }

  async getPathOnParentChange(_id: number, parentId: number, name?: string): Promise<{ path: string, ancestors: number[] }> {
    const existingCategory = await this.findOneById(_id);
    if (!existingCategory) {
      throw new ApiError('Parent not found', 404)
    }

    if (parentId == (existingCategory.parent?._id)) {
      return { path: existingCategory.path, ancestors: existingCategory.ancestors }
    }
    return this.getCategoryPath(parentId, name ?? existingCategory.name)
  }

  async getCategoriesFlat(): Promise<Category[]> {
    const repository = this.getRepository();

    const query = `
        WITH RECURSIVE category_hierarchy AS (
            SELECT 
                c._id,
                c.name,
                c.description,
                c.path,
                c.metadata,
                c.ancestors,
                c."parent_id",
                ARRAY[]::integer[] AS level_ancestors,
                0 AS level
            FROM categories c
            WHERE c."parent_id" IS NULL

            UNION ALL

            SELECT 
                child._id,
                child.name,
                child.description,
                child.path,
                child.metadata,
                child.ancestors,
                child."parent_id",
                ch.level_ancestors || child."parent_id",
                ch.level + 1
            FROM categories child
            INNER JOIN category_hierarchy ch ON child."parent_id" = ch._id
        )
        SELECT 
            c.*,
            (SELECT COUNT(*) FROM category_hierarchy) AS total_count
        FROM category_hierarchy c
        ORDER BY c.level;
    `;

    return repository.query(query);
  }


  async getCategoriesNested(): Promise<Category[]> {
    const repository = this.getRepository();

    const query = `
        WITH shape_counts AS (
            SELECT "category_id", COUNT(*) AS "shapeCount"
            FROM shapes
            GROUP BY "category_id"
        ),
        category_hierarchy AS (
            SELECT 
                c._id,
                c.name,
                c.description,
                c.path,
                c.metadata,
                c.ancestors,
                c."parent_id",
                COALESCE(sc."shapeCount", 0)::INTEGER AS "shapeCount"
            FROM categories c
            LEFT JOIN shape_counts sc ON c._id = sc."category_id"
        )
        SELECT * FROM category_hierarchy;
    `;

    const categories = await repository.query(query);
    return this.createNestedStructure(categories);
  }



  private createNestedStructure(categories: CategoryWithCount[]) {
    const categoryMap: any = {};
    categories.forEach((category) => {
      categoryMap[String(category._id)] = { ...category, children: [] };
    });

    let rootCategories: any = [];
    categories.forEach((category) => {
      //@ts-ignore
      const parentId = category.parent_id;
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

  async getChildrenCategories(id: string): Promise<Category[]> {
    const repository = this.getRepository();

    const query = `
        WITH RECURSIVE category_hierarchy AS (
            SELECT 
                c._id, c.name, c.description, c.path, c.metadata, c.ancestors, c."parent_id"
            FROM categories c
            WHERE c._id = $1

            UNION ALL

            SELECT 
                child._id, child.name, child.description, child.path, child.metadata, child.ancestors, child."parent_id"
            FROM categories child
            INNER JOIN category_hierarchy ch ON child."parent_id" = ch._id
        )
        SELECT * FROM category_hierarchy WHERE _id != $1;
    `;

    return repository.query(query, [id]);
  }


}
