import { BaseEntity } from './base.entity';
import { Entity, ObjectIdColumn, ObjectId, Column, Index, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsString, IsEnum, IsOptional, IsArray, IsJSON, IsNotEmpty, ValidateNested, isJSON, IsMongoId } from 'class-validator';
import { Category } from './categories.entity';
import { Type } from 'class-transformer';

// Enum for the shape types
export enum ShapeType {
  '2D' = '2D',
  '3D' = '3D',
  'COMPONENT' = 'COMPONENT',
  "LAYERS" = 'LAYERS'
}

// Define DependencyRef class for dependencies
class DependencyRef {
  @IsString()
  shapeId: string;  // Reference to the dependent shape's ID

  @IsString()
  version: string;  // Version of the dependent shape or component
}

class Metadata {
  @IsString()
  description: string;  // Description of the shape

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicationTypes?: string[];  // Optional application types

  @IsOptional()
  customProperties?: Record<string, any>;  // Custom properties (flexible)

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DependencyRef)
  dependencies?: DependencyRef[];
}

@Entity('shapes')
@Index('shapes_name_version_unique', ['name', 'version'], { unique: true }) // Unique constraint on name and version
export class Shape extends BaseEntity {

  @Column({ type: 'string' })
  name: string;  

  @Column({ type: 'enum', enum: ShapeType })
  type: ShapeType;  

  @Column({ type: 'string', nullable: true })
  attachTo?: string;  

  @Column({ nullable: true })
  svgFile?: string;  

  @Column({})
  svgContent: string;  

  @Column({ default: '1.0.0', nullable: false })
  version: string = '1.0.0';  

  @IsMongoId()
  @Column({ type: 'string' })
  category: ObjectId;  

  @Column({type: 'json'})
  metadata: Metadata;  

  @Column({ type: 'array' })
  tags: string[];  

  @Column({ type: 'string' })
  author: string;  

  @Column({ type: 'json', nullable: true })
  diagram_components?: Record<string, any>; 

  @Column({ type: 'json', nullable: true })
  attachment_points?: Record<string, any>; 

}
