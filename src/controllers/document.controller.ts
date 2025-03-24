import { Inject, Service } from "typedi";
import { AWSService } from "../services/aws.service";
import { Controller, Get } from "../core";
import { NextFunction, Request, Response } from 'express';

@Service()
@Controller('/documents')
export class DocumentController {

    @Inject(() => AWSService)
    private readonly awsService: AWSService

    @Get('/get-signed-url/:path', {
        isAuthenticated: true,
        authorizedRole: 'all'
    }, String)
    async getSignedUrl(req: Request, res: Response, next: NextFunction) {
        try {
            const { path } = req.params
            const awsResp = await this.awsService.getPresignedUrl(path);
            return res.json(awsResp)
        } catch (e) {
            next(e)
        }
    }

}