import axios from "axios";
import { NextFunction, Request, Response } from 'express';
import { Inject, Service } from "typedi";
import { ArchitectualAgentWorkflowService } from "../agents/workflows/architecturalAgentWorkflow";
import { Controller, Get, Post } from "../core";
import { Chat } from "../entities/chat.entity";
import { Agents, MessageRoles, MessageTypes } from "../enums";
import { AWSService } from "../services/aws.service";
import { ChatService } from "../services/chat.service";
import { DocumentService } from "../services/document.service";
import ApiError from "../utils/apiError";
import { ChatGenerateValidation, ChatValidation } from "../validations/chat.validation";
import { MainWorkflow } from "../agents/workflows";

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

    @Inject(() => MainWorkflow)
    private readonly mainWorkFlow: MainWorkflow


    @Inject(() => ArchitectualAgentWorkflowService)
    private readonly architectualAgentWorkflowService: ArchitectualAgentWorkflowService



    @Post('/', ChatValidation, {
        authorizedRole: 'all',
        isAuthenticated: true,
        fileUpload: true
    }, ChatResp
    )
    async processChat(req: Request, res: Response, next: NextFunction) {
        try {
            const { file } = req
            const userId = req.user?._id
            if (!userId) {
                throw new ApiError('user not found', 401)
            }
            const [userChat, systemChat] = await this.mainWorkFlow.processChat({ ...req.body, file, userId })
            if (systemChat.message === 'git url is not correct') {
                return res.status(400).json(systemChat);
            }
            await this.chatService.create(userChat)
            await this.chatService.create(systemChat)
            return res.status(200).json(systemChat);
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
            const { uuid, documentId, key, fileUrl } = req.body
            const userId = req.user?._id
            if (!userId) {
                throw new ApiError('unauthorized', 403)
            }
            if (key === 'blueprint') {
                const diagramResp = await this.architectualAgentWorkflowService.generateBlueprint(uuid)
                return res.status(200).json({
                    uuid,
                    message: "Blueprint generated successfully",
                    messageType: 'json',
                    metadata: { result: diagramResp }, // coontent from workflow
                    role: 'system'
                });
            } else if (key === 'diagram') {
                if (!documentId && !fileUrl) {
                    throw new ApiError('documentId not found', 400)
                }
                let fileUrlN = fileUrl || ''
                let document
                if (documentId) document = await this.documentService.findOneById(documentId)
                fileUrlN = document?.metadata?.fileUrl || fileUrlN
                if (!fileUrlN) {
                    throw new ApiError("Document not found", 404)
                }
                const awsResp = await this.awsService.getPresignedUrlFromUrl(fileUrlN);
                if (!awsResp) {
                    throw new ApiError("AWS response not correct", 400)
                }
                const doc = await axios.get(awsResp, { responseType: 'arraybuffer' }) // need to call workflow to generate diagrma from document
                if (!doc.data) {
                    throw new ApiError("Document not found", 404)
                }

                const resp = await this.architectualAgentWorkflowService.generateIsometricFromDocment(uuid, doc.data, document?.metadata?.mimetype || 'image/png', document?.metadata?.fileName || 'image.png')
                return res.status(200).json({
                    uuid,
                    message: "Diagram generated successfully",
                    messageType: 'json',
                    metadata: { result: resp }, // coontent from workflow
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