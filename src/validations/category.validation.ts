import { IsString, IsOptional, IsArray, IsInt, IsJSON, ValidateNested, IsNotEmpty, MinLength, isObject, IsObject, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
// Metadata class to define the structure and validation of metadata
class Metadata {
    @IsOptional()
    @IsInt()
    displayOrder?: number;

    @IsOptional()
    @IsString()
    icon?: string;  // Store SVG content as a string

    @IsOptional()
    @IsObject()
    customProperties?: Record<string, any>;  // Flexible custom properties
}

// Category validation class
export class CategoryValidation {

    @IsString()
    @MinLength(1)  // Ensure name is not empty
    name: string;

    @IsOptional()
    @IsString()
    @MinLength(0)  // Optional field, but if provided, should be a string
    description?: string;

    @IsOptional()
    @IsNumber()  // Validate that parent (if present) is a valid MongoDB ObjectId
    parent?: number;

    @IsString()
    @IsOptional()
    path: string;

    @ValidateNested() // Validate nested Metadata object
    @Type(() => Metadata) // Ensure the Type for Metadata is applied for validation
    metadata: Metadata;
}

export class CategoryUpadteValidation {

    @IsOptional()
    @IsString()
    @MinLength(1)  // Ensure name is not empty
    name: string;

    @IsOptional()
    @IsString()
    @MinLength(0)  // Optional field, but if provided, should be a string
    description?: string;

    @IsOptional()
    @IsNumber()  // Validate that parent (if present) is a valid MongoDB ObjectId
    parent?: number;

    @IsString()
    @IsOptional()
    path: string;

    @IsOptional()
    @ValidateNested() // Validate nested Metadata object
    @Type(() => Metadata) // Ensure the Type for Metadata is applied for validation
    metadata: Metadata;

    @IsOptional()
    @IsEnum(['active', 'inactive'], {
        message: 'Status must be either active or inactive',
    })
    status?: 'active' | 'inactive';
}
