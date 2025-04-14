import { Entity, Column, UpdateDateColumn, CreateDateColumn, PrimaryGeneratedColumn, Index } from 'typeorm';
import { SemanticModelStatus } from '../enums';
import { IShape } from '../agents/shapesManager';

@Entity('semantic_model_histories')
export class SemanticModelHistory {
    @PrimaryGeneratedColumn()
    _id: number;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @Index()
    @Column({ type: 'text', nullable: false })
    uuid: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @Column({ type: 'jsonb', nullable: true })
    visualModel: IShape[];

    @Column({
        type: 'varchar',
        length: 50,
        default: SemanticModelStatus.ACTIVE,
        enum: SemanticModelStatus
    })
    status: SemanticModelStatus = SemanticModelStatus.ACTIVE

    @Column({ type: 'jsonb', nullable: true })
    agentStatus: Record<string, SemanticModelStatus>;

    @Column({ type: 'integer', nullable: true })
    userId: number; // ID of the user who created the semantic model history
}
