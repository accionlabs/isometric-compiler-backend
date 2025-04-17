import { Entity, Column, UpdateDateColumn, CreateDateColumn, PrimaryGeneratedColumn, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Agents, SemanticModelStatus } from '../enums';
import { User } from './user.entity';

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
    architectural_specs: Record<string, any>;

    @Column({ type: 'jsonb', nullable: true })
    qum_specs: Record<string, any>;

    @Column({
        type: 'varchar',
        length: 50,
        default: SemanticModelStatus.ACTIVE,
        enum: SemanticModelStatus
    })
    status: SemanticModelStatus = SemanticModelStatus.ACTIVE

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'integer' })
    userId: number; // ID of the user who created the semantic model history

    @Column({ type: 'enum', enum: Agents, nullable: true })
    agent: Agents
}
