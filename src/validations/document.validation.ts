import { IsArray, IsEmail, IsEnum, IsOptional, IsString } from "class-validator";
import { FileType } from "../entities/document.entity";

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
