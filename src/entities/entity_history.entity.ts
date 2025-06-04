import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn, Index, JoinColumn, ManyToOne, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('entity_histories')
export class EntityHistory {
    @PrimaryGeneratedColumn()
    _id: number;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @Index()
    @Column({ type: 'integer', nullable: false })
    entityId: number;

    @Index()
    @Column({ type: 'text', nullable: false })
    entityType: string;

    @Column({ type: 'jsonb', nullable: true })
    entityData: Record<string, any> | null;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'integer' })
    userId: number;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, any>;
}