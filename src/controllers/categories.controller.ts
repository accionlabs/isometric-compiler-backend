import { Inject, Service } from "typedi"
import { Controller, Get, Post, Put } from "../core"
import { CategoryService } from "../services/categories.service"
import { CategoryUpadteValidation, CategoryValidation } from "../validations/category.validation";
import { NextFunction, Request, Response } from 'express';
import { ObjectId } from "mongodb";


@Service()
@Controller('/categories')
export default class CategoriesController{
    @Inject(() => CategoryService)
    private readonly categoryService: CategoryService


    @Post('/', CategoryValidation, { 
        authorizedRole: 'all',
        isAuthenticated: false
       })
      async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { parent, name } = req.body;
            let path: string = name;
            let ancestors: ObjectId[] = []
            if(parent) {
                const catPath = await this.categoryService.getCategoryPath(parent, name)
                path = catPath.path;
                ancestors = catPath.ancestors
            }
            const newShape = await this.categoryService.create({...req.body, path, ancestors, ...(parent && { parent: new ObjectId(parent) }) });
            res.status(201).json(newShape);
        } catch(e) {
            next(e)
        }
      }

      @Put('/:id', CategoryUpadteValidation, { 
        authorizedRole: 'all',
        isAuthenticated: false
       })
      async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const categoryId = req.params.id
            const { parent, name } = req.body;
            let reqBody = { ...req.body, ...(parent && { parent: new ObjectId(parent) }) }
            if(parent) {
                const catPath = await this.categoryService.getPathOnParentChange(categoryId, parent, name)
                reqBody = { ...reqBody, path: catPath.path, ancestors: catPath.ancestors }
            }
            const newShape = await this.categoryService.update(categoryId, { ...reqBody })
            res.status(201).json(newShape);
        } catch(e) {
            next(e)
        }
      }

      @Get('/formated', { 
        authorizedRole: 'all',
        isAuthenticated: false
       })
      async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { format } = req.query;
            let shapes
            if(format === 'nested') {
                shapes = await this.categoryService.getCategoriesNested()
            } else {
                shapes = await this.categoryService.getCategoriesFlat()
            }
            res.status(201).json(shapes);
        } catch(e) {
            next(e)
        }
      }
}