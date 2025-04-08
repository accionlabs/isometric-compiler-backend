import {
  Entity,
  Column,
  ManyToOne,
  Index
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('diagrams')
@Index('diagram_name_version_unique', ['name', 'version'], { unique: true })
export class Diagram extends BaseEntity {

  @ManyToOne(() => User, (user) => user.diagrams, { onDelete: "CASCADE" })
  author: User;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 20, default: '1.0.0', nullable: false })
  version: string = '1.0.0';

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ type: 'jsonb', nullable: true })
  diagramComponents: Record<string, any>[];
}
