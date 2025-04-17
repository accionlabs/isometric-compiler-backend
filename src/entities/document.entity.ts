import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { IsEnum, IsString } from 'class-validator';
import { Agents, UnifiedModelGenerationStatus } from '../enums';

export enum FileType {
    pdf = 'pdf',
    image = 'image'
}
class Metadata {

    @IsString()
    mimetype: string;

    @IsString()
    filename: string;

    @IsString()
    fileUrl: string;

    @IsString()
    @IsEnum(FileType)
    fileType: FileType
}

@Entity('documents')
export class Document {
    @PrimaryGeneratedColumn()
    _id: number;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @Column({ type: 'varchar', length: 255 })
    uuid: string;

    @Column({ type: 'text', nullable: true })
    content?: string

    @Column({ type: 'varchar', nullable: false, default: Agents.REQUIREMENT_AGENT })
    agent: string

    @Column({ type: 'jsonb', nullable: true })
    metadata?: Metadata;

    @Column({ type: 'enum', default: UnifiedModelGenerationStatus.ACTIVE, enum: UnifiedModelGenerationStatus })
    status: UnifiedModelGenerationStatus

}
