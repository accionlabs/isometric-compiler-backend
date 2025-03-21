import { Entity, Column } from 'typeorm';
import { SemanticModelStatus } from '../enums';
import { BaseEntity } from './base.entity';

@Entity('semantic_models')
export class SemanticModel extends BaseEntity {
    @Column({ type: 'text', unique: true, nullable: false })
    uuid: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @Column({ type: 'jsonb', nullable: true })
    visualModel: Record<string, any>;

    @Column({
        type: 'varchar',
        length: 50,
        default: SemanticModelStatus.INITIATED,
        enum: SemanticModelStatus
    })
    declare status: SemanticModelStatus = SemanticModelStatus.INITIATED;
}
