import { Service } from "typedi";
import { AppDataSource } from "../configs/database";
import { BaseService } from "./base.service";
import { SemanticModelHistory } from "../entities/semantic_model_history.entity";

@Service()
export class SemanticModelHistoryService extends BaseService<SemanticModelHistory> {
    constructor() {
        super(AppDataSource.getRepository(SemanticModelHistory));
    }

    async findByUuid(uuid: string): Promise<SemanticModelHistory[]> {
        return this.getRepository().find({ where: { uuid } });
    }

    async createSemanticModelHistory(uuid: string, data: Partial<SemanticModelHistory>): Promise<SemanticModelHistory> {
        if (!uuid) {
            throw new Error("uuid is required");
        }

        const semanticModelHistory = this.getRepository().create({ uuid, ...data });
        return await this.getRepository().save(semanticModelHistory);
    }

}