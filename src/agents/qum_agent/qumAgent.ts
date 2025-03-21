import * as fs from "fs";
import { Inject, Service } from "typedi";
import { LlmService } from "../../services/llm.service";
import { LLM_PLATFORM } from "../../enums";

const __PERSONAS_PROMPT__ = fs.readFileSync("./src/agents/qum_agent/PERSONA_EXTRACTOR_PROMPT.md", "utf8");
const __BUSINESS_PROMPT__ = fs.readFileSync("./src/agents/qum_agent/QUM_BUSINESS_SPEC_AGENT_PROMPT.md", "utf8");
const __DESIGN_PROMPT__ = fs.readFileSync("./src/agents/qum_agent/QUM_DESIGN_SPEC_AGENT_PROMPT.md", "utf8");

@Service()
export class QUMAgent {

    @Inject(() => LlmService)
    private readonly llmService: LlmService

    private async extractPersonas(context: string): Promise<any> {
        const placeholders = { __CONTEXT__: context };
        return await this.llmService.generateJsonWithConversation(__PERSONAS_PROMPT__, placeholders, LLM_PLATFORM.OPENAI);
    }

    public async generateQUMBusinessSpec(context: string): Promise<any> {
        const personas = await this.extractPersonas(context);
        const placeholders = {
            __CONTEXT__: context,
            __PERSONAS__: JSON.stringify(personas),
        };
        return await this.llmService.generateJsonWithConversation(__BUSINESS_PROMPT__, placeholders, LLM_PLATFORM.OPENAI_MATURE);
    }

    public async generateQUMDesignSpec(scenarios: string, context: string): Promise<any> {
        const placeholders = {
            __CONTEXT__: context,
            __SCENARIOS__: scenarios,
        };
        return await this.llmService.generateJsonWithConversation(__DESIGN_PROMPT__, placeholders, LLM_PLATFORM.OPENAI);
    }
}
