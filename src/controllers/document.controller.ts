import { Inject, Service } from "typedi";
import { AWSService } from "../services/aws.service";
import { Controller, Get, Post } from "../core";
import { NextFunction, Request, Response } from 'express';
import { EmailService } from "../services/email.service";
import { SendEmailDto } from "../validations/document.validation";
import { DocumentService } from "../services/document.service";
import { Document } from "../entities/document.entity";
import ApiError from "../utils/apiError";
import { FilterUtils } from "../utils/filterUtils";

@Service()
@Controller('/documents')
export class DocumentController {

    @Inject(() => AWSService)
    private readonly awsService: AWSService

    @Inject(() => DocumentService)
    private readonly documentService: DocumentService

    @Inject(() => EmailService)
    private readonly emailService: EmailService

    @Get('/get-document/:uuid', {
        isAuthenticated: true,
        authorizedRole: 'all'
    }, Array<Document>)
    async getDocumentByUUID(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const { uuid } = req.params;
            const document = await this.documentService.getDocumentsByUUID(uuid);

            if (!document) {
                return res.status(404).json({ message: 'document not found' });
            }

            return res.json(document);
        } catch (e) {
            next(e);
        }
    }

    @Get('/', {
        isAuthenticated: true,
        authorizedRole: 'all'
    }, Array<Document>)
    async getDocuments(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const { page = 1, limit = 1000, sortName = 'createdAt', sortOrder = 'asc', ...query } = req.query
            const sort: Record<string, 1 | -1> = { [sortName as string]: sortOrder === 'asc' ? 1 : -1 };


            const allowedFields: (keyof Document)[] = ["uuid", 'agent', "createdAt", "updatedAt", "status"];

            const filters = FilterUtils.buildPostgresFilters<Document>(query, allowedFields);
            const { data, total } = await this.documentService.findWithFilters(filters, parseInt(page as string, 10), parseInt(limit as string, 10), sort);
            return res.json({ data, total });
        } catch (e) {
            next(e);
        }
    }


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

    @Get('/get-signed-url-by-id/:id', {
        isAuthenticated: true,
        authorizedRole: 'all'
    }, String)
    async getSignedUrlById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const document = await this.documentService.findOneById(Number(id))
            if (!document?.metadata?.fileUrl) {
                throw new ApiError("file url not exist", 404)
            }
            const awsResp = await this.awsService.getPresignedUrlFromUrl(document.metadata?.fileUrl);
            return res.send(awsResp)
        } catch (e) {
            next(e)
        }
    }

    @Post('/sendEmail', SendEmailDto, {
        authorizedRole: 'all',
        isAuthenticated: false,
        fileUpload: true
    },
        { responseSchema: { message: "string" } })
    async sendIsometricEmail(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const recipientEmails: string = req.body.email;
            const subject: string = req.body.subject || "Sharing diagram from Isometric UI";
            const htmlBody: string = "Hi";
            let imageBuffer: Buffer | undefined = undefined;
            let imageFilename: string | undefined = undefined;

            if (req.file) {
                imageBuffer = req.file.buffer;
                imageFilename = req.file.originalname;
            }

            await this.emailService.sendEmailWithAttachment(
                recipientEmails,
                subject,
                htmlBody,
                imageBuffer,
                imageFilename
            );

            return res.json({ message: "Email Sent" });
        } catch (e) {
            next(e);
        }
    }


}