import { Inject, Service } from "typedi";
import { AWSService } from "../services/aws.service";
import { Controller, Delete, Get, Post, Put } from "../core";
import { NextFunction, Request, Response } from 'express';
import { EmailService } from "../services/email.service";
import { KmsDocumentIndexDto, KmsUnifiedModelDto, SendEmailDto, UpdateMetadataDto } from "../validations/document.validation";
import { DocumentService } from "../services/document.service";
import { Document } from "../entities/document.entity";
import ApiError from "../utils/apiError";
import { FilterUtils } from "../utils/filterUtils";
import { DocumentDeleteWorkflowService } from "../agents/workflows/documentWorkflow";
import { KmsWorkflowService } from "../agents/workflows/kmsWorkflow";

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


            const allowedFields: (keyof Document)[] = ["uuid", 'agent', "createdAt", "updatedAt", "status", "fileIndexedStatus", "functionalMetricsGenerated", "architectureMetricsGenerated"];

            const filters = FilterUtils.buildPostgresFilters<Document>(query, allowedFields);
            const { data, total } = await this.documentService.findWithFilters(filters, parseInt(page as string, 10), parseInt(limit as string, 10), sort);
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

    @Post('/kms/index', KmsDocumentIndexDto, {
        authorizedRole: 'all',
        isAuthenticated: false,
        fileUpload: true
    }, {})
    async kmsDocumentIndex(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const { uuid, agent } = req.body;
            const document = req.file;

            if (!uuid || !agent || !document) {
                return res.status(400).json({ message: 'Missing required fields: uuid, agent, or document file' });
            }

            const userId = req.user?._id || 1;
            const result = await this.kmsWorkflowService.KmsDocumentWorkflow(uuid, agent, document, userId);

            return res.status(200).json(result);
        } catch (error) {
            console.error('KMS Document Index Error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    @Get('/kms/generate/architecture-agent', {
        authorizedRole: 'all',
        isAuthenticated: false,
        fileUpload: true
    }, {})
    async kmsArchitectureAgentGenerate(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const { uuid } = req.query;

            if (!uuid || typeof uuid !== 'string') {
                return res.status(400).json({ message: 'Missing or invalid uuid in query parameters' });
            }

            const result = await this.kmsWorkflowService.KmsGenerateArchitectureAgent(uuid);

            return res.status(200).json(result);
        } catch (error) {
            console.error('KMS Generate architecture agent Error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    @Post('/kms/generate/unified-model', KmsUnifiedModelDto, {
        authorizedRole: 'all',
        isAuthenticated: false,
        fileUpload: false
    }, {})
    async kmsGenerateUnifiedModelWithPayload(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const { document_id, uuid, agent, userId } = req.body;

            if (!document_id || !uuid || !agent || !userId) {
                return res.status(400).json({ message: 'Missing required fields: document_id, uuid, agent, userId' });
            }

            const result = await this.kmsWorkflowService.KmsGenerateUnifiedModelWithPayload({
                document_id,
                uuid,
                agent,
                userId
            });

            return res.status(200).json(result);
        } catch (error) {
            console.error('Unified Model Generation Error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }



}