import { Inject, Service } from 'typedi';
import { ShapeService } from '../services/shape.service';
import { NextFunction, Request, Response } from 'express';
import { Controller, Get, Post } from '../core'
import { ValidShape } from '../validations/shape.validation';

@Service() // Marks this class as injectable
@Controller('/shape')
export default class ShapeController {

  @Inject(() => ShapeService)
  private readonly shapeService: ShapeService

  @Get('/', {
    isAuthenticated: true,
    authorizedRole: 'all'
  })
  async getAllShapes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try{
        const shapes = await this.shapeService.findAll();
        res.json(shapes);
    } catch (e) {
        next(e)
    }
  }

  @Post('/', ValidShape, { 
    authorizedRole: 'all',
    isAuthenticated: false
   })
  async createShape(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const newShape = await this.shapeService.create(req.body);
        res.status(201).json(newShape);
    } catch(e) {
        next(e)
    }
  }
}
