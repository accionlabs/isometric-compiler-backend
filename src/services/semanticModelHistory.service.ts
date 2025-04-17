import { Service } from "typedi";
import { AppDataSource } from "../configs/database";
import { BaseService } from "./base.service";
import { SemanticModelHistory } from "../entities/semantic_model_history.entity";
import ApiError from "../utils/apiError";
import { User } from "../entities/user.entity";

@Service()
export class SemanticModelHistoryService extends BaseService<SemanticModelHistory> {
    constructor() {
        super(AppDataSource.getRepository(SemanticModelHistory));
        this.userRepository = AppDataSource.getRepository(User);
    }
    private userRepository;

    async findByUuid(uuid: string): Promise<SemanticModelHistory[]> {
        return this.getRepository().find({ where: { uuid } });
    }

    async getHistoryByUuid(uuid: string, includeMetadata = false): Promise<any[]> {
        if (!uuid) {
            throw new ApiError("UUID is required", 400);
        }

        const histories = await this.getRepository().find({
            where: { uuid },
            relations: ['user'],
            order: { createdAt: 'DESC' },
        });

        return histories.map(history => {
            const base = {
                _id: history._id,
                uuid: history.uuid,
                createdAt: history.createdAt,
                updatedAt: history.updatedAt,
                status: history.status,
                agent: history.agent,
                user: history.user ? { id: history.user._id, name: `${history.user.firstName} ${history.user.lastName}`, email: history.user.email } : null,
            };

            if (includeMetadata) {
                return { ...base, metadata: history.metadata };
            }

            return base;
        });
    }


    async createSemanticModelHistory(uuid: string, data: Partial<SemanticModelHistory>): Promise<SemanticModelHistory> {
        if (!uuid) {
            throw new Error("uuid is required");
        }
        if (data.userId) {
            const userExists = await this.userRepository.findOne({ where: { _id: data.userId } });

            if (!userExists) {
                throw new ApiError(`User with ID ${data.userId} does not exist`, 400);
            }
        }

        const semanticModelHistory = this.getRepository().create({ uuid, ...data });
        const result = await this.getRepository().save(semanticModelHistory);
        return result
    }

    async findByIdAndUuid(historyId: number, uuid: string): Promise<SemanticModelHistory | null> {
        return this.getRepository().findOne({
            where: { _id: historyId, uuid },
        });
    }


}