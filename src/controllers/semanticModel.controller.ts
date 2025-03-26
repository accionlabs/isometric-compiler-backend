import { Inject, Service } from "typedi";
import { Controller, Get, Post } from "../core";
import { SemanticModel } from "../entities/semantic_models.entity";
import { NextFunction, Request, Response } from 'express';
import { SemanticModelService } from "../services/semanticModel.service";
import ApiError from "../utils/apiError";
import { SaveSemanticModelDto } from "../validations/semanticModel.validation";

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
            res.status(200).json(sematicModel.metadata);
        } catch (e) {
            next(e)
        }

    }

    @Post('/save', SaveSemanticModelDto, {
        isAuthenticated: true,
        authorizedRole: 'all'
    }, SemanticModel)
    async saveSemanticModel(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const semanticModel = await this.semanticModelService.saveSemanticModel(req.body);
            res.status(200).json(semanticModel);
        } catch (e) {
            next(e);
        }
    }
}