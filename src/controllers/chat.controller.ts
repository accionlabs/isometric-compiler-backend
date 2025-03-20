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


    @Post('/', ChatValidation, {
        authorizedRole: 'all',
        isAuthenticated: false,
        fileUpload: true
    }, ChatResp
    )
    async processChat(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            console.log("req.body", req.body)
            if (req.file) {
                const resp = await this.awsService.uploadFile(config.ISOMETRIC_IMAGE_FOLDER, req.file)
                res.json(resp)
            }
            else res.json({ mesaage: 'file not uploaded' })
        } catch (e) {
            next(e)
        }
    }



}