import { Inject, Service } from "typedi";
import { AWSService } from "../services/aws.service";
import { Controller, Get, Post } from "../core";
import { NextFunction, Request, Response } from 'express';
import { EmailService } from "../services/email.service";
import { SendEmailDto } from "../validations/document.validation";

@Service()
@Controller('/documents')
export class DocumentController {

    @Inject(() => AWSService)
    private readonly awsService: AWSService

    @Inject(() => EmailService)
    private readonly emailService: EmailService


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


}