import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('chats')
export class Chat  extends BaseEntity {

  @Column({ type: 'varchar', length: 255, unique: true })
  uuid: string;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'varchar', length: 50 })
  message_type: 'file' | 'text' | 'json';

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'varchar', length: 50 })
  role: 'system' | 'user';

}
