import { Inject, Service } from "typedi"
import { Controller, Post } from "../core"
import { CategoryService } from "../services/categories.service"
import { CategoryValidation } from "../validations/category.validation";
import { NextFunction, Request, Response } from 'express';


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
            let path: string
            if(!parent) {
                path = name
            } else {
                path = await this.categoryService.getCategoryPath(parent, name)
            }
            const newShape = await this.categoryService.create({...req.body, path });
            res.status(201).json(newShape);
        } catch(e) {
            next(e)
        }
      }
}