import { LLM_PLATFORM } from "../../enums";
import { LlmService } from "../../services/llm.service";
import * as fs from "fs";
import { SemanticModelService } from "../../services/semanticModel.service";
import { Inject, Service } from "typedi";
import { LoggerService } from "../../services/logger.service";

const __GHERKIN_PROMPT__ = fs.readFileSync("./src/agents/gherkin_agent/GHERKIN_SCRIPT_AGENT.md", "utf8");

interface Scenario {
    title: string;
    steps: string[];
}

interface Outcome {
    scenarios: Scenario[];
}

interface Persona {
    outcomes: Outcome[];
}

interface SemanticModel {
    metadata?: {
        qum?: Persona[];
        gherkin?: any;
    };
    visualModel?: any;
    status?: string;
}

@Service()
class GherkinScriptService {
    private gherkinPrompt: string;

    @Inject(() => LlmService)
    private readonly llmService: LlmService

    @Inject(() => SemanticModelService)
    private readonly semanticModelService: SemanticModelService

    @Inject(() => LoggerService)
    private readonly loggerService: LoggerService

    constructor() {
        this.gherkinPrompt = __GHERKIN_PROMPT__;
    }

    private extractScenariosNested(personas?: Persona[]): Scenario[] {
        const scenarios: Scenario[] = [];
        if (!personas) return scenarios;

        for (const persona of personas) {
            for (const outcome of persona.outcomes) {
                scenarios.push(...outcome.scenarios);
            }
        }
        return scenarios;
    }

    private async generateGherkinScriptFromScenario(context: string, question: string): Promise<any> {
        const placeholders = {
            __CONTEXT__: context,
            question: question
        };
        return await this.llmService.generateJsonWithConversation(this.gherkinPrompt, placeholders, LLM_PLATFORM.OPENAI);
    }

    public async getGherkinScript(uuid: string, question: string): Promise<any> {
        const semanticModel: SemanticModel | null = await this.semanticModelService.findByUuid(uuid);
        if (!semanticModel) {
            throw new Error(`Semantic model not found for UUID: ${uuid}`);
        }

        const extractedScenarios = this.extractScenariosNested(semanticModel.metadata?.qum);
        const gherkinScript = await this.generateGherkinScriptFromScenario(JSON.stringify(extractedScenarios), question);

        this.loggerService.info(`[Unified Model] Gherkin Script generated for ${uuid}`);

        await this.semanticModelService.saveSemanticModel({
            uuid,
            metadata: { ...semanticModel.metadata, gherkin: gherkinScript },
            visualModel: semanticModel.visualModel,
            // status: semanticModel.status
        });

        return gherkinScript;
    }
}

export default GherkinScriptService;
