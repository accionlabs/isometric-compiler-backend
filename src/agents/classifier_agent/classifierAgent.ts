// import { __LLM_PLATFORM, generateJsonWithConversation } from "../../services/llm";
// import { fetchChatHistory, saveChatContext } from "../../services/chat_service";
import { StructuredOutputParser } from "langchain/output_parsers";
import * as fs from "fs";
import { Inject, Service } from "typedi";
import { ChatService } from "../../services/chat.service";
import { LlmService } from "../../services/llm.service";
import { LLM_PLATFORM } from "../../enums";

const __CLASSIFIER_PROMPT__ = fs.readFileSync("./src/agents/classifier_agent/CLASSIFIER_AGENT_PROMPT.md", "utf8");

@Service()
class ClassifierAgentService {
    private classifierPrompt: string;

    @Inject(() => LlmService)
    private readonly llmService: LlmService

    @Inject(() => ChatService)
    private readonly chatService: ChatService

    constructor() {
        this.classifierPrompt = __CLASSIFIER_PROMPT__;
    }

    private async fetchOldConversationContext(uuid?: string): Promise<string[]> {
        if (!uuid) {
            return [];
        }
        const oldHistory = await this.chatService.fetchChatHistory("chat-" + uuid);
        let conversations = oldHistory?.conversations;
        return conversations && conversations.length > 0 ? JSON.parse(conversations) : [];
    }

    public async processClassifierAgent(question: string, availableDocuments: string[] = [], newDocument: string, uuid?: string): Promise<any> {
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
            await saveChatContext("chat-" + uuid, { context: "", metadata: "", conversations: JSON.stringify(conversations) });
        }
        return result;
    }
}

export default ClassifierAgentService;
