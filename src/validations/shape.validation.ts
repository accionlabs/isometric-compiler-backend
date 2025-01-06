import { IsString, IsEnum, IsOptional, IsArray, IsJSON, IsNotEmpty, ValidateNested, IsObject, isArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ShapeType } from '../entities/shape.entity';


// Define Metadata validation class
export class MetadataValidation {
  @IsString()
  @IsOptional()
  description: string;  

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicationTypes?: string[];  

  @IsOptional()
  @IsObject()
  customProperties?: Record<string, any>;  

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
  name: string;  

  @IsEnum(ShapeType)
  type: ShapeType;  

  @IsOptional()
  @IsString()
  attachTo?: string;  

  @IsOptional()
  @IsString()
  svgFile?: string;  

  @IsString()
  @IsOptional()
  svgContent: string;  

  @IsString()
  @IsOptional()
  version?: string;  

  @IsOptional()
  @ValidateNested()
  @Type(() => MetadataValidation)
  metadata?: MetadataValidation;  

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags: string[];  

  @IsString()
  @IsOptional()
  author: string;  

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  diagram_components?:  Record<string, any>[]; 

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  attachment_points?: Record<string, any>[];
}


export class ShapeUpdateValidation {
  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  name: string;  

  @IsEnum(ShapeType)
  @IsOptional()
  type: ShapeType;  

  @IsOptional()
  @IsString()
  attachTo?: string;  

  @IsOptional()
  @IsString()
  svgFile?: string;  

  @IsString()
  @IsOptional()
  svgContent: string;  

  @IsString()
  @IsOptional()
  version?: string;  

  @IsOptional()
  @ValidateNested()
  @Type(() => MetadataValidation)
  metadata?: MetadataValidation;  

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags: string[];  

  @IsString()
  @IsOptional()
  author: string;  

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  diagram_components?:  Record<string, any>[]; 

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  attachment_points?: Record<string, any>[];
}