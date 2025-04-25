import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsObject,
    IsArray,
    IsEnum,
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
    diagramComponents?: Record<string, any>[];

    @IsString()
    uuid: string; // Project UUID
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

    @IsOptional()
    @IsEnum(['active', 'inactive'], {
        message: 'Status must be either active or inactive',
    })
    status?: 'active' | 'inactive';
}
