import { z } from "zod";
import { normalizeIsometricMetadata } from "../helpers";
import { zodToJsonSchema } from "zod-to-json-schema";
import fs from "fs";
import { Inject, Service } from "typedi";
import { LlmService } from "../../services/llm.service";
import { PgVectorService } from "../../services/pgVector.service";
import { LLM_PLATFORM } from "../../enums";

const __GENERAL_QUERY_PROMPT__ = fs.readFileSync("./src/agents/general_query_agent/GENERAL_QUERY_AGENT.md", "utf8");

type GeneralQueryResult = {
    answer: string;
    citations: string[];
};

@Service()
export class GeneralQueryAgent {
    @Inject(() => LlmService)
    private readonly llmService: LlmService

    @Inject(() => PgVectorService)
    private readonly pgVectorService: PgVectorService

    private prompt: string;

    constructor() {
        this.prompt = __GENERAL_QUERY_PROMPT__;
    }

    public async generalQuery(query: string, currentState: any, uuid: string): Promise<string | null> {
        const documents = await this.pgVectorService.vectorSearch(query, { uuid });
        let context = documents.map(x => `\n\n---\n${x.pageContent}`).join("");

        const schema = z.object({
            answer: z.string(),
            citations: z.array(z.string()).describe("Citations of the documents referred"),
        });

        const placeholders = {
            __CONTEXT__: context,
            __JSON_SCHEMA__: JSON.stringify(zodToJsonSchema(schema)),
            question: query,
            __CURRENT_STATE__: JSON.stringify(normalizeIsometricMetadata(currentState)),
        };

        const result: GeneralQueryResult = await this.llmService.generateJsonWithConversation(this.prompt, placeholders, LLM_PLATFORM.OPENAI);
        return result.answer;
    }
}
