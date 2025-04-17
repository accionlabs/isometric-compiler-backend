import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { AppDataSource } from '../configs/database';
import { Project } from '../entities/project.entity';
import { BaseService } from './base.service';

@Service()
export class ProjectService extends BaseService<Project> {
    constructor() {
        const repo: Repository<Project> = AppDataSource.getRepository(Project);
        super(repo);
    }


    async findByUUID(uuid: string): Promise<Project | null> {
        return this.getRepository().findOne({ where: { uuid } });
    }
}
