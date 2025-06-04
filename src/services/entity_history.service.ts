import { Service } from "typedi";
import { AppDataSource } from "../configs/database";
import { BaseService } from "./base.service";
import { EntityHistory } from "../entities/entity_history.entity";
import ApiError from "../utils/apiError";
import { User } from "../entities/user.entity";

@Service()
export class EntityHistoryService extends BaseService<EntityHistory> {
    constructor() {
        super(AppDataSource.getRepository(EntityHistory));
        this.userRepository = AppDataSource.getRepository(User);
    }
    private userRepository;

    async findByEntityId(entityId: number): Promise<EntityHistory[]> {
        return this.getRepository().find({ where: { entityId } });
    }

    async getHistoryByEntityId(entityId: number, includeMetadata = false): Promise<any[]> {
        if (!entityId) {
            throw new ApiError("Entity ID is required", 400);
        }

        const histories = await this.getRepository().find({
            where: { entityId },
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });

        return histories;
    }

    async createEntityHistory({ entityId, entityType, data, editedByUserId }: { entityId: number; entityType: string; data: Record<string, any>; editedByUserId: number }): Promise<EntityHistory> {
        if (!entityId) {
            throw new Error("Entity ID is required");
        }
        if (editedByUserId) {
            const userExists = await this.userRepository.findOne({ where: { _id: editedByUserId } });

            if (!userExists) {
                throw new ApiError(`User with ID ${editedByUserId} does not exist`, 400);
            }
        }
        const entityHistory = this.getRepository().create({ entityId, userId: editedByUserId, entityType, entityData: data });
        const result = await this.getRepository().save(entityHistory);
        return result
    }

}