import { ObjectIdColumn, Column, CreateDateColumn, UpdateDateColumn, ObjectId } from 'typeorm';
import { Status } from '../enums'

export abstract class BaseEntity {
  @ObjectIdColumn()
  _id: ObjectId;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.ACTIVE, // Default value
  })
  status: Status;
}
