import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsArray, IsEnum, IsString } from 'class-validator';
import { Agents, UnifiedModelGenerationStatus } from '../enums';

export enum FileType {
    pdf = 'pdf',
    image = 'image',
    text = 'text',
    markdown = 'markdown',
}

export enum StatusEnum {
    none = 'none',
    inprogress = 'inprogress',
    done = 'done'
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

    @IsArray()
    tags: string[]
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

    @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.none })
    fileIndexedStatus: StatusEnum

    @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.none })
    functionalMetricsGenerated: StatusEnum

    @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.none })
    architectureMetricsGenerated: StatusEnum

    @Column({ type: 'jsonb', nullable: true })
    metadata?: Metadata;

    @Column({ type: 'enum', default: UnifiedModelGenerationStatus.PROCESSING, enum: UnifiedModelGenerationStatus })
    status: UnifiedModelGenerationStatus

}
