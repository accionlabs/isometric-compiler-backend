import { IsArray, IsEmail, IsEnum, IsNumber, IsOptional, IsString, Matches } from "class-validator";
import { FileType, MetricsEnum } from "../entities/document.entity";

export class SendEmailDto {
    @IsEmail()
    email: string;

    @IsString()
    @IsOptional()
    subject?: string;
}


export class UpdateMetadataDto {
    @IsString()
    @IsOptional()
    mimetype: string;

    @IsString()
    @IsOptional()
    filename: string;

    @IsString()
    @IsOptional()
    fileUrl: string;

    @IsOptional()
    @IsEnum(FileType)
    fileType: FileType;

    @IsArray()
    @IsOptional()
    @IsString({ each: true }) // ensures each tag in the array is a string
    tags: string[];
}

export class KmsDocumentIndexDto {
    @IsString()
    uuid: string;

    @IsString()
    @IsOptional()
    @Matches(/^https:\/\/github\.com\/[^\/]+\/[^\/]+$/, {
        message: 'Repository URL must be in the format https://github.com/<user>/<repo>',
    })
    gitUrl: string

    @IsString()
    @IsOptional()
    gitToken: string

}

export class KmsMetricsDto {
    @IsString()
    uuid: string;

    @IsNumber()
    documentId: number;

    @IsEnum(MetricsEnum)
    metrics: MetricsEnum

}

