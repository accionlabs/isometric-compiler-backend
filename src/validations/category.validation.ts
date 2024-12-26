import { IsString, IsOptional, IsArray, IsInt, IsJSON, ValidateNested, IsNotEmpty, IsMongoId, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ObjectId } from 'typeorm';

// Metadata class to define the structure and validation of metadata
class Metadata {
    @IsOptional()
    @IsInt()
    displayOrder?: number;

    @IsOptional()
    @IsString()
    icon?: string;  // Store SVG content as a string

    @IsOptional()
    @IsJSON()
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
    @IsMongoId()  // Validate that parent (if present) is a valid MongoDB ObjectId
    parent?: ObjectId;

    @IsString()
    @IsOptional()
    path: string;

    @ValidateNested() // Validate nested Metadata object
    @Type(() => Metadata) // Ensure the Type for Metadata is applied for validation
    metadata: Metadata;
}
