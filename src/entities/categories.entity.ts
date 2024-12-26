import { Entity, Column, Index, ManyToOne } from 'typeorm';
import { IsOptional, IsString, IsInt, IsJSON } from 'class-validator';
import { BaseEntity } from './base.entity';

// Define a Metadata subdocument class
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

@Entity('categories')
@Index('categories_path_unique', ['path'], { unique: true }) // Unique index on the 'path' field
export class Category extends BaseEntity {


    @Column({ type: 'string' })
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    // MongoDB does not enforce foreign keys, but you can use ObjectId references manually
    @ManyToOne(() => Category, { nullable: true })
    parent?: Category;

    @Column({ type: 'array' })
    path: string[];

    // Define metadata as a subdocument with class validation and nesting
    @Column(type => Metadata)
    metadata: Metadata;
}
