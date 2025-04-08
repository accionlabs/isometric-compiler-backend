import nodemailer from "nodemailer";
import config from "../configs";
import AWSConfig from '../configs/aws'
import { Service } from "typedi";
const aws = require("@aws-sdk/client-ses");

@Service()
export class EmailService {

    async sendEmailWithAttachment(
        to: string,
        subject: string,
        body: string,
        attachmentBuffer?: Buffer,
        fileName?: string
    ): Promise<void> {
        try {
            const ses = new aws.SES({
                region: AWSConfig.AWS_REGION,
                credentials: {
                    accessKeyId: AWSConfig.AWS_ACCESS_KEYID,
                    secretAccessKey: AWSConfig.AWS_SECRET_KEY,
                },
            });

            const transporter = nodemailer.createTransport({
                SES: { ses, aws },
            });

            const mailOptions: nodemailer.SendMailOptions = {
                from: config.SOURCE_EMAIL_ID,
                to,
                subject,
                html: body,
                attachments: attachmentBuffer && fileName
                    ? [{ filename: fileName, content: attachmentBuffer }]
                    : [],
            };

            await transporter.sendMail(mailOptions);
            console.log("Email sent successfully");
        } catch (error) {
            console.error("Error sending email:", error);
            throw error;
        }
    }
}


