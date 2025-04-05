import { Service } from "typedi";
import { AppDataSource } from "../configs/database";
import { SemanticModel } from "../entities/semantic_models.entity";
import { BaseService } from "./base.service";
import { Agents, SemanticModelStatus } from "../enums";

@Service()
export class SemanticModelService extends BaseService<SemanticModel> {
    constructor() {
        super(AppDataSource.getRepository(SemanticModel));
    }

    async findByUuid(uuid: string): Promise<SemanticModel | null> {
        return this.getRepository().findOne({ where: { uuid } });
    }

    async saveSemanticModel(data: Partial<SemanticModel>): Promise<SemanticModel> {
        if (!data.uuid) {
            throw new Error("uuid is required")
        }
        let semanticModel = await this.findByUuid(data.uuid);
        if (semanticModel) {
            // Update existing record
            Object.assign(semanticModel, data);
        } else {
            semanticModel = this.getRepository().create(data);
        }

        return this.getRepository().save(semanticModel);

    }


    async getAgentStatus(uuid: string) {
        const semanticModel = await this.getRepository().findOne({ where: { uuid }, select: ["agentStatus"] });
        const defaultAgentStaus = Object.values(Agents).reduce((acc, key) => {
            acc[key] = SemanticModelStatus.ACTIVE;
            return acc;
        }, {} as Record<string, SemanticModelStatus>);
        return { ...defaultAgentStaus, ...semanticModel?.agentStatus }
    }
}