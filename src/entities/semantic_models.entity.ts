import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum SemanticModelStatus {
    ACTIVE = 'active',
    INITIATED = 'initiated',
    GENERATING_BUSINESS_SPEC = 'generating_business_spec',
    GENERATING_QUM_DESIGN_SPEC = 'generating_qum_design_spec',
    GENERATING_BREEZE_SPEC = 'generating_breeze_spec',
    INACTIVE = 'inactive'
}

@Entity('semantic_models')
export class SemanticModel {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text', unique: true })
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

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
}
