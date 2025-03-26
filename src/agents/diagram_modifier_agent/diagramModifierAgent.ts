// import { __LLM_PLATFORM, generateJsonWithConversation, generateMultiModel } from "../../services/llm";
// import { fetchChatHistory, saveChatContext } from "../../services/chat_service";
import shapes from "../../configs/shapesv3.json";
import ShapeManager from "../shapesManager";
import { getShapeDetailsFromMaster, normalizeIsometricMetadata, cleanIsometricMetadata } from "../helpers";
import fs from "fs";
import { LlmService } from "../../services/llm.service";
import { Inject, Service } from "typedi";
import { LoggerService } from "../../services/logger.service";
import { LLMConversationService } from "../../services/llm_conversation.service";
import { LLM_PLATFORM } from "../../enums";

const __DIAGRAM_MODIFIER_AGENT_PROMPT__ = fs.readFileSync("./src/agents/diagram_modifier_agent/DIAGRAM_MODIFIER_AGENT_PROMPT.md", "utf8");
const __LAYERS__ = Object.keys(shapes["layers"]).map(x => `"${x}"`).join(",");
const __COMPONENTS__ = Object.keys(shapes["components"]).map(x => `"${x}"`).join(",");
const __3DSHAPES__ = Object.keys(shapes["3dshapes"]).map(x => `"${x}"`).join(",");
const __2DSHAPES__ = Object.keys(shapes["2dshapes"]).map(x => `"${x}"`).join(",");

@Service()
export class DiagramModifierAgent {

    @Inject(() => LlmService)
    private readonly llmService: LlmService

    @Inject(() => LoggerService)
    private readonly loggerService: LoggerService

    @Inject(() => LLMConversationService)
    private readonly llmConversationService: LLMConversationService

    private prompt: string;

    constructor() {
        this.prompt = __DIAGRAM_MODIFIER_AGENT_PROMPT__;
    }

    private async fetchOldConversationContext(uuid: string) {
        if (!uuid) return { conversations: [] };
        const oldHistory = await this.llmConversationService.fetchChatHistory("chat-" + uuid);
        return { conversations: oldHistory?.conversations ? JSON.parse(oldHistory.conversations) : [] };
    }

    private manipulateJson(agent2_result: any, metadata: any) {
        const manager = new ShapeManager(metadata);
        let { action, id, shapeName, position, relativeTo: relativeTo3dShapeId, name, decorator } = agent2_result;
        let shapeType = null;
        if (action === "addLayer") {
            shapeType = 'LAYER';
            action = 'add';
        }
        if (action === "addComponent") {
            shapeType = 'COMPONENT';
            action = 'add';
        }
        if (action === "add3D") {
            shapeType = '3D';
            action = 'add';
        }
        if (action === "addDecorator") {
            shapeType = '2D';
            action = 'add';
        }
        if (action === "moveDecorator") {
            shapeType = '2D';
            action = 'move';
        }
        if (action === "move" || action === "remove") {
            shapeType = '3D';
        }
        if (action === "removeDecorator") {
            shapeType = '2D';
            action = 'remove';
        }
        if (shapeName) {
            //pass decorator
            const valid = getShapeDetailsFromMaster(decorator ? decorator : shapeName);
            shapeName = valid.name;
            shapeType = valid.type;
            if (valid.decorator && !decorator) {
                decorator = valid.decorator;
            }
        }
        switch (action) {
            case "add":
                switch (shapeType) {
                    case "3D":
                    case "COMPONENT":
                    case "LAYER":
                        manager.addShape(relativeTo3dShapeId, shapeName, shapeType, name, position, decorator);
                        break;
                    case "2D":
                        manager.add2DShape(relativeTo3dShapeId, decorator);
                        break;
                    default:
                        break;
                }
                break;
            case "remove":
                switch (shapeType) {
                    case "3D":
                    case "COMPONENT":
                    case "LAYER":
                        manager.remove3DShape(id)
                        break;
                    case "2D":
                        manager.remove2DShape(relativeTo3dShapeId, decorator)
                        break;
                    default:
                        break;
                }
                break;
            case "move":
                switch (shapeType) {
                    case "3D":
                    case "COMPONENT":
                    case "LAYER":
                        manager.move3DShape(id, relativeTo3dShapeId, position)
                        break;
                    case "2D":
                        manager.move2DShape(id, decorator, relativeTo3dShapeId)
                        break;
                    default:
                        break;
                }
                break;
            case "rename":
                manager.rename(id, name);
                break;
            default:
                break;
        }
        return manager.getAll();
    }

    private processAgent2Payload(agent2_actions: any[], current_metadata: any) {
        let updated_metadata = null;
        for (const agent2_result of agent2_actions) {
            if (agent2_result.action && ["undo", "redo"].indexOf(agent2_result.action) === -1) {
                updated_metadata = this.manipulateJson(agent2_result, updated_metadata || current_metadata);
            } else {
                throw new Error("Undo/Redo operations not supported yet. Please use the Undo/Redo action on Canvas instead");
            }
        }
        return updated_metadata;
    }

    private async processAgent2(conversations: any[], question: string, metadata: any) {
        const normalizedMetadata = normalizeIsometricMetadata(metadata);
        const placeholders = {
            question, conversations,
            _CURRENT_METADATA_: JSON.stringify(normalizedMetadata),
            __3DSHAPES__, __2DSHAPES__, __LAYERS__, __COMPONENTS__
        };
        const response = await this.llmService.generateJsonWithConversation(this.prompt, placeholders, LLM_PLATFORM.OPENAI_MATURE);
        conversations.push(question, JSON.stringify(response));
        return response;
    }

    public async processDiagramModifierAgent(question: string, currentState: any[] = [], uuid: string) {
        const chat_uuid = "diagram_modifier_" + uuid;
        const { conversations } = await this.fetchOldConversationContext(chat_uuid);
        const current_metadata = cleanIsometricMetadata(currentState);
        const agent2_result = await this.processAgent2(conversations, question, current_metadata);
        this.loggerService.info("[Agent] Diagram modifier agent:", agent2_result);
        let agent2_metadata_result;
        let errorFeedback: string | false = false;
        try {
            agent2_metadata_result = this.processAgent2Payload(agent2_result, current_metadata);
        } catch (error: any) {
            errorFeedback = error.message;
        }
        if (uuid) {
            await this.llmConversationService.saveChatContext({ key: "chat-" + chat_uuid, context: '', metadata: '', conversations: JSON.stringify(conversations) });
        }
        return {
            feedback: errorFeedback || "Processed!",
            action: agent2_result,
            result: agent2_metadata_result,
            needFeedback: Boolean(errorFeedback)
        };
    }
}
