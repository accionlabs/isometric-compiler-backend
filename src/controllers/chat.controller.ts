import { Inject, Service } from "typedi"
import { Controller, Delete, Get, Post, Put } from "../core"
import { NextFunction, Request, Response } from 'express';
import { ChatValidation, ChatGenerateValidation } from "../validations/chat.validation";
import { ChatService } from "../services/chat.service";
import { AWSService } from "../services/aws.service";
import config from "../configs";
import { DocumentService } from "../services/document.service";
import { MainAgent } from "../agents/mainAgent";
import { Chat } from "../entities/chat.entity";
import { Agents, MessageRoles, MessageTypes } from "../enums";
import ApiError from "../utils/apiError";
import { DiagramGeneratorAgent } from "../agents/diagram_generator_agent/diagramGeneratorAgent";
import axios from "axios";

class ChatResp {
    uuid: string;
    message: string;
    messageType: 'text' | 'json';
    metadata: {
        content: any[];
        action: any[];
        needFeedback: boolean;
        isEmailQuery?: boolean;
        emailId?: string;
        isPdfUploaded?: boolean;
        isGherkinScriptQuery?: boolean;
    };
    role: string;
}


@Service()
@Controller('/chat')
export default class CategoriesController {
    @Inject(() => ChatService)
    private readonly chatService: ChatService

    @Inject(() => AWSService)
    private readonly awsService: AWSService

    @Inject(() => DocumentService)
    private readonly documentService: DocumentService

    @Inject(() => MainAgent)
    private readonly mainAgent: MainAgent

    @Inject(() => DiagramGeneratorAgent)
    private readonly diagramGeneratorAgent: DiagramGeneratorAgent




    @Post('/', ChatValidation, {
        authorizedRole: 'all',
        isAuthenticated: true,
        fileUpload: true
    }, ChatResp
    )
    async processChat(req: Request, res: Response, next: NextFunction) {
        try {

            const { uuid, query, currentState, agent = Agents.REQUIREMENT_AGENT } = req.body
            const { file } = req
            const userId = req.user?._id
            if (!userId) {
                throw new ApiError('user not found', 401)
            }
            let messageType: MessageTypes = MessageTypes.TEXT;
            let handledDoc = null;
            let fileType;
            if (file) {
                messageType = MessageTypes.FILE;
                switch (file?.mimetype) {
                    case 'image/jpeg':
                    case 'image/png':
                        const uploadedImage = await this.awsService.uploadFile(config.ISOMETRIC_IMAGE_FOLDER, file);
                        fileType = 'image'
                        handledDoc = await this.documentService.handleImage(file, uuid, uploadedImage.s3Url, agent, userId);
                        break;
                    case 'application/pdf':
                        const uploadedDoc = await this.awsService.uploadFile(config.ISOMETRIC_DOC_FOLDER, file);
                        fileType = 'pdf'
                        handledDoc = await this.documentService.handlePdf(file, uuid, uploadedDoc.s3Url, agent, userId);
                        break;
                    default:
                        return res.status(400).json({ message: 'File format not allowed!' });
                }
            }
            const question: Partial<Chat> =
            {
                uuid: uuid as string,
                message: query as string,
                messageType: messageType,
                agent,
                metadata: {
                    ...(!!handledDoc?.savedDocument._id && { documentId: handledDoc.savedDocument._id }), ...(!!handledDoc?.savedDocument?.metadata?.fileUrl && { fileUrl: handledDoc?.savedDocument.metadata.fileUrl }),
                    ...(fileType && { fileType: fileType })
                },
                role: MessageRoles.USER
            }

            const result = await this.mainAgent.processRequest(query, uuid, currentState, userId, file)
            const chats: Partial<Chat> = {
                uuid,
                message: result.feedback,
                agent,
                messageType: !!result.result?.length ? MessageTypes.JSON : MessageTypes.TEXT, // json or text check
                metadata: { content: result.result, action: result.action, needFeedback: result.needFeedback, isGherkinScriptQuery: result.isGherkinScriptQuery },
                role: MessageRoles.SYSTEM
            }

            await this.chatService.create(question)
            await this.chatService.create(chats)
            return res.status(200).json({
                uuid,
                message: result.feedback,
                messageType: !!result.result?.length ? 'json' : 'text', // json or text check
                metadata: { content: result.result, action: result.action, needFeedback: result.needFeedback, isEmailQuery: result.isEmailQuery, emailId: result.email, isPdfUploaded: fileType === 'pdf', isGherkinScriptQuery: result.isGherkinScriptQuery },
                role: 'system'
            });
        } catch (e) {
            next(e)
        }
    }

    @Get('/byUUID/:uuid', {
        authorizedRole: 'all',
        isAuthenticated: true
    }, { data: Array<Chat>, total: Number })
    async getChats(req: Request, res: Response, next: NextFunction) {
        try {
            const { page = 1, limit = 20, sortName = 'createdAt', sortOrder = 'desc', agent = Agents.REQUIREMENT_AGENT } = req.query
            const sort: Record<string, 1 | -1> = { [sortName as string]: sortOrder === 'asc' ? 1 : -1 };
            const { data, total } = await this.chatService.findWithFilters({ uuid: req.params.uuid, agent: agent as string }, parseInt(page as string, 10), parseInt(limit as string, 10), sort);
            const reversedData = data.reverse();
            res.status(200).json({ data: reversedData, total });
        } catch (e) {
            next(e)
        }
    }

    @Get('/:id', {
        authorizedRole: 'all',
        isAuthenticated: true
    }, Chat)
    async getChatById(req: Request, res: Response, next: NextFunction) {
        try {
            const chat = await this.chatService.findOneById(Number(req.params.id));
            if (!chat) {
                throw new ApiError('chat not found', 404)
            }
            res.status(200).json(chat);
        } catch (e) {
            next(e)
        }
    }

    @Post('/generate', ChatGenerateValidation, {
        authorizedRole: 'all',
        isAuthenticated: true,
        fileUpload: true
    }, ChatResp
    )
    async generateDiagram(req: Request, res: Response, next: NextFunction) {
        try {
            const { uuid, documentId, key } = req.body
            const userId = req.user?._id
            if (!userId) {
                throw new ApiError('unauthorized', 403)
            }
            if (key === 'blueprint') {
                const diagramResp = await this.diagramGeneratorAgent.getIsometricJSONFromUUId(uuid, userId)
                if (diagramResp) {
                    return res.status(200).json({
                        uuid,
                        message: diagramResp.message,
                        messageType: 'json',
                        metadata: { content: diagramResp.isometric },
                        role: 'system'
                    });
                } else {
                    throw new ApiError('diagram not found', 404)
                }
            } else if (key === 'diagram') {
                if (!documentId) {
                    throw new ApiError('documentId not found', 400)
                }
                const document = await this.documentService.findOneById(documentId)
                if (!document?.metadata?.fileUrl) {
                    throw new ApiError("Document not found", 404)
                }
                const awsResp = await this.awsService.getPresignedUrlFromUrl(document.metadata?.fileUrl);
                if (!awsResp) {
                    throw new ApiError("AWS response not correct", 400)
                }
                const doc = await axios.get(awsResp) // need to call workflow to generate diagrma from document

                return res.status(200).json({
                    uuid,
                    message: "Message from workflow",
                    messageType: 'json',
                    metadata: {}, // coontent from workflow
                    role: 'system'
                });
            } else {
                throw new ApiError('key not found', 400)
            }

        } catch (e) {
            next(e)
        }
    }
}