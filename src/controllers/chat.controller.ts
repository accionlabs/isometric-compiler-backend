import { Inject, Service } from "typedi"
import { Controller, Delete, Get, Post, Put } from "../core"
import { CategoryService } from "../services/categories.service"
import { CategoryUpadteValidation, CategoryValidation } from "../validations/category.validation";
import { NextFunction, Request, Response } from 'express';
import { ObjectId } from "mongodb";
import { Category } from "../entities/categories.entity";
import ApiError from "../utils/apiError";
import { ShapeService } from "../services/shape.service";
import { FilterUtils } from "../utils/filterUtils";
import { ChatValidation } from "../validations/chat.validation";
import { ChatService } from "../services/chat.service";
import { AWSService } from "../services/aws.service";
import config from "../configs";
import { Documentervice } from "../services/document.service";

class ChatResp {
    resp: string
}


@Service()
@Controller('/chat')
export default class CategoriesController {
    @Inject(() => ChatService)
    private readonly chatService: ChatService

    @Inject(() => AWSService)
    private readonly awsService: AWSService

    @Inject(() => Documentervice)
    private readonly documentService: Documentervice


    @Post('/', ChatValidation, {
        authorizedRole: 'all',
        isAuthenticated: false,
        fileUpload: true
    }, ChatResp
    )
    async processChat(req: Request, res: Response, next: NextFunction) {
        try {

            const { uuid, query, currentState } = req.body
            const { file } = req
            let messageType = 'text';
            let handledDoc = null;
            let fileType;
            if (file) {
                messageType = 'file';
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
                    default:
                        return res.status(400).json({ error: 'File format not allowed!' });
                }
            }
            return res.json(handledDoc)
            // const payload = await isometricService.classifyAndRouteQuery(uuid, query, currentState, handledDoc?.savedDocument.id);
            // const agrentResponse = await isometricService.processWithAgents(payload);
            // const result = await processRequest(query, uuid, currentState, file)
            // const chats = [
            //     {
            //         uuid,
            //         message: query,
            //         messageType: messageType,
            //         metadata: {
            //             ...(!!handledDoc?.savedDocument.id && { documentId: handledDoc.savedDocument.id }), ...(!!handledDoc?.savedDocument.metadata.fileUrl && { fileUrl: handledDoc?.savedDocument.metadata.fileUrl }),
            //             ...(fileType && { fileType: fileType })
            //         },
            //         role: 'user'
            //     },
            //     {
            //         uuid,
            //         message: result.feedback,
            //         messageType: !!result.result?.length ? 'json' : 'text', // json or text check
            //         metadata: { content: result.result, action: result.action, needFeedback: result.needFeedback, isGherkinScriptQuery: result.isGherkinScriptQuery },
            //         role: 'system'
            //     }
            // ];

            // await isometricQuery.saveChats(chats);
            // return res.status(200).json({
            //     uuid,
            //     message: result.feedback,
            //     messageType: !!result.result?.length ? 'json' : 'text', // json or text check
            //     metadata: { content: result.result, action: result.action, needFeedback: result.needFeedback, isEmailQuery: result.isEmailQuery, emailId: result.email, isPdfUploaded: fileType === 'pdf', isGherkinScriptQuery: result.isGherkinScriptQuery },
            //     role: 'system'
            // });
        } catch (e) {
            next(e)
        }
    }



}