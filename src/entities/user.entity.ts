import { Entity, ObjectIdColumn, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum UserRole {
'DESIGNER' = 'DESIGNER',
'END_USER' = 'END_USER',
'ADMIN'=  'ADMIN',
'COMPONENT_AUTHOR'= 'COMPONENT_AUTHOR'
}

@Entity('users')
export class User extends BaseEntity{
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.END_USER, // Reference the enum value here
  })
    role: UserRole = UserRole.END_USER;

}
