import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { SemanticModelStatus } from "../entities/semantic_models.entity";

class MetadataDto {
    [key: string]: any;
}

class VisualModelDto {
    [key: string]: any;
}

export class SaveSemanticModelDto {
    @IsString()
    @IsNotEmpty()
    uuid: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => MetadataDto)
    metadata?: Record<string, any>;

    @IsOptional()
    @ValidateNested()
    @Type(() => VisualModelDto)
    visualModel?: Record<string, any>;

    @IsOptional()
    @IsEnum(SemanticModelStatus)
    status?: SemanticModelStatus;
}
