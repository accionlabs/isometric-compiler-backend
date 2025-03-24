
import { Inject, Service } from 'typedi';
import { LlmService } from '../../services/llm.service';
import { LLM_PLATFORM } from '../../enums';
import * as fs from "fs";

const __BLUEPRINT_PROMPT__ = fs.readFileSync("./src/agents/blueprint_agent/BREEZE_EXTRACTOR_PROMPT.md", "utf8");


@Service()
export class BreezeExtractorAgent {

    @Inject(() => LlmService)
    private readonly llmService: LlmService

    public async generateBreezeSpec(scenarios: string[], context: string): Promise<any> {
        const placeholders = {
            __CONTEXT__: context,
            __SCENARIOS__: scenarios.map(x => `- ${x}`).join("\n")
        };
        return this.llmService.generateJsonWithConversation(__BLUEPRINT_PROMPT__, placeholders, LLM_PLATFORM.OPENAI_MATURE);
    };
}
