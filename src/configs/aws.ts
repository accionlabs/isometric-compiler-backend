import * as dotenv from 'dotenv';
dotenv.config();

const config = {
    AWS_REGION: process.env.AWS_REGION || "us-west-2",
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || "",
    AWS_ACCESS_KEYID: process.env.AWS_ACCESS_KEYID || "",
    AWS_SECRET_KEY: process.env.AWS_SECRET_KEY || "",
}

export default config;