import * as fs from "fs";
import { Inject, Service } from "typedi";
import { LlmService } from "../../services/llm.service";
import { LLM_PLATFORM } from "../../enums";
import { LLMConversationService } from "../../services/llm_conversation.service";

const __CLASSIFIER_PROMPT__ = fs.readFileSync("./src/agents/classifier_agent/CLASSIFIER_AGENT_PROMPT.md", "utf8");

interface ClassifierAgentResp {
    transformedQuery: string
    isDiagramCreationQuery: boolean
    isDiagramModifyQuery: boolean
    isGeneralQuery: boolean
    isEmailQuery: boolean
    isGherkinScriptQuery: boolean
    email: string
    documentReferences: string[],
    feedback: string
}

@Service()
export class ClassifierAgent {
    private classifierPrompt: string;

    @Inject(() => LlmService)
    private readonly llmService: LlmService

    @Inject(() => LLMConversationService)
    private readonly llmConversationService: LLMConversationService

    constructor() {
        this.classifierPrompt = __CLASSIFIER_PROMPT__;
    }

    private async fetchOldConversationContext(uuid?: string): Promise<string[]> {
        if (!uuid) {
            return [];
        }
        const oldHistory = await this.llmConversationService.fetchChatHistory("chat-" + uuid);
        let conversations = oldHistory?.conversations;
        return conversations && conversations.length > 0 ? JSON.parse(conversations) : [];
    }

    public async processClassifierAgent(question: string, availableDocuments: string[], newDocument: string, uuid?: string): Promise<ClassifierAgentResp> {
        const conversations = await this.fetchOldConversationContext(uuid);
        const placeholders = {
            conversations: conversations,
            uploadedDocuments: availableDocuments.map(x => `"${x}"`).join(","),
            uploadedFile: newDocument,
            question: question
        };

        const result = await this.llmService.generateJsonWithConversation(this.classifierPrompt, placeholders, LLM_PLATFORM.OPENAI);

        if (uuid) {
            conversations.push(question);
            conversations.push(JSON.stringify(result));
            await this.llmConversationService.saveChatContext({ key: "chat-" + uuid, context: "", metadata: "", conversations: JSON.stringify(conversations) });
        }
        return result;
    }
}
