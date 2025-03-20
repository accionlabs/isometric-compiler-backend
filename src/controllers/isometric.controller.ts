import { Inject, Service } from "typedi";
import { Controller, Post } from "../core";
import { IsometricService } from "../services/isometric.service";
import { Chat } from "../entities/chat.entity";
import { NextFunction, Request, Response } from 'express';
import { uploadFile } from "../services/s3BucketService";
import config from "../configs";
// import  from '../configs'

@Service()
@Controller('/isometric')
export default class IsometricController {

    @Inject(() => IsometricService)
        private readonly isometricService: IsometricService
    
        
        @Post('/', {}, {
                authorizedRole: 'all',
                isAuthenticated: true
            },
                Chat)
    async sendChat(req: Request, res: Response, next: NextFunction): Promise<void> {
        // try {
        //     const { query, uuid, currentState } = req.body;
        //     if (!uuid) {
        //         res.status(400).json({ error: 'uuid is required' });
        //     }
        //     const { file } = req;
        //     if (!query && !file) {
        //         res.status(400).json({ error: 'Query or file is required' });
        //     }
        //     let messageType = 'text';
        //     let handledDoc = null;
        //     let fileType;
        //     if (file) {
        //         messageType = 'file';
        //         switch (file?.mimetype) {
        //             case 'image/jpeg':
        //             case 'image/png':
        //                 const uploadedImage = await uploadFile(config.ISOMETRIC_IMAGE_FOLDER, file);
        //                 fileType = 'image'
        //                 // handledDoc = await isometric.handleImage(file, uuid, uploadedImage.s3Url);
        //                 break;
        //             case 'application/pdf':
        //                 const uploadedDoc = await uploadFile(config.ISOMETRIC_DOC_FOLDER, file);
        //                 fileType = 'pdf'
        //                 // handledDoc = await isometricService.handlePdf(file, uuid, uploadedDoc.s3Url);
        //                 break;
        //             default:
        //                 // return res.status(400).json({ error: 'File format not allowed!' });
        //         }
        //     }
    
            
        //     // const result = await processRequest(query, uuid, currentState, file)
        //     // const chats = [
        //     //     {
        //     //         uuid,
        //     //         message: query,
        //     //         messageType: messageType,
        //     //         metadata: {
        //     //             ...(!!handledDoc?.savedDocument.id && { documentId: handledDoc.savedDocument.id }), ...(!!handledDoc?.savedDocument.metadata.fileUrl && { fileUrl: handledDoc?.savedDocument.metadata.fileUrl }),
        //     //             ...(fileType && { fileType: fileType })
        //     //         },
        //     //         role: 'user'
        //     //     },
        //     //     {
        //     //         uuid,
        //     //         message: result.feedback,
        //     //         messageType: !!result.result?.length ? 'json' : 'text', // json or text check
        //     //         metadata: { content: result.result, action: result.action, needFeedback: result.needFeedback, isGherkinScriptQuery: result.isGherkinScriptQuery },
        //     //         role: 'system'
        //     //     }
        //     // ];
    
        //     // await isometricQuery.saveChats(chats);
        //     // return res.status(200).json({
        //     //     uuid,
        //     //     message: result.feedback,
        //     //     messageType: !!result.result?.length ? 'json' : 'text', // json or text check
        //     //     metadata: { content: result.result, action: result.action, needFeedback: result.needFeedback, isEmailQuery: result.isEmailQuery, emailId: result.email, isPdfUploaded: fileType === 'pdf', isGherkinScriptQuery: result.isGherkinScriptQuery },
        //     //     role: 'system'
        //     // });
        // } catch (e) {
        //     next(e);
        // }
    }
}