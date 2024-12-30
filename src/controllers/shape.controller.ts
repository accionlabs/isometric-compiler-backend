import { Inject, Service } from 'typedi';
import { ShapeService } from '../services/shape.service';
import { NextFunction, Request, Response } from 'express';
import { Controller, Get, Post } from '../core'
import { ValidShape } from '../validations/shape.validation';
import { CategoryService } from '../services/categories.service';
import { ObjectId } from 'mongodb';
import { Shape } from '../entities/shape.entity';
import { FilterUtils } from '../utils/filterUtils';
import { In } from 'typeorm';


@Service() // Marks this class as injectable
@Controller('/shapes')
export default class ShapeController {

  @Inject(() => ShapeService)
  private readonly shapeService: ShapeService

  @Inject(() => CategoryService)
  private readonly categoryService: CategoryService

  @Get('/', {
    isAuthenticated: true,
    authorizedRole: 'all'
  },
  {responseSchema: {}})
  async getAllShapes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Extract query parameters
      const query = req.query;  // All query parameters as a Record<string, any>
      const page = parseInt(req.query.page as string, 10) || 1;  // Default to page 1 if not specified
      const limit = parseInt(req.query.limit as string, 10) || 1000;  // Default to limit 10 if not specified
      const sort = req.query.sort ? JSON.parse(req.query.sort as string) : { createdAt: -1 };  // Default sort by createdAt

      // Define the fields that are allowed for filtering
      const allowedFields: (keyof Shape)[] = ['name', 'type', 'author', 'tags', 'category', 'version'];

      // Build dynamic filters using the utility function
      const filters = FilterUtils.buildMongoFilters<Shape>(query, allowedFields);
      // Use BaseService's findWithFilters method to apply filters, pagination, and sorting
      const { data, total } = await this.shapeService.findWithFilters(filters, page, limit, sort);

      res.status(200).json({ data, total });
    } catch (e) {
      next(e)
    }

  }


  @Post('/', ValidShape, {
    authorizedRole: 'all',
    isAuthenticated: false
  },
  {responseSchema: {}})
  async createShape(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {category,...reqBody} = req.body
      const newShape = await this.shapeService.create({...reqBody,category:new ObjectId(category)});
      res.status(201).json(newShape);
    } catch (e) {
      next(e)
    }
  }

  @Get('/category/:categoryId', {
    isAuthenticated: true,
    authorizedRole: 'all'
  },
  {responseSchema: {}})
  async getShapesByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { categoryId } = req.params;
        const childCategories = await this.categoryService.getChildrenCategories(categoryId)
        const categoriesTobeSearched: ObjectId[] = [new ObjectId(categoryId)]
        console.log(categoriesTobeSearched,'categoriesTobeSearched')
        childCategories.forEach(chCategory => categoriesTobeSearched.push(chCategory._id))
        const shapes = await this.shapeService.findWithFilters({ category: In(categoriesTobeSearched) }
        );
        res.json(shapes);
    } catch (e) {
        next(e)
    }
  }
}
