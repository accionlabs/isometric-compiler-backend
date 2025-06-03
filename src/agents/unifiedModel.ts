import { extractScenarios } from "./helpers";
import { getCache } from "./cache";
import { Inject, Service } from "typedi";
import { SemanticModelService } from "../services/semanticModel.service";
import { Agents, SemanticModelStatus } from "../enums";
import { QUMAgent, QumBusinessSpecAgenResp, QumDesignSpecAgentResp, ScenarioResp } from "./qum_agent/qumAgent";
import { LoggerService } from "../services/logger.service";
import { DocumentService } from "../services/document.service";

@Service()
export class UnifiedModelGenerator {

    @Inject(() => SemanticModelService)
    private readonly semanticModelService: SemanticModelService;

    @Inject(() => QUMAgent)
    private readonly qumAgent: QUMAgent

    @Inject(() => LoggerService)
    private readonly loggerService: LoggerService

    @Inject(() => DocumentService)
    private readonly documentService: DocumentService

    private getDesignSpec(scenario: string, designScenarios?: ScenarioResp[]): any[] {
        if (!designScenarios) return [];
        for (const designScenario of designScenarios) {
            if (scenario.toLowerCase() === designScenario.scenario.toLowerCase()) {
                return designScenario.steps || [];
            }
        }
        return [];
    }

    private mergeBusinessDesignSpec(business: QumBusinessSpecAgenResp, design: QumDesignSpecAgentResp) {
        const personas = business.qum_business?.personas || [];
        for (const persona of personas) {
            for (const outcome of (persona?.outcomes || [])) {
                for (const scen of (outcome?.scenarios || [])) {
                    scen.steps = this.getDesignSpec(scen.scenario, design.qum_design?.scenarios);
                }
            }
        }
        return personas;
    }

    public async regenerateUnifiedModel(uuid: string, agent: string, documentId: number, userId: number, filename?: string): Promise<void> {
        console.log("regenerateUnifiedModel checking in cache", uuid, agent, filename);
        const cache = await getCache(filename);
        if (cache !== null) {
            await this.semanticModelService.saveSemanticModel({
                uuid,
                metadata: cache,
                status: SemanticModelStatus.ACTIVE,
                userId,
                agent: agent as Agents
            });
            return;
        }

        try {
            console.log("regenerateUnifiedModel started", uuid, agent, filename);
            let context = "";
            await this.semanticModelService.saveSemanticModel({
                uuid,
                status: SemanticModelStatus.INITIATED,
                agentStatus: { [agent]: SemanticModelStatus.INITIATED }
            });

            const document = await this.documentService.findOneById(documentId);
            if (!document) {
                throw new Error("Document not found");
            }
            context = document?.content || "";
            if (!context) {
                throw new Error("No content found for the given filename");
            }
            context = `${context}\n\n---\n documentName: ${document?.metadata?.fileName} documentId: ${document?._id}`;
            await this.semanticModelService.saveSemanticModel({
                uuid,
                status: SemanticModelStatus.GENERATING_BUSINESS_SPEC,
                agentStatus: { [agent]: SemanticModelStatus.GENERATING_BUSINESS_SPEC }
            });
            const businessSpec = await this.qumAgent.generateQUMBusinessSpec(context);
            this.loggerService.info(`[Unified Model] QUM Business SPEC generated for ${uuid}`);

            const scenarios = extractScenarios(businessSpec?.qum_business?.personas || []);
            this.loggerService.info(`[Unified Model] QUM Scenarios SPEC generated for ${uuid}`);

            await this.semanticModelService.saveSemanticModel({
                uuid,
                status: SemanticModelStatus.GENERATING_QUM_DESIGN_SPEC,
                agentStatus: { [agent]: SemanticModelStatus.GENERATING_QUM_DESIGN_SPEC }
            });
            const designSpec = await this.qumAgent.generateQUMDesignSpec(JSON.stringify(scenarios), context);
            this.loggerService.info(`[Unified Model] QUM Design SPEC generated for ${uuid}`);

            const qumBlueprint = this.mergeBusinessDesignSpec(businessSpec, designSpec);
            const unifiedModel = { qum: qumBlueprint };
            await this.semanticModelService.saveSemanticModel({
                uuid,
                metadata: unifiedModel,
                status: SemanticModelStatus.ACTIVE,
                userId,
                agent: agent as Agents,
                agentStatus: { [agent]: SemanticModelStatus.ACTIVE }
            });
        } catch (error: any) {
            this.loggerService.error(`[Unified Model] Error generating unified model: for uuid: ${uuid} documentId: ${documentId}`, error);
        }
    }
}
