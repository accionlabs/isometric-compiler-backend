import {
    Entity,
    Column,
    ObjectId,
    Index,
  } from 'typeorm';
import { BaseEntity } from './base.entity';
  
  @Entity('diagrams')
  @Index('diagram_name_version_unique',['name', 'version'], { unique: true })
  export class Diagram extends BaseEntity {
    
    @Column({ type: 'string' })
    author: ObjectId;
  
    @Column()
    name: string;
  
    @Column({ default: '1.0.0', nullable: false })
    version: string = '1.0.0';
  
    @Column({ type: 'json', nullable: true })
    metadata: any;
  
    @Column({ type: 'json', nullable: true })
    diagramComponents: Record<string, any>[]; 
  }
  