import { extractScenarios } from "./helpers";
import { getCache } from "./cache";
import { Inject, Service } from "typedi";
import { SemanticModelService } from "../services/semanticModel.service";
import { PgVectorService } from "../services/pgVector.service";
import { SemanticModelStatus } from "../enums";
import { QUMAgent } from "./qum_agent/qumAgent";
import { LoggerService } from "../services/logger.service";

interface Scenario {
    scenario: string;
    steps?: any[];
}

interface Outcome {
    scenarios: Scenario[];
}

interface Persona {
    outcomes: Outcome[];
}

interface BusinessSpec {
    qum_business?: {
        personas: Persona[];
    };
}

interface DesignSpec {
    qum_design?: {
        scenarios: Scenario[];
    };
}

@Service()
export class UnifiedModelGenerator {

    @Inject(() => SemanticModelService)
    private readonly semanticModelService: SemanticModelService;

    @Inject(() => PgVectorService)
    private readonly pgVectorService: PgVectorService

    @Inject(() => QUMAgent)
    private readonly qumAgent: QUMAgent

    @Inject(() => LoggerService)
    private readonly loggerService: LoggerService

    private getDesignSpec(scenario: string, designScenarios?: Scenario[]): any[] {
        if (!designScenarios) return [];
        for (const designScenario of designScenarios) {
            if (scenario.toLowerCase() === designScenario.scenario.toLowerCase()) {
                return designScenario.steps || [];
            }
        }
        return [];
    }

    private mergeBusinessDesignSpec(business: BusinessSpec, design: DesignSpec): Persona[] {
        const personas = business.qum_business?.personas || [];
        for (const persona of personas) {
            for (const outcome of persona.outcomes) {
                for (const scen of outcome.scenarios) {
                    scen.steps = this.getDesignSpec(scen.scenario, design.qum_design?.scenarios);
                }
            }
        }
        return personas;
    }

    public async regenerateUnifiedModel(uuid: string, filename?: string): Promise<void> {
        const cache = await getCache(filename);
        if (cache !== null) {
            await this.semanticModelService.saveSemanticModel({ uuid, metadata: cache, visualModel: [], status: SemanticModelStatus.ACTIVE });
            return;
        }

        try {
            let context = "";
            await this.semanticModelService.saveSemanticModel({ uuid, metadata: {}, visualModel: [], status: SemanticModelStatus.INITIATED });
            const documents = await this.pgVectorService.vectorSearch("", { uuid });
            documents.forEach((x) => (context += "\n\n---\n" + x.pageContent));

            await this.semanticModelService.saveSemanticModel({ uuid, metadata: {}, visualModel: [], status: SemanticModelStatus.GENERATING_BUSINESS_SPEC });
            const businessSpec = await this.qumAgent.generateQUMBusinessSpec(context);
            this.loggerService.info(`[Unified Model] QUM Business SPEC generated for ${uuid}`);

            const scenarios = extractScenarios(businessSpec?.qum_business?.personas);
            this.loggerService.info(`[Unified Model] QUM Scenarios SPEC generated for ${uuid}`);

            await this.semanticModelService.saveSemanticModel({ uuid, metadata: {}, visualModel: [], status: SemanticModelStatus.GENERATING_QUM_DESIGN_SPEC });
            const designSpec = await this.qumAgent.generateQUMDesignSpec(JSON.stringify(scenarios), context);
            this.loggerService.info(`[Unified Model] QUM Design SPEC generated for ${uuid}`);

            const qumBlueprint = this.mergeBusinessDesignSpec(businessSpec, designSpec);
            const unifiedModel = { qum: qumBlueprint };
            await this.semanticModelService.saveSemanticModel({ uuid, metadata: unifiedModel, visualModel: [], status: SemanticModelStatus.ACTIVE });
        } catch (error: any) {
            this.loggerService.error("[Unified Model] Error generating unified model:", error.message);
        }
    }
}
