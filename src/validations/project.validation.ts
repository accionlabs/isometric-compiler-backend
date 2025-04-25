import { IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';

export class CreateProjectValidation {

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    version: string;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}
