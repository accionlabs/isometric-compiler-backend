import { Inject, Service } from "typedi"
import { Controller, Post } from "../core"
import { CategoryService } from "../services/categories.service"
import { CategoryValidation } from "../validations/category.validation";
import { NextFunction, Request, Response } from 'express';
import { ObjectId } from "typeorm";


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
            const newShape = await this.categoryService.create({...req.body, path, ancestors });
            res.status(201).json(newShape);
        } catch(e) {
            next(e)
        }
      }
}