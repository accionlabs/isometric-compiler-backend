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
  name: string;  // Shape name

  @Column({ type: 'enum', enum: ShapeType })
  type: ShapeType;  // Shape type (2D, 3D, COMPONENT)

  @Column({ type: 'string', nullable: true })
  attachTo?: string;  // Field to attach the shape to another entity or category

  @Column({ nullable: true })
  svgFile?: string;  // SVG file name or path (optional)

  @Column({})
  svgContent: string;  // SVG content as a string (mandatory)

  @Column({ default: '1.0.0', nullable: false })
  version: string = '1.0.0';  // Version field (optional)

  @IsMongoId()
  @Column({ type: 'string' })
  category: ObjectId;  // Reference to Category (parent-child relation)

  @Column({type: 'json'})
  metadata: Metadata;  // Metadata field with default empty object

  @Column({ type: 'array' })
  tags: string[];  // Tags for the shape

  @Column({ type: 'string' })
  author: string;  // Author of the shape

}
