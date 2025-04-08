import { Entity, Column, Index, ManyToOne, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { IsOptional, IsString, IsInt, IsJSON } from 'class-validator';
import { BaseEntity } from './base.entity';
import { Shape } from './shape.entity';

// Define a Metadata subdocument class
class Metadata {
    @IsOptional()
    @IsInt()
    displayOrder?: number;

    @IsOptional()
    @IsString()
    icon?: string;  // Store SVG content as a string

    @IsOptional()
    @Column({ type: 'jsonb' })  // Use `jsonb` for efficient storage
    customProperties?: Record<string, any>;  // Flexible custom properties
}

@Entity('categories')
@Index('categories_path_unique', ['path'], { unique: true }) // Unique index on the 'path' field
export class Category extends BaseEntity {

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Index()
    @ManyToOne(() => Category, (cat) => cat.children, { nullable: true, onDelete: "SET NULL" })
    parent?: Category | null;

    @OneToMany(() => Category, (cat) => cat.parent)
    children: Category[];

    @OneToMany(() => Shape, (shape) => shape.category)
    shapes: Shape[]

    @Column({ type: 'varchar', unique: true })
    path: string;

    // Define metadata as a subdocument with class validation and nesting
    @Column({ type: 'jsonb', nullable: true })
    metadata?: Metadata;

    @Column({ type: 'integer', array: true, default: [] }) // Use integer array
    ancestors: number[];
}
