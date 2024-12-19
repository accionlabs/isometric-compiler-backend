import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('Shape')
export class Shape extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column()
  description: string;
}