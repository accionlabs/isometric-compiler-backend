import axios from "axios";
import { NextFunction, Request, Response } from 'express';
import { Inject, Service } from "typedi";
import { DiagramGeneratorAgent } from "../agents/diagram_generator_agent/diagramGeneratorAgent";
import { MainAgent } from "../agents/mainAgent";
import { ArchitectualAgentWorkflowService } from "../agents/workflows/architecturalAgentWorkflow";
import { FunctionalAgentWorkflowService } from "../agents/workflows/functionalAgentWorkflow";
import { Controller, Get, Post } from "../core";
import { Chat } from "../entities/chat.entity";
import { Agents, MessageRoles, MessageTypes } from "../enums";
import { AWSService } from "../services/aws.service";
import { ChatService } from "../services/chat.service";
import { DocumentService } from "../services/document.service";
import ApiError from "../utils/apiError";
import { ChatGenerateValidation, ChatValidation } from "../validations/chat.validation";

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

    @Inject(() => FunctionalAgentWorkflowService)
    private readonly functionalAgentWorkflowService: FunctionalAgentWorkflowService

    @Inject(() => DiagramGeneratorAgent)
    private readonly diagramGeneratorAgent: DiagramGeneratorAgent

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

            const { uuid, query, currentState, agent = Agents.REQUIREMENT_AGENT } = req.body
            const { file } = req
            const userId = req.user?._id
            if (!userId) {
                throw new ApiError('user not found', 401)
            }
            let messageType: MessageTypes = !!file ? MessageTypes.FILE : MessageTypes.TEXT;
            let fileIdexingResp
            let result
            if (agent === Agents.REQUIREMENT_AGENT || agent === Agents.DESIGN_AGENT) {
                if (!!file) {
                    fileIdexingResp = await this.functionalAgentWorkflowService.fileIndexingWorkflow(uuid as string, agent as string, file)
                } else {
                    result = await this.functionalAgentWorkflowService.functionAgentWorkflow(uuid as string, query as string)
                }
            }
            else if (agent === Agents.ARCHITECTURE_AGENT && file) {
                fileIdexingResp = await this.architectualAgentWorkflowService.fileIndexingWorkflow(uuid as string, file)
            }
            else {
                result = await this.mainAgent.processRequest(query, uuid, currentState, userId, file)
            }


            const question: Partial<Chat> =
            {
                uuid: uuid as string,
                message: query as string,
                messageType: messageType,
                agent,
                metadata: {
                    ...fileIdexingResp?.metadata
                },
                role: MessageRoles.USER
            }

            const chats: Partial<Chat> = {
                uuid,
                message: result?.feedback || "Document is indexed successfully",
                agent,
                messageType: !!result?.result?.length ? MessageTypes.JSON : MessageTypes.TEXT, // json or text check
                metadata: { content: result?.result, action: result?.action, needFeedback: result?.needFeedback, isGherkinScriptQuery: result?.isGherkinScriptQuery },
                role: MessageRoles.SYSTEM
            }

            await this.chatService.create(question)
            await this.chatService.create(chats)
            return res.status(200).json({
                uuid,
                message: result?.feedback || "Document is indexed successfully",
                messageType: !!result?.result?.length ? MessageTypes.JSON : MessageTypes.TEXT, // json or text check
                metadata: {
                    content: result?.result,
                    action: result?.action,
                    needFeedback: result?.needFeedback,
                    isEmailQuery: result?.isEmailQuery,
                    emailId: result?.email,
                    isPdfUploaded: fileIdexingResp?.metadata.fileType === 'pdf' ? true : false,
                    isGherkinScriptQuery: result?.isGherkinScriptQuery
                },
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

                const resp = await this.architectualAgentWorkflowService.generateIsometricFromDocment(uuid, doc.data, document?.metadata?.mimetype || 'image/png', document?.metadata?.filename || 'image.png')
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