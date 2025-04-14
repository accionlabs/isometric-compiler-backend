import { Inject, Service } from "typedi";
import { Controller, Get, Post, Put } from "../core";
import { SemanticModel } from "../entities/semantic_models.entity";
import { NextFunction, Request, Response } from 'express';
import { SemanticModelService } from "../services/semanticModel.service";
import ApiError from "../utils/apiError";
import { SaveSemanticModelDto, UpdateSemanticModelDto } from "../validations/semanticModel.validation";

@Service()
@Controller('/semantic-model')
export default class SematicModelController {

    @Inject(() => SemanticModelService)
    private readonly semanticModelService: SemanticModelService


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
            const { metadata, visualModel } = req.body;

            const userId = req?.user?._id
            if (!userId) {
                throw new ApiError('user not found', 401)
            }
            const updated = await this.semanticModelService.updateSemanticModel(req.params.uuid, { metadata, visualModel, userId });
            res.status(200).json(updated);
        } catch (e) {
            next(e);
        }
    }

}