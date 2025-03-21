import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('llm_conversations')
export class LLMConversation extends BaseEntity {

    @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
    key: string;

    @Column({ type: 'text', nullable: true })
    context?: string;

    @Column({ type: 'text', nullable: true })
    conversations?: string;

    @Column({ type: 'text', nullable: true })
    metadata?: string;
}
