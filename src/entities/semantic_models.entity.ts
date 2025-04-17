import { Entity, Column, UpdateDateColumn, CreateDateColumn, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';
import { Agents, SemanticModelStatus } from '../enums';
import { IShape } from '../agents/shapesManager';

@Entity('semantic_models')
export class SemanticModel {
    @PrimaryGeneratedColumn()
    _id: number;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;


    @Column({ type: 'text', unique: true, nullable: false })
    uuid: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @Column({ type: 'jsonb', nullable: true })
    architectural_specs: Record<string, any>;

    @Column({ type: 'jsonb', nullable: true })
    qum_specs: Record<string, any>;

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
    userId: number;

    @Column({ type: 'enum', enum: Agents, nullable: true })
    agent: Agents
}
