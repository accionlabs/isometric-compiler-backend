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

    async getDefaultProjectUUID(): Promise<string> {
        const adminEmail = 'isometric@accionlabs.com';
        const projectName = 'default project';

        const result = await this.getRepository().query(
            `
            SELECT p.uuid
            FROM projects p
            JOIN users u ON p."userId" = u._id
            WHERE p.name = $1 AND u.email = $2
            LIMIT 1
            `,
            [projectName, adminEmail]
        );

        if (!result.length) {
            throw new Error(`Default project with name "${projectName}" for admin "${adminEmail}" not found.`);
        }

        return result[0].uuid;
    }

}
