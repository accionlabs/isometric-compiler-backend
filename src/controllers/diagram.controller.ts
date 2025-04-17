import { Inject, Service } from "typedi";
import { Controller, Delete, Get, Post, Put } from "../core";
import { DiagramService } from "../services/diagram.service";
import { CreateDiagramValidation, DiagramUpdateValidation } from "../validations/diagram.validation";
import { Diagram } from "../entities/diagram.entity";
import { NextFunction, Request, Response } from 'express';
import { FilterUtils } from "../utils/filterUtils";
import ApiError from "../utils/apiError";

@Service()
@Controller('/diagram')
export default class DiagramController {

    @Inject(() => DiagramService)
    private readonly diagramService: DiagramService

    @Post('/', CreateDiagramValidation, {
        authorizedRole: 'all',
        isAuthenticated: true
    },
        Diagram)
    async createDiagram(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // check project uuid coming or not, if not then insert for default project uuid

            const newDiagram = await this.diagramService.create({ ...req.body, author: req?.user?._id });
            res.status(201).json(newDiagram);
        } catch (e) {
            next(e)
        }
    }

    @Put('/:id', DiagramUpdateValidation, {
        isAuthenticated: true,
        authorizedRole: 'all'
    },
        Diagram)
    async updateDiagram(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const diagramId = req.params.id;
            const diagram = await this.diagramService.findOneById(Number(diagramId));
            if (!diagram) {
                throw new ApiError('diagram not found', 404)
            }
            if (diagram.author._id.toString() != req?.user?._id.toString()) {
                throw new ApiError('not authorized to edit', 403)
            }
            const updatedDiagram = await this.diagramService.update(Number(diagramId), req.body);
            res.status(200).json(updatedDiagram);
        } catch (e) {
            next(e)
        }

    }

    @Get('/', {
        isAuthenticated: true,
        authorizedRole: 'all'
    },
        { data: Array<Diagram>, total: Number })
    async getAllDiagram(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { page = 1, limit = 1000, sortName = 'createdAt', sortOrder = 'asc', ...query } = req.query
            const sort: Record<string, 1 | -1> = { [sortName as string]: sortOrder === 'asc' ? 1 : -1 };


            const allowedFields: (keyof Diagram)[] = ['name', 'version', "uuid", "createdAt", "updatedAt", "status"];

            const filters = FilterUtils.buildPostgresFilters<Diagram>(query, allowedFields);
            const { data, total } = await this.diagramService.findWithFilters(filters, parseInt(page as string, 10), parseInt(limit as string, 10), sort);

            res.status(200).json({ data, total });
        } catch (e) {
            next(e)
        }

    }


    @Delete('/:id', {
        isAuthenticated: true,
        authorizedRole: 'all'
    },
        {})
    async deleteDiagramById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const diagram = await this.diagramService.findOneById(Number(req.params.id));
            if (!diagram) {
                throw new ApiError('Diagram not found', 404)
            }
            if (diagram.author._id.toString() != req?.user?._id.toString()) {
                throw new ApiError('unauthorized to delete', 403)
            }
            await this.diagramService.delete(Number(req.params.id));
            res.status(200).json({ message: 'Diagram deleted successfully' });
        } catch (e) {
            next(e)
        }

    }

    @Get('/byUUId/:uuid', {
        isAuthenticated: true,
        authorizedRole: 'all'
    }, Diagram)
    async getDiagramById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const diagram = await this.diagramService.getDiagramByUUID(req.params.uuid);
            if (!diagram) {
                throw new ApiError('diagram not found', 404)
            }
            res.status(200).json(diagram);
        } catch (e) {
            next(e)
        }

    }

}