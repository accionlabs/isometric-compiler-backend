import {
  Entity,
  Column,
  ManyToOne,
  Index,
  JoinColumn
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('diagrams')
@Index('diagram_name_version_unique', ['name', 'version'], { unique: true })
export class Diagram extends BaseEntity {

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'userId' })
  author: User;

  @Column({ type: 'integer', nullable: true })
  userId: number; // ID of the user who created the semantic model history

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 20, default: '1.0.0', nullable: false })
  version: string = '1.0.0';

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ type: 'uuid', nullable: true })
  uuid: string

  @Column({ type: 'jsonb', nullable: true })
  diagramComponents: Record<string, any>[];
}
