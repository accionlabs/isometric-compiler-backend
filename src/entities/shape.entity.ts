import { BaseEntity } from './base.entity';
import {
  Entity, Column, Index, ManyToOne, PrimaryGeneratedColumn
} from 'typeorm';
import { IsString, IsEnum, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Category } from './categories.entity';
import { Type } from 'class-transformer';

// Enum for the shape types
export enum ShapeType {
  '2D' = '2D',
  '3D' = '3D',
  'COMPONENT' = 'COMPONENT',
  'LAYERS' = 'LAYERS'
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

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: ShapeType })
  type: ShapeType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  attachTo?: string;

  @Column({ type: 'text', nullable: true })
  svgFile?: string;

  @Column({ type: 'text' })
  svgContent: string;

  @Column({ type: 'varchar', length: 20, default: '1.0.0', nullable: false })
  version: string = '1.0.0';

  @Index()
  @Column({ type: 'int' })
  category: number;  // Replaced `ObjectId` with `number`

  @Column({ type: 'jsonb' })
  metadata: Metadata;

  @Column({ type: 'text', array: true, default: [] })
  tags: string[];

  @Column({ type: 'varchar', length: 255 })
  author: string;

  @Column({ type: 'jsonb', nullable: true })
  diagram_components?: Record<string, any>[];

  @Column({ type: 'jsonb', nullable: true })
  attachment_points?: Record<string, any>[];
}
