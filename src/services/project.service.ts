import { Service } from 'typedi';
import { Repository, DeepPartial, ILike } from 'typeorm';
import { AppDataSource } from '../configs/database';
import { Project } from '../entities/project.entity';
import { BaseService } from './base.service';
import ApiError from '../utils/apiError';

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
    
    async create(data: DeepPartial<Project>): Promise<Project> {
        const version = data.version ?? '1.0.0';
        const name = (data.name ?? '').trim();
        const existing = await this.getRepository().findOne({
            where: { name: ILike(name), version }
        });
        if (existing) {
            throw new ApiError(`Project with name "${data.name}" already exists`, 409);
        }
        return super.create({ ...data, version });
    }

    async update(id: number, data: DeepPartial<Project>): Promise<Project> {
        if (data.name) {
            const version = data.version ?? '1.0.0';
            const name = data.name.trim();
            const existing = await this.getRepository().findOne({
                where: { name: ILike(name), version }
            });
            if (existing && existing._id !== id) {
                throw new ApiError(`Project with name "${data.name}" already exists`, 409);
            }
        }
        const updated = await super.update(id, data);
        if (!updated) {
            throw new ApiError('Project not found', 404);
        }
        return updated;
    }

}
