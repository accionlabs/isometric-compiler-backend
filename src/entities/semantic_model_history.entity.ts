import { Entity, Column, UpdateDateColumn, CreateDateColumn, PrimaryGeneratedColumn, Index } from 'typeorm';
import { SemanticModelStatus } from '../enums';
import { IShape } from '../agents/shapesManager';

@Entity('semantic_model_histories')
export class SemanticModelHistroy {
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
}
