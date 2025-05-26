import { Inject, Service } from "typedi";
import { Controller, Get } from "../core";
import { NextFunction, Request, Response } from 'express';
import ApiError from "../utils/apiError";
import { SemanticModelHistory } from "../entities/semantic_model_history.entity";
import { SemanticModelHistoryService } from "../services/semanticModelHistory.service";
import { FilterUtils } from "../utils/filterUtils";
import { FindOptionsSelect } from "typeorm";

@Service()
@Controller('/semantic-model-history')
export default class SematicModelHistoryController {

    @Inject(() => SemanticModelHistoryService)
    private readonly semanticModelHistoryService: SemanticModelHistoryService

    @Get('/history/:uuid', {
        isAuthenticated: true,
        authorizedRole: 'all'
    }, SemanticModelHistory)
    async getSemanticModelHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { page = 1, limit = 1000, sortName = 'createdAt', sortOrder = 'desc', ...restQuery } = req.query;

            const { uuid } = req.params;

            if (!uuid) {
                throw new ApiError("UUID is required", 400);
            }
            const allowedFields: (keyof SemanticModelHistory)[] = ['createdAt', 'userId', "updatedAt", "status", "uuid"];

            const selectedFields = { _id: true, uuid: true, createdAt: true, updatedAt: true, status: true, agent: true, qum_specs: true } as unknown as FindOptionsSelect<SemanticModelHistory>;
            const filters = FilterUtils.buildPostgresFilters<SemanticModelHistory>(restQuery, allowedFields);
            const sort: Record<string, 1 | -1> = { [sortName as string]: sortOrder === 'asc' ? 1 : -1 };

            const history = await this.semanticModelHistoryService.findWithFilters(filters, parseInt(page as string, 10), parseInt(limit as string, 10), sort, { user: true }, selectedFields);

            res.status(200).json({
                count: history.total,
                history: history.data
            });
        } catch (e) {
            next(e);
        }
    }


}