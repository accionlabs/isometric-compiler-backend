import { Inject, Service } from "typedi";
import { AWSService } from "../services/aws.service";
import { Controller, Delete, Get, Post, Put } from "../core";
import { NextFunction, Request, Response } from 'express';
import { EmailService } from "../services/email.service";
import { KmsDocumentIndexDto, KmsMetricsDto, SendEmailDto, UpdateMetadataDto } from "../validations/document.validation";
import { DocumentService } from "../services/document.service";
import { Document } from "../entities/document.entity";
import ApiError from "../utils/apiError";
import { FilterUtils } from "../utils/filterUtils";
import { DocumentDeleteWorkflowService } from "../agents/workflows/documentWorkflow";
import { KmsWorkflowService } from "../agents/workflows/kmsWorkflow";
import { GitWorkflowService } from "../agents/workflows/gitWorkflow";
import { FindOptionsSelect } from "typeorm";

@Service()
@Controller('/documents')
export class DocumentController {

    @Inject(() => AWSService)
    private readonly awsService: AWSService

    @Inject(() => DocumentService)
    private readonly documentService: DocumentService

    @Inject(() => EmailService)
    private readonly emailService: EmailService

    @Inject(() => DocumentDeleteWorkflowService)
    private readonly documentDeleteWorkflowService: DocumentDeleteWorkflowService

    @Inject(() => KmsWorkflowService)
    private readonly kmsWorkflowService: KmsWorkflowService;

    @Inject(() => GitWorkflowService)
    private readonly gitWorkflowService: GitWorkflowService

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
            const { page = 1, limit = 1000, sortName = 'createdAt', sortOrder = 'asc', selectFields, ...query } = req.query
            const sort: Record<string, 1 | -1> = { [sortName as string]: sortOrder === 'asc' ? 1 : -1 };


            const allowedFields: (keyof Document)[] = ["uuid", 'agent', "createdAt", "updatedAt", "status", "fileIndexedStatus", "functionalMetricsGenerated", "architectureMetricsGenerated", "_id"];
            let select: any;
            if (selectFields && typeof selectFields === 'string') {
                const fields = selectFields.split(',').map(field => field.trim()) as (keyof Document)[];
                select = fields.reduce((acc, field) => {
                    if (allowedFields.includes(field)) acc[field] = true;
                    return acc;
                }, {} as FindOptionsSelect<Document>);
            }

            const filters = FilterUtils.buildPostgresFilters<Document>(query, allowedFields);
            const { data, total } = await this.documentService.findWithFilters(filters, parseInt(page as string, 10), parseInt(limit as string, 10), sort, undefined, select);
            return res.json({ data, total });
        } catch (e) {
            next(e);
        }
    }

    @Get('/:id', {
        isAuthenticated: true,
        authorizedRole: 'all'
    }, Document)
    async getDocument(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const { id } = req.params;
            const document = await this.documentService.findOneById(Number(id));
            return res.json({ data: document });
        } catch (e) {
            next(e);
        }
    }
    @Put('/document-metadata/:id', UpdateMetadataDto, {
        isAuthenticated: true,
        authorizedRole: 'all'
    }, Document)
    async updateDocumentMetadata(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const id = parseInt(req.params.id, 10);

            const metadata = req.body;

            const updatedDoc = await this.documentService.updateMetadata(id, metadata);

            return res.status(200).json({
                message: 'Metadata updated successfully',
                document: updatedDoc,
            });
        } catch (error) {
            return next(error);
        }

    }

    @Delete('/:id', {
        isAuthenticated: true,
        authorizedRole: 'all'
    },
        Document)
    async deleteDocumentById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        const id = parseInt(req.params.id, 10);
        const deleteDocumentResp = await this.documentDeleteWorkflowService.documentDeleteWorkflow(id)
        return res.status(200).json(deleteDocumentResp)
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

    @Post('/upload', KmsDocumentIndexDto, {
        authorizedRole: 'all',
        isAuthenticated: true,
        fileUpload: true
    }, {})
    async kmsDocumentIndex(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const { uuid, gitUrl, gitToken } = req.body;
            const document = req.file;

            const userId = req.user?._id || 1;
            let result;
            if (!!gitUrl) {
                result = await this.gitWorkflowService.gitWorkflow({
                    uuid: uuid,
                    userId: userId,
                    git_url: gitUrl,
                    git_token: gitToken
                })
                return res.status(200).json(result);

            } else if (!!document) {
                result = await this.kmsWorkflowService.KmsDocumentWorkflow(uuid, document, userId);
                return res.status(200).json(result);
            }


        } catch (error) {
            console.error('KMS Document/git url Index Error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    @Post('/metrics', KmsMetricsDto, {
        authorizedRole: 'all',
        isAuthenticated: true,
        fileUpload: true
    }, {})
    async KmsMetricsUnifiedModel(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const { uuid, document_id, metrics } = req.body;
            const userId = req.user?._id
            if (!userId) {
                throw new ApiError('user not found', 401)
            }

            const result = await this.kmsWorkflowService.KmsMetricsGenerateWithPayload({ document_id, uuid, userId, metrics });
            return res.status(200).json(result);

        } catch (error) {
            console.error('KMS metrics Error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    @Get('/search/:text', {
        isAuthenticated: true,
        authorizedRole: 'all'
    }, {
        data: Array<Document>,
        total: Number
    })
    async searchDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { text } = req.params;
            const { page = 1, limit = 1000 } = req.query;
            if (!text || typeof text !== 'string') {
                throw new ApiError("Query parameter 'text' is required.", 400);
            }

            const allowedFields: (keyof Document)[] = ['uuid', 'agent', 'fileIndexedStatus', 'status', 'metadata'];

            const filters = FilterUtils.buildPostgresFilters<Document>(req.query, allowedFields);
            if (!filters.uuid) {
                throw new ApiError("Filter for uuid is required (filters[uuid][$eq]=<uuid>)", 400);
            }
            const { data, total } = await this.documentService.search(text as string, {
                filters,
                limit: parseInt(limit as string, 10),
                page: parseInt(page as string, 10)
            });
            res.status(200).json({ data, total });
        } catch (e) {
            next(e);
        }
    }

}