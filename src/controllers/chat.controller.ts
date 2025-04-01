import { Inject, Service } from "typedi"
import { Controller, Delete, Get, Post, Put } from "../core"
import { NextFunction, Request, Response } from 'express';
import { ChatValidation } from "../validations/chat.validation";
import { ChatService } from "../services/chat.service";
import { AWSService } from "../services/aws.service";
import config from "../configs";
import { DocumentService } from "../services/document.service";
import { MainAgent } from "../agents/mainAgent";
import { Chat } from "../entities/chat.entity";
import { MessageRoles, MessageTypes } from "../enums";

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




    @Post('/', ChatValidation, {
        authorizedRole: 'all',
        isAuthenticated: true,
        fileUpload: true
    }, ChatResp
    )
    async processChat(req: Request, res: Response, next: NextFunction) {
        try {

            const { uuid, query, currentState } = req.body
            const { file } = req
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
                        handledDoc = await this.documentService.handleImage(file, uuid, uploadedImage.s3Url);
                        break;
                    case 'application/pdf':
                        const uploadedDoc = await this.awsService.uploadFile(config.ISOMETRIC_DOC_FOLDER, file);
                        fileType = 'pdf'
                        handledDoc = await this.documentService.handlePdf(file, uuid, uploadedDoc.s3Url);
                        break;
                    case "text/plain":
                    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                        const uploadedTxt = await this.awsService.uploadFile(config.ISOMETRIC_DOC_FOLDER, file);
                        handledDoc = await this.documentService.handleTextOrDoc(file, uuid, uploadedTxt.s3Url);
                        break;
                    default:
                        return res.status(400).json({ message: 'File format not allowed!' });
                }
            }
            const result = await this.mainAgent.processRequest(query, uuid, currentState, file)
            const chats: Partial<Chat>[] = [
                {
                    uuid: uuid as string,
                    message: query as string,
                    messageType: messageType,
                    metadata: {
                        ...(!!handledDoc?.savedDocument._id && { documentId: handledDoc.savedDocument._id }), ...(!!handledDoc?.savedDocument?.metadata?.fileUrl && { fileUrl: handledDoc?.savedDocument.metadata.fileUrl }),
                        ...(fileType && { fileType: fileType })
                    },
                    role: MessageRoles.USER
                },
                {
                    uuid,
                    message: result.feedback,
                    messageType: !!result.result?.length ? MessageTypes.JSON : MessageTypes.TEXT, // json or text check
                    metadata: { content: result.result, action: result.action, needFeedback: result.needFeedback, isGherkinScriptQuery: result.isGherkinScriptQuery },
                    role: MessageRoles.SYSTEM
                }
            ];

            await this.chatService.createMany(chats)
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
            const { page = 1, limit = 10, sortName = 'createdAt', sortOrder = 'asc' } = req.query
            const sort: Record<string, 1 | -1> = { [sortName as string]: sortOrder === 'asc' ? 1 : -1 };
            const { data, total } = await this.chatService.findWithFilters({ uuid: req.params.uuid }, parseInt(page as string, 10), parseInt(limit as string, 10), sort);

            res.status(200).json({ data, total });
        } catch (e) {
            next(e)
        }
    }


}