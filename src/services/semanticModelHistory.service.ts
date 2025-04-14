import { Service } from "typedi";
import { AppDataSource } from "../configs/database";
import { BaseService } from "./base.service";
import { SemanticModelHistroy } from "../entities/semantic_model_history.entity";

@Service()
export class SemanticModelHistoryService extends BaseService<SemanticModelHistroy> {
    constructor() {
        super(AppDataSource.getRepository(SemanticModelHistroy));
    }

    async findByUuid(uuid: string): Promise<SemanticModelHistroy[]> {
        return this.getRepository().find({ where: { uuid } });
    }

    async createSemanticModelHistory(uuid: string, data: Partial<SemanticModelHistroy>): Promise<SemanticModelHistroy> {
        if (!uuid) {
            throw new Error("uuid is required");
        }

        const semanticModelHistory = this.getRepository().create({ uuid, ...data });
        return await this.getRepository().save(semanticModelHistory);
    }

}