import * as fs from "fs";
import { Inject, Service } from "typedi";
import { LlmService } from "../../services/llm.service";
import { LLM_PLATFORM } from "../../enums";

const __PERSONAS_PROMPT__ = fs.readFileSync("./src/agents/qum_agent/PERSONA_EXTRACTOR_PROMPT.md", "utf8");
const __BUSINESS_PROMPT__ = fs.readFileSync("./src/agents/qum_agent/QUM_BUSINESS_SPEC_AGENT_PROMPT.md", "utf8");
const __DESIGN_PROMPT__ = fs.readFileSync("./src/agents/qum_agent/QUM_DESIGN_SPEC_AGENT_PROMPT.md", "utf8");

interface PersonaExtractorAgentResp {
    persona: string
    outcomes: string[]
}

export interface PersonaResp {
    persona: string
    outcomes?: OutecomeReps[]
}

interface OutecomeReps {
    outcome: string
    scenarios?: ScenarioResp[]
    citations?: CitationResp[]
}

interface CitationResp {
    documentName: string
    documentId: string
}

export interface ScenarioResp {
    scenario: string
    description?: string
    metadataShapeName?: string
    steps?: StepResp[]
}

export interface QumBusinessSpecAgenResp {
    qum_business?: {
        personas?: PersonaResp[]
    }
}

interface ActionResp {
    action: string
}

interface StepResp {
    step: string
    actions?: ActionResp[]
    citations?: CitationResp[]
}

export interface QumDesignSpecAgentResp {
    qum_design?: {
        scenarios?: ScenarioResp[]
    }
}


@Service()
export class QUMAgent {

    @Inject(() => LlmService)
    private readonly llmService: LlmService

    private async extractPersonas(context: string[]): Promise<{ personas: PersonaExtractorAgentResp[] }> {
        // const placeholders = { __CONTEXT__: context };
        return await this.llmService.generateJsonSequentially(context, __PERSONAS_PROMPT__, {}, LLM_PLATFORM.OPENAI);
    }

    public async generateQUMBusinessSpec(context: string[]): Promise<QumBusinessSpecAgenResp> {
        const personas = await this.extractPersonas(context);
        const placeholders = {
            // __CONTEXT__: context,
            __PERSONAS__: JSON.stringify(personas),
        };
        return await this.llmService.generateJsonSequentially(context, __BUSINESS_PROMPT__, placeholders, LLM_PLATFORM.OPENAI_MATURE);
    }

    public async generateQUMDesignSpec(scenarios: string, context: string[]): Promise<QumDesignSpecAgentResp> {
        const placeholders = {
            // __CONTEXT__: context,
            __SCENARIOS__: scenarios,
        };
        return await this.llmService.generateJsonSequentially(context, __DESIGN_PROMPT__, placeholders, LLM_PLATFORM.OPENAI);
    }
}
