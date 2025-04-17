import { Inject, Service } from "typedi";
import { Controller, Delete, Get, Post, Put } from "../core";
import { NextFunction, Request, Response } from 'express';
import { FilterUtils } from "../utils/filterUtils";
import ApiError from "../utils/apiError";
import { Project } from "../entities/project.entity";
import { ProjectService } from "../services/project.service";
import { CreateProjectValidation } from "../validations/project.validation";

@Service()
@Controller('/project')
export default class ProjectController {
    @Inject(() => ProjectService)
    private readonly projectService: ProjectService

    @Post('/', CreateProjectValidation, {
        authorizedRole: 'all',
        isAuthenticated: true
    }, Project)
    async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?._id;
            if (!userId) throw new ApiError('Unauthorized', 401);

            const project = await this.projectService.create({ ...req.body, userId });
            res.status(201).json(project);
        } catch (e) {
            next(e);
        }
    }

    @Get('/', {
        isAuthenticated: true,
        authorizedRole: 'all'
    }, { data: Array<Project>, total: Number })
    async getAllProject(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const {
                page = 1,
                limit = 1000,
                sortName = 'createdAt',
                sortOrder = 'asc',
                ...query
            } = req.query;

            const sort: Record<string, 1 | -1> = {
                [sortName as string]: sortOrder === 'asc' ? 1 : -1
            };

            const allowedFields: (keyof Project)[] = ['name', 'createdAt', "updatedAt", "status"];
            const filters = FilterUtils.buildPostgresFilters<Project>(query, allowedFields);

            const { data, total } = await this.projectService.findWithFilters(
                filters,
                parseInt(page as string, 10),
                parseInt(limit as string, 10),
                sort
            );

            res.status(200).json({ data, total });
        } catch (e) {
            next(e);
        }
    }


    @Put('/:id', CreateProjectValidation, {
        isAuthenticated: true,
        authorizedRole: 'all'
    }, Project)
    async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const projectId = parseInt(req.params.id, 10);
            if (isNaN(projectId)) {
                throw new ApiError('Invalid project ID', 400);
            }

            const existingProject = await this.projectService.findOneById(projectId);
            if (!existingProject) {
                throw new ApiError('Project not found', 404);
            }

            // Optional: Check if user owns the project, if ownership enforcement is needed
            if (existingProject.userId !== req.user?._id) {
                throw new ApiError('Unauthorized to update this project', 403);
            }

            const updatedProject = await this.projectService.update(projectId, req.body);
            res.status(200).json(updatedProject);
        } catch (e) {
            next(e);
        }
    }


    @Delete('/:id', {
        isAuthenticated: true,
        authorizedRole: 'all'
    }, { message: String })
    async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const projectId = parseInt(req.params.id, 10);
            if (isNaN(projectId)) {
                throw new ApiError('Invalid project ID', 400);
            }

            const deleted = await this.projectService.delete(projectId);

            if (!deleted) {
                throw new ApiError('Project not found or already deleted', 404);
            }

            res.status(200).json({ message: 'Project deleted successfully' });
        } catch (e) {
            next(e);
        }
    }


}