import { Inject, Service } from "typedi";
import { Controller, Get, Post, Put } from "../core";
import { SemanticModel } from "../entities/semantic_models.entity";
import { NextFunction, Request, Response } from 'express';
import { SemanticModelService } from "../services/semanticModel.service";
import ApiError from "../utils/apiError";
import { SemanticModelDto, UpdateSemanticModelDto } from "../validations/semanticModel.validation";
import { SemanticModelHistoryService } from "../services/semanticModelHistory.service";

@Service()
@Controller('/semantic-model')
export default class SematicModelController {

    @Inject(() => SemanticModelService)
    private readonly semanticModelService: SemanticModelService

    @Inject(() => SemanticModelHistoryService)
    private readonly semanticModelHistoryService: SemanticModelHistoryService


    @Get('/byUUID/:uuid', {
        isAuthenticated: true,
        authorizedRole: 'all'
    },
        SemanticModel)
    async getSemanticModelByuuid(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const sematicModel = await this.semanticModelService.findByUuid(req.params.uuid);
            if (!sematicModel) {
                throw new ApiError('Shape not found', 404)
            }
            res.status(200).json({
                ...sematicModel.metadata,
                visualModel: sematicModel.visualModel,
                status: sematicModel.status
            });
        } catch (e) {
            next(e)
        }

    }


    @Get('/get-agent-status/:uuid', {
        isAuthenticated: true,
        authorizedRole: 'all'
    }, SemanticModel)
    async getAgentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const status = await this.semanticModelService.getAgentStatus(req.params.uuid);
            res.status(200).json(status);
        } catch (e) {
            next(e);
        }
    }



    @Put('/:uuid', UpdateSemanticModelDto, {
        isAuthenticated: true,
        authorizedRole: 'all'
    }, SemanticModel)
    async updateSemanticModel(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { metadata } = req.body;

            const userId = req?.user?._id
            if (!userId) {
                throw new ApiError('user not found', 401)
            }
            const updated = await this.semanticModelService.updateSemanticModel(req.params.uuid, { metadata, userId });
            res.status(200).json(updated);
        } catch (e) {
            next(e);
        }
    }

    @Post('/revert', SemanticModelDto, {
        isAuthenticated: true,
        authorizedRole: 'all'
    }, SemanticModel)
    async revertSemanticModelVersion(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { uuid, historyId } = req.body;
            const userId = req?.user?._id;

            if (!uuid || !historyId) {
                throw new ApiError("uuid and historyId are required", 400);
            }

            if (!userId) {
                throw new ApiError('User not found', 401);
            }

            const reverted = await this.semanticModelService.revertToHistory(uuid, historyId, userId);
            res.status(200).json(reverted);
        } catch (e) {
            next(e);
        }
    }



}