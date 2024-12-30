import { IsString, IsEnum, IsOptional, IsArray, IsJSON, IsNotEmpty, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ShapeType } from '../entities/shape.entity';

// Define DependencyRef class for validating dependencies
export class DependencyRefValidation {
  @IsString()
  shapeId: string;  // Reference to the dependent shape's ID

  @IsString()
  version: string;  // Version of the dependent shape or component
}

// Define Metadata validation class
export class MetadataValidation {
  @IsString()
  description: string;  // Description of the shape

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicationTypes?: string[];  // Optional application types

  @IsOptional()
  @IsObject()
  customProperties?: Record<string, any>;  // Custom properties (flexible)

  @IsOptional()
  @ValidateNested({ each: true })
  dependencies?: {
    shapes: any;
    components: any;
  };
}

// Validation class for Shape entity
export class ValidShape {
  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  name: string;  // Shape name

  @IsEnum(ShapeType)
  type: ShapeType;  // Shape type (2D, 3D, COMPONENT)

  @IsOptional()
  @IsString()
  attachTo?: string;  // Field to attach the shape to another entity or category

  @IsOptional()
  @IsString()
  svgFile?: string;  // SVG file name or path (optional)

  @IsString()
  @IsOptional()
  svgContent: string;  // if type is 2d and 3d its mandatory  for component SVG content as a string (mandatory)

  @IsString()
  @IsNotEmpty()
  version: string;  // Version field (optional)

  @IsOptional()
  @ValidateNested()
  @Type(() => MetadataValidation)
  metadata?: MetadataValidation;  // Metadata field with nested validation

  @IsArray()
  @IsString({ each: true })
  tags: string[];  // Tags for the shape

  @IsString()
  author: string;  // Author of the shape
}
