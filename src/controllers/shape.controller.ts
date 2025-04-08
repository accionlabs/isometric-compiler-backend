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
    { data: Array<Shape>, total: Number })
  async getAllShapes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 1000, sortName = 'createdAt', sortOrder = 'asc', ...query } = req.query
      const sort: Record<string, 1 | -1> = { [sortName as string]: sortOrder === 'asc' ? 1 : -1 };


      const allowedFields: (keyof Shape)[] = ['name', 'type', 'author', 'tags', 'category', 'version'];

      const filters = FilterUtils.buildPostgresFilters<Shape>(query, allowedFields);
      const { data, total } = await this.shapeService.findWithFilters(filters, parseInt(page as string, 10), parseInt(limit as string, 10), sort, { category: true });

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
      const shape = await this.shapeService.findOneById(Number(req.params.id), { category: true });
      if (!shape) {
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
      const shape = await this.shapeService.findOneById(Number(req.params.id));
      if (!shape) {
        throw new ApiError('Shape not found', 404)
      }
      await this.shapeService.delete(Number(req.params.id));
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
      const updatedShape = await this.shapeService.update(Number(shapeId), { ...reqBody, category });
      res.status(200).json(updatedShape);
    } catch (e) {
      next(e)
    }

  }


  @Post('/', ValidShape, {
    authorizedRole: 'all',
    isAuthenticated: true
  },
    Shape)
  async createShape(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, ...reqBody } = req.body
      const newShape = await this.shapeService.create({ ...reqBody, category });
      res.status(201).json(newShape);
    } catch (e) {
      next(e)
    }
  }

  @Get('/category/:categoryId', {
    isAuthenticated: true,
    authorizedRole: 'all'
  },
    {
      data: Array<Shape>,
      total: Number
    })
  async getShapesByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId } = req.params;
      const childCategories = await this.categoryService.getChildrenCategories(categoryId)
      const categoriesTobeSearched: number[] = [Number(categoryId)]
      childCategories.forEach(chCategory => categoriesTobeSearched.push(chCategory._id))
      const shapes = await this.shapeService.findWithFilters({ category: In(categoriesTobeSearched) }, 1, 1000, { name: 'ASC' }, { category: true }
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
    {
      data: Array<Shape>,
      total: Number
    })
  async searchShapes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { text } = req.params;
      const { page = 1, limit = 1000 } = req.query;

      const allowedFields: (keyof Shape)[] = ['name', 'type', 'author', 'tags', 'category', 'version'];

      const filters = FilterUtils.buildPostgresFilters<Shape>(req.query, allowedFields);

      const { data, total } = await this.shapeService.search(text as string, { filters, limit: parseInt(limit as string, 10), page: parseInt(page as string, 10) });
      res.status(200).json({ data, total });
    } catch (e) {
      next(e)
    }
  }
}
