import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { IsEnum, IsString } from 'class-validator';

export enum FileType {
    pdf = 'pdf',
    image = 'image',
    text = 'text',
    docx = 'docx'
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
export class Document extends BaseEntity {

    @Column({ type: 'varchar', length: 255 })
    uuid: string;

    @Column({ type: 'text', nullable: true })
    content?: string

    @Column({ type: 'jsonb', nullable: true })
    metadata?: Metadata;

}
