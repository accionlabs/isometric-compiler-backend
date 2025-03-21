import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity } from 'typeorm';
import { SemanticModelStatus } from '../enums';

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
        default: SemanticModelStatus.ACTIVE,
        enum: SemanticModelStatus
    })
    status: SemanticModelStatus;
}
