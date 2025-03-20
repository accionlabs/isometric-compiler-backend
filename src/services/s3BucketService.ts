import { S3Client, PutObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

const awsRegion: string = process.env.AWS_REGION || "";
const bucketName: string = process.env.AWS_S3_BUCKET || "";

const createS3Client = (): S3Client => {
    return new S3Client({
        region: awsRegion,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEYID || "",
            secretAccessKey: process.env.AWS_SECRET_KEY || "",
        },
    });
};

interface FileUpload {
    originalname: string;
    buffer: Buffer;
}

export async function uploadFile(fileName: string, file: FileUpload): Promise<{ s3Url: string }> {
    const s3Client = createS3Client();
    const { originalname, buffer } = file;
    const name = originalname.split(".").slice(0, -1).join(".");
    const extn = originalname.split(".").pop();
    const fileKey = `${fileName}${name}-${Date.now()}.${extn}`;

    const params = {
        Bucket: bucketName,
        Key: fileKey,
        Body: buffer,
    };

    const s3Url = `https://${bucketName}.s3.${awsRegion}.amazonaws.com/${fileKey}`;

    await s3Client.send(new PutObjectCommand(params));
    return { s3Url };
}