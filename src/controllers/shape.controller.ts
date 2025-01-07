import { Inject, Service } from 'typedi';
import { ShapeService } from '../services/shape.service';
import { NextFunction, Request, Response } from 'express';
import { Controller, Delete, Get, Post, Put } from '../core'
import { ShapeUpdateValidation, ValidShape } from '../validations/shape.validation';
import { CategoryService } from '../services/categories.service';
import { ObjectId } from 'mongodb';
import { Shape } from '../entities/shape.entity';
import { FilterUtils } from '../utils/filterUtils';
import ApiError from '../utils/apiError';


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
  {data: Array<Shape>, total: Number})
  async getAllShapes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {page = 1, limit = 10, sortName = 'createdAt', sortOrder = 'asc', ...query} = req.query
      const sort: Record<string, 1 | -1> = { [sortName as string]: sortOrder === 'asc' ? 1 : -1 };


      // Define the fields that are allowed for filtering
      const allowedFields: (keyof Shape)[] = ['name', 'type', 'author', 'tags', 'category', 'version'];

      // Build dynamic filters using the utility function
      const filters = FilterUtils.buildMongoFilters<Shape>(query, allowedFields);
      // Use BaseService's findWithFilters method to apply filters, pagination, and sorting
      const { data, total } = await this.shapeService.findWithFilters(filters, parseInt(page as string, 10), parseInt(limit as string, 10), sort);

      res.status(200).json({ data, total });
    } catch (e) {
      next(e)
    }

  }

  @Get('/:id', {
    isAuthenticated: true,
    authorizedRole: 'all'
  },
  Shape)
  async getShapeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shape = await this.shapeService.findOneById(req.params.id);
      if(!shape) {
        throw new ApiError('Shape not found', 404)
      }
      res.status(200).json(shape);
    } catch (e) {
      next(e)
    }

  }

  @Delete('/:id', {
    isAuthenticated: true,
    authorizedRole: 'all'
  },
  {})
  async deleteShapeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shape = await this.shapeService.findOneById(req.params.id);
      if(!shape) {
        throw new ApiError('Shape not found', 404)
      }
      await this.shapeService.delete(req.params.id);
      res.status(200).json({ message: 'Shape deleted successfully' });
    } catch (e) {
      next(e)
    }

  }

  @Put('/:id', ShapeUpdateValidation, {
    isAuthenticated: true,
    authorizedRole: 'all'
  },
  Shape)
  async updateShape(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const shapeId = req.params.id;
      const { category, ...reqBody } = req.body;
      const updatedShape = await this.shapeService.update(shapeId, { ...reqBody, category: new ObjectId(category) });
      res.status(200).json(updatedShape);
    } catch (e) {
      next(e)
    }

  }


  @Post('/', ValidShape, {
    authorizedRole: 'all',
    isAuthenticated: false
  },
  Shape)
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
  { data: Array<Shape>,
    total: Number})
  async getShapesByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { categoryId } = req.params;
        if(!ObjectId.isValid(categoryId)){
          throw new ApiError("incorrect category ID", 404)
        }

        const childCategories = await this.categoryService.getChildrenCategories(categoryId)
        const categoriesTobeSearched: ObjectId[] = [new ObjectId(categoryId)]
        childCategories.forEach(chCategory => categoriesTobeSearched.push(chCategory._id))
        // @ts-ignore
        const shapes = await this.shapeService.findWithFilters({ category: { '$in': categoriesTobeSearched } }
        );
        res.json(shapes);
    } catch (e) {
        next(e)
    }
  }

  @Get('/search/:text', {
    isAuthenticated: true,
    authorizedRole: 'all'
  },
  { data: Array<Shape>,
    total: Number})
  async searchShapes(req: Request, res: Response, next: NextFunction): Promise<void> {  
    try {
      const { text } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      const allowedFields: (keyof Shape)[] = ['name', 'type', 'author', 'tags', 'category', 'version'];

      const filters = FilterUtils.buildMongoFilters<Shape>(req.query, allowedFields);

      const { data, total } = await this.shapeService.search(text as string, {  filters, limit: parseInt(limit as string, 10), page: parseInt(page as string, 10) });
      res.status(200).json({ data, total });
    } catch (e) {
      next(e)
    }
  }
}
