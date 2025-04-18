import { NextFunction, Request, Response } from 'express';
import { Inject, Service } from "typedi";
import { MainAgent } from "../agents/mainAgent";
import { FunctionalAgentWorkflowService } from "../agents/workflows/functionalAgentWorkflow";
import { Controller, Get, Post } from "../core";
import { Chat } from "../entities/chat.entity";
import { Agents, MessageRoles, MessageTypes } from "../enums";
import { AWSService } from "../services/aws.service";
import { ChatService } from "../services/chat.service";
import { DocumentService } from "../services/document.service";
import ApiError from "../utils/apiError";
import { ChatValidation } from "../validations/chat.validation";

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
                    console.log("file uploaded")
                    fileIdexingResp = await this.functionalAgentWorkflowService.fileIndexingWorkflow(uuid as string, file)
                    console.log("fileIdexingResp", fileIdexingResp)
                }
                result = await this.functionalAgentWorkflowService.functionAgentWorkflow(uuid as string, query as string)
            } else {
                result = await this.mainAgent.processRequest(query, uuid, currentState, file)

            }
            // let handledDoc = null;
            // let fileType;
            // if (file) {
            //     messageType = MessageTypes.FILE;
            //     switch (file?.mimetype) {
            //         case 'image/jpeg':
            //         case 'image/png':
            //             const uploadedImage = await this.awsService.uploadFile(config.ISOMETRIC_IMAGE_FOLDER, file);
            //             fileType = 'image'
            //             handledDoc = await this.documentService.handleImage(file, uuid, uploadedImage.s3Url, agent, userId);
            //             break;
            //         case 'application/pdf':
            //             const uploadedDoc = await this.awsService.uploadFile(config.ISOMETRIC_DOC_FOLDER, file);
            //             fileType = 'pdf'
            //             handledDoc = await this.documentService.handlePdf(file, uuid, uploadedDoc.s3Url, agent, userId);
            //             break;
            //         default:
            //             return res.status(400).json({ message: 'File format not allowed!' });
            //     }
            // }


            const question: Partial<Chat> =
            {
                uuid: uuid as string,
                message: query as string,
                messageType: messageType,
                agent,
                metadata: {
                    ...fileIdexingResp
                },
                role: MessageRoles.USER
            }

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
                messageType: !!result.result?.length ? MessageTypes.JSON : MessageTypes.TEXT, // json or text check
                metadata: {
                    content: result.result,
                    action: result.action,
                    needFeedback: result.needFeedback,
                    isEmailQuery: result.isEmailQuery,
                    emailId: result.email,
                    isPdfUploaded: fileIdexingResp?.metadata.fileType === 'pdf' ? true : false,
                    isGherkinScriptQuery: result.isGherkinScriptQuery
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


}