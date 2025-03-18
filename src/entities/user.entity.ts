import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum UserRole {
  'DESIGNER' = 'DESIGNER',
  'END_USER' = 'END_USER',
  'ADMIN' = 'ADMIN',
  'COMPONENT_AUTHOR' = 'COMPONENT_AUTHOR'
}

@Entity('users')
export class User extends BaseEntity {

  @Column({ type: 'varchar', length: 255 })
  firstName: string;

  @Column({ type: 'varchar', length: 255 })
  lastName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.END_USER
  })
  role: UserRole = UserRole.END_USER;
}
