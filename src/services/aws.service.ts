import { Service } from "typedi";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import AWSConfig from '../configs/aws'
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const SIGNED_URL_EXPIRES_IN = 30

@Service()
export class AWSService {
    constructor() {
        this.s3Client = new S3Client({
            region: AWSConfig.AWS_REGION,
            credentials: {
                accessKeyId: AWSConfig.AWS_ACCESS_KEYID,
                secretAccessKey: AWSConfig.AWS_SECRET_KEY,
            },
        });
    }
    private s3Client: S3Client;

    public async uploadFile(filePath: string, file: Express.Multer.File): Promise<{ s3Url: string }> {
        const { originalname, buffer } = file;
        const name = originalname.split(".").slice(0, -1).join(".");
        const extn = originalname.split(".").pop();
        const fileKey = `${filePath}${name}-${Date.now()}.${extn}`;

        const params = {
            Bucket: AWSConfig.AWS_S3_BUCKET,
            Key: fileKey,
            Body: buffer,
        };

        const s3Url = `https://${AWSConfig.AWS_S3_BUCKET}.s3.${AWSConfig.AWS_REGION}.amazonaws.com/${fileKey}`;

        await this.s3Client.send(new PutObjectCommand(params));
        return { s3Url };
    }

    async getPresignedUrl(path: string) {
        try {
            const command = new GetObjectCommand({
                Bucket: AWSConfig.AWS_S3_BUCKET,
                Key: path
            });
            const url = await getSignedUrl(this.s3Client, command, {
                expiresIn: SIGNED_URL_EXPIRES_IN,
            });
            return url;
        } catch (error) {
            // global.logger.error(`Unable to fetch presigned url for ${path} ,error:`, error.message);
            return null;
        }
    }

    private getPathFromUrl(url: string) {
        return url.replace(`https://${AWSConfig.AWS_S3_BUCKET}.s3.${AWSConfig.AWS_REGION}.amazonaws.com/`, "");
    }

    async getPresignedUrlFromUrl(url: string) {
        const path = this.getPathFromUrl(url);
        return await this.getPresignedUrl(path);
    }
}