import { Inject, Service } from "typedi"
import { Controller, Delete, Get, Post, Put } from "../core"
import { CategoryService } from "../services/categories.service"
import { CategoryUpadteValidation, CategoryValidation } from "../validations/category.validation";
import { NextFunction, Request, Response } from 'express';
import { ObjectId } from "mongodb";
import { Category } from "../entities/categories.entity";
import ApiError from "../utils/apiError";
import { ShapeService } from "../services/shape.service";
import { FilterUtils } from "../utils/filterUtils";


@Service()
@Controller('/categories')
export default class CategoriesController {
    @Inject(() => CategoryService)
    private readonly categoryService: CategoryService

    @Inject(() => ShapeService)
    private readonly shapeService: ShapeService


    @Post('/', CategoryValidation, {
        authorizedRole: 'all',
        isAuthenticated: true
    },
        Category)
    async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { parent, name } = req.body;
            let path: string = name;
            let ancestors: number[] = []
            if (parent) {
                const catPath = await this.categoryService.getCategoryPath(parent, name)
                path = catPath.path;
                ancestors = catPath.ancestors
            }
            const newShape = await this.categoryService.create({ ...req.body, path, ancestors, ...(parent && { parent: Number(parent) }) });
            res.status(201).json(newShape);
        } catch (e) {
            next(e)
        }
    }


    // @Delete('/:id', {
    //     isAuthenticated: true,
    //     authorizedRole: 'all'
    // },
    //     {})
    // async deleteCategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    //     try {
    //         const { categoryIdForExistingShapes } = req.query

    //         const category = await this.categoryService.findOneById(Number(req.params.id));
    //         if (!category) {
    //             throw new ApiError('Category not found', 404)
    //         }

    //         const shapesCountInCategory = await this.shapeService.getCount({ category: Number(req.params.id) })
    //         if (shapesCountInCategory > 0) {
    //             if (!categoryIdForExistingShapes) {
    //                 throw new ApiError('categoryIdForExistingShapes for moving existing shape is required!', 400)
    //             }
    //             const categoryForShapes = await this.categoryService.findOneById(categoryIdForExistingShapes as string)
    //             if (!categoryForShapes) {
    //                 throw new ApiError('Shape Category not found', 404)
    //             }
    //             await this.shapeService.updateMany({ category: Number(req.params.id) }, { category: Number(categoryIdForExistingShapes as string) })
    //         }
    //         await this.categoryService.delete(req.params.id);
    //         res.status(200).json({ message: 'Category deleted successfully' });
    //     } catch (e) {
    //         next(e)
    //     }

    // }


    @Put('/:id', CategoryUpadteValidation, {
        authorizedRole: 'all',
        isAuthenticated: true
    },
        Category || null)
    async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const categoryId = req.params.id
            const { parent, name } = req.body;
            if (categoryId == parent) {
                throw new ApiError('Category can not be parent of itself', 400)
            }
            let reqBody = { ...req.body, ...(parent && { parent: Number(parent) }) }
            if (parent) {
                const catPath = await this.categoryService.getPathOnParentChange(Number(categoryId), parent, name)
                reqBody = { ...reqBody, path: catPath.path, ancestors: catPath.ancestors }
            }
            const newShape = await this.categoryService.update(Number(categoryId), { ...reqBody, ...(parent && { parent: Number(parent) }) })
            res.status(201).json(newShape);
        } catch (e) {
            next(e)
        }
    }

    @Get('/', {
        authorizedRole: 'all',
        isAuthenticated: true
    },
        Array<Category>)
    async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { format, page = 1, limit = 1000, sortName = 'createdAt', sortOrder = 'asc', ...restQuery } = req.query;

            let shapes
            if (format === 'nested') {
                shapes = await this.categoryService.getCategoriesNested()
            } else if (format === 'formatted') {
                shapes = await this.categoryService.getCategoriesFlat()
            } else {
                const allowedFields: (keyof Category)[] = ['name', 'parent', 'path'];

                const filters = FilterUtils.buildPostgresFilters<Category>(restQuery, allowedFields);
                const sort: Record<string, 1 | -1> = { [sortName as string]: sortOrder === 'asc' ? 1 : -1 };
                shapes = await this.categoryService.findWithFilters(filters, parseInt(page as string, 10), parseInt(limit as string, 10), sort);
            }
            res.status(201).json(shapes);
        } catch (e) {
            next(e)
        }
    }

    @Get('/:id', {
        isAuthenticated: true,
        authorizedRole: 'all'
    },
        Category)
    async getCategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const category = await this.categoryService.findOneById(Number(req.params.id), { parent: true });
            if (!category) {
                throw new ApiError('Category not found', 404)
            }
            res.status(200).json(category);
        } catch (e) {
            next(e)
        }

    }
}