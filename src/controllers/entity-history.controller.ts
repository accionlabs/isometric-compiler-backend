import { Inject, Service } from "typedi";
import { Controller, Get } from "../core";
import { NextFunction, Request, Response } from 'express';
import ApiError from "../utils/apiError";
import { EntityHistory } from "../entities/entity_history.entity";
import { EntityHistoryService } from "../services/entity_history.service";
import { FilterUtils } from "../utils/filterUtils";
import { FindOptionsSelect } from "typeorm";

@Service()
@Controller('/entity-history')
export default class EntityHistoryController {

    @Inject(() => EntityHistoryService)
    private readonly entityHistoryService: EntityHistoryService;

    @Get('/:entityType/:entityId', {
        isAuthenticated: true,
        authorizedRole: 'all'
    }, [EntityHistory])
    async getEntityHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { page = 1, limit = 1000, sortName = 'createdAt', sortOrder = 'desc', ...restQuery } = req.query;
            const { entityId, entityType } = req.params;

            if (!entityId || !entityType) {
                throw new ApiError("Entity ID and type are required", 400);
            }

            const allowedFields: (keyof EntityHistory)[] = ['createdAt', 'userId', 'updatedAt', 'entityId', 'entityType'];

            const selectedFields = {
                _id: true,
                entityId: true,
                entityType: true,
                entityData: true,
                createdAt: true,
                updatedAt: true,
                metadata: true
            } as unknown as FindOptionsSelect<EntityHistory>;

            const filters = FilterUtils.buildPostgresFilters<EntityHistory>({
                ...restQuery,
                entityId: parseInt(entityId, 10),
                entityType
            }, allowedFields);

            const sort: Record<string, 1 | -1> = { [sortName as string]: sortOrder === 'asc' ? 1 : -1 };

            const history = await this.entityHistoryService.findWithFilters(
                filters,
                parseInt(page as string, 10),
                parseInt(limit as string, 10),
                sort,
                { user: true },
                selectedFields
            );

            res.status(200).json({
                total: history.total,
                data: history.data
            });
        } catch (e) {
            next(e);
        }
    }

    @Get('/detail/:entityType/:entityId', {
        isAuthenticated: true,
        authorizedRole: 'all'
    }, EntityHistory)
    async getEntityHistoryDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { entityId, entityType } = req.params;

            if (!entityId || !entityType) {
                throw new ApiError("Entity ID and type are required", 400);
            }

            const history = await this.entityHistoryService.getHistoryByEntityId(
                parseInt(entityId, 10),
            );

            res.status(200).json(history);
        } catch (e) {
            next(e);
        }
    }

    @Get('/fields/:entityType/:entityId', {
        isAuthenticated: true,
        authorizedRole: 'all'
    }, EntityHistory)
    async getEntityHistoryFields(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { entityId, entityType } = req.params;
            const histories = await this.entityHistoryService.findByEntityId(parseInt(entityId, 10));

            // Extract unique fields that have been changed
            const changedFields = new Set<string>();
            histories.forEach(history => {
                if (history.entityData) {
                    Object.keys(history.entityData).forEach(field => changedFields.add(field));
                }
            });

            res.status(200).json({
                entityType,
                entityId,
                changedFields: Array.from(changedFields)
            });
        } catch (e) {
            next(e);
        }
    }
}