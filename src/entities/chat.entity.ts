import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { MessageRoles, MessageTypes } from '../enums';

@Entity('chats')
export class Chat extends BaseEntity {

  @Column({ type: 'varchar', length: 255 })
  uuid: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'enum', enum: MessageTypes })
  messageType: MessageTypes;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'enum', enum: MessageRoles })
  role: MessageRoles

}
