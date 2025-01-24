import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsMongoId,
    IsObject,
    IsArray,
} from 'class-validator';

export class CreateDiagramValidation {

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    version: string;

    @IsOptional()
    @IsObject({ each: true })
    metadata?: any;

    @IsOptional()
    @IsArray()
    @IsObject({ each: true })
    diagramComponents?:  Record<string, any>[]; 
}

export class DiagramUpdateValidation {
    @IsOptional()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    version: string;

    @IsOptional()
    @IsObject({ each: true })
    metadata?: any;

    @IsOptional()
    @IsObject({ each: true })
    diagramComponents?: any;
}
