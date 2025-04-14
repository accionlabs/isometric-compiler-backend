import { Inject, Service } from "typedi";
import { AppDataSource } from "../configs/database";
import { SemanticModel } from "../entities/semantic_models.entity";
import { BaseService } from "./base.service";
import { Agents, SemanticModelStatus } from "../enums";
import { PersonaResp } from "../agents/qum_agent/qumAgent";
import ApiError from "../utils/apiError";
import { SemanticModelHistoryService } from "./semanticModelHistory.service";

type Qum = {
    qum: PersonaResp[];
};

@Service()
export class SemanticModelService extends BaseService<SemanticModel> {

    @Inject(() => SemanticModelHistoryService)
    private readonly semanticModelHistoryService: SemanticModelHistoryService

    constructor() {
        super(AppDataSource.getRepository(SemanticModel));
    }

    async findByUuid(uuid: string): Promise<SemanticModel | null> {
        return this.getRepository().findOne({ where: { uuid } });
    }

    async saveSemanticModel(data: Partial<SemanticModel>): Promise<SemanticModel> {
        if (!data.uuid) {
            throw new Error("uuid is required");
        }

        return this.getRepository().manager.transaction(async (manager) => {
            const repo = manager.getRepository(SemanticModel);
            let semanticModel = await repo.findOne({
                where: { uuid: data.uuid },
                lock: { mode: "pessimistic_write" }, // This locks the row
            });

            if (semanticModel) {
                const semanticModelCopy = JSON.parse(JSON.stringify(semanticModel)); // Deep copy to avoid mutation
                if (semanticModelCopy.metadata || semanticModelCopy.visualModel?.length) {
                    await this.semanticModelHistoryService.createSemanticModelHistory(semanticModelCopy.uuid, semanticModelCopy);
                }
                if (data.metadata && semanticModel.metadata) {
                    semanticModel.metadata = this.mergeJsons(semanticModel.metadata as Qum | undefined, data.metadata as Qum);
                } else if (data.metadata) {
                    semanticModel.metadata = data.metadata;
                }

                Object.assign(semanticModel, {
                    ...data,
                    metadata: semanticModel.metadata, // keep the merged one
                });
            } else {
                semanticModel = repo.create(data);
            }

            return await repo.save(semanticModel);
        });
    }

    async updateSemanticModel(uuid: string, data: Partial<Pick<SemanticModel, 'metadata' | 'visualModel' | 'userId'>>): Promise<SemanticModel> {
        if (!uuid) {
            throw new ApiError("UUID is required", 400);
        }

        return this.getRepository().manager.transaction(async (manager) => {
            const repo = manager.getRepository(SemanticModel);
            const semanticModel = await repo.findOne({
                where: { uuid },
                lock: { mode: "pessimistic_write" },
            });

            if (!semanticModel) {
                throw new ApiError("Semantic model not found", 404);
            }

            const currentSemanticModel = JSON.stringify(data.metadata)
            const existingSemanticModel = JSON.stringify(semanticModel.metadata)
            if (currentSemanticModel === existingSemanticModel) {
                throw new ApiError("No changes detected", 400);
            }

            const semanticModelCopy = { ...semanticModel, metadata: JSON.parse(existingSemanticModel) };

            Object.assign(semanticModel, {
                ...data,
                metadata: data.metadata, // keep the merged one
            });
            await this.semanticModelHistoryService.createSemanticModelHistory(semanticModelCopy.uuid, semanticModelCopy);
            return await repo.save(semanticModel);
        });
    }




    async getAgentStatus(uuid: string) {
        const semanticModel = await this.getRepository().findOne({ where: { uuid }, select: ["agentStatus"] });
        const defaultAgentStaus = Object.values(Agents).reduce((acc, key) => {
            acc[key] = SemanticModelStatus.ACTIVE;
            return acc;
        }, {} as Record<string, SemanticModelStatus>);
        return { ...defaultAgentStaus, ...semanticModel?.agentStatus }
    }


    // Helper function to merge arrays based on a unique identifier.
    // It adds items from 'source' that are not already in 'target'.
    private mergeArrays<T>(target: T[], source: T[], identifier: (item: T) => string): T[] {
        const merged = [...target];
        for (const item of source) {
            if (!merged.find(x => identifier(x) === identifier(item))) {
                merged.push(item);
            }
        }
        return merged;
    }

    // Main merge function for the JSON objects.
    private mergeJsons(json1?: Qum, json2?: Qum) {
        if (!json1 || Object.keys(json1).length === 0) return json2 || {};
        if (!json2 || Object.keys(json2).length === 0) return json1 || {};
        // Start with a deep clone of json1 to avoid mutating it
        const merged: Qum = { qum: JSON.parse(JSON.stringify(json1.qum ?? [])) };

        // Iterate through each persona in json2.
        for (const persona2 of json2.qum) {
            // Check if this persona already exists in merged data.
            let existingPersona = merged.qum.find(p => p.persona === persona2.persona);
            if (!existingPersona) {
                // Persona does not exist, so add it entirely.
                merged.qum.push(persona2);
            } else {
                // Persona exists: merge outcomes.
                for (const outcome2 of (persona2?.outcomes || [])) {
                    let existingOutcome = existingPersona.outcomes?.find(o => o.outcome === outcome2.outcome);
                    if (!existingOutcome) {
                        // Outcome doesn't exist, add it.
                        if (!existingPersona.outcomes) {
                            existingPersona.outcomes = [];
                        }
                        existingPersona.outcomes.push(outcome2);
                    } else {
                        // Merge citations by documentId.
                        existingOutcome.citations = this.mergeArrays(
                            existingOutcome.citations || [],
                            outcome2.citations || [],
                            (c: any) => c.documentId
                        );

                        // Merge scenarios.
                        for (const scenario2 of (outcome2.scenarios || [])) {
                            let existingScenario = existingOutcome.scenarios?.find(s => s.scenario === scenario2.scenario);
                            if (!existingScenario) {
                                // Scenario not found, add it.
                                if (!existingOutcome.scenarios) {
                                    existingOutcome.scenarios = [];
                                }
                                existingOutcome.scenarios.push(scenario2);
                            } else {
                                // Merge steps in the scenario by step identifier.
                                existingScenario.steps = this.mergeArrays(
                                    existingScenario.steps || [],
                                    scenario2.steps || [],
                                    (step) => step.step
                                );

                                // For each step in scenario2, merge actions.
                                for (const step2 of (scenario2.steps || [])) {
                                    let existingStep = existingScenario.steps.find(s => s.step === step2.step);
                                    if (existingStep) {
                                        existingStep.actions = this.mergeArrays(
                                            existingStep.actions || [],
                                            step2.actions || [],
                                            (action) => action.action
                                        );
                                    } else {
                                        // This branch should rarely occur since we merged steps earlier,
                                        // but it ensures all steps from scenario2 are added.
                                        existingScenario.steps.push(step2);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        if (!merged.qum.length) {
            return {};
        }
        return merged;
    }

}