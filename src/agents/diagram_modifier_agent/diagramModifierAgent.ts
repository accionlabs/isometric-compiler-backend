// import { __LLM_PLATFORM, generateJsonWithConversation } from "../../services/llm";
// import { fetchChatHistory, saveChatContext } from "../../services/chat_service";
// import shapes from "../../config/shapesv3.json";
// import ShapeManager from "../shapesManager";
// import { getShapeDetailsFromMaster, normalizeIsometricMetadata, cleanIsometricMetadata } from "../helpers";
// import * as fs from "fs";

// const __DIAGRAM_MODIFIER_AGENT_PROMPT__ = fs.readFileSync("./agents/diagram_modifier_agent/DIAGRAM_MODIFIER_AGENT_PROMPT.md", "utf8");
// const __LAYERS__ = Object.keys(shapes.layers).map(x => `"${x}"`).join(",");
// const __COMPONENTS__ = Object.keys(shapes.components).map(x => `"${x}"`).join(",");
// const __3DSHAPES__ = Object.keys(shapes["3dshapes"]).map(x => `"${x}"`).join(",");
// const __2DSHAPES__ = Object.keys(shapes["2dshapes"]).map(x => `"${x}"`).join(",");

// interface AgentAction {
//     action: string;
//     id?: string;
//     shapeName?: string;
//     position?: string;
//     relativeTo?: string;
//     name?: string;
//     decorator?: string;
// }

// const fetchOldConversationContext = async (uuid: string | null): Promise<{ conversations: any[] }> => {
//     if (!uuid) return { conversations: [] };
    
//     const oldHistory = await fetchChatHistory(`chat-${uuid}`);
//     const conversations = oldHistory?.conversations ? JSON.parse(oldHistory.conversations) : [];
    
//     return { conversations };
// };

// const manipulateJson = (agent2_result: AgentAction, metadata: any) => {
//     const manager = new ShapeManager(metadata);
//     let { action, id, shapeName, position, relativeTo: relativeTo3dShapeId, name, decorator } = agent2_result;
//     let shapeType: string | null = null;

//     if (action === "addLayer") shapeType = "LAYER", action = "add";
//     if (action === "addComponent") shapeType = "COMPONENT", action = "add";
//     if (action === "add3D") shapeType = "3D", action = "add";
//     if (action === "addDecorator") shapeType = "2D", action = "add";
//     if (action === "moveDecorator") shapeType = "2D", action = "move";
//     if (action === "move" || action === "remove") shapeType = "3D";
//     if (action === "removeDecorator") shapeType = "2D", action = "remove";

//     if (shapeName) {
//         const valid = getShapeDetailsFromMaster(decorator || shapeName);
//         shapeName = valid.name;
//         shapeType = valid.type;
//         if (valid.decorator && !decorator) {
//             decorator = valid.decorator;
//         }
//     }

//     switch (action) {
//         case "add":
//             switch (shapeType) {
//                 case "3D":
//                 case "COMPONENT":
//                 case "LAYER":
//                     manager.addShape(relativeTo3dShapeId, shapeName!, shapeType, name, position, decorator);
//                     break;
//                 case "2D":
//                     manager.add2DShape(relativeTo3dShapeId!, decorator!);
//                     break;
//             }
//             break;
//         case "remove":
//             switch (shapeType) {
//                 case "3D":
//                 case "COMPONENT":
//                 case "LAYER":
//                     manager.remove3DShape(id!);
//                     break;
//                 case "2D":
//                     manager.remove2DShape(relativeTo3dShapeId!, decorator!);
//                     break;
//             }
//             break;
//         case "move":
//             switch (shapeType) {
//                 case "3D":
//                 case "COMPONENT":
//                 case "LAYER":
//                     manager.move3DShape(id!, relativeTo3dShapeId!, position!);
//                     break;
//                 case "2D":
//                     manager.move2DShape(id!, decorator!, relativeTo3dShapeId!);
//                     break;
//             }
//             break;
//         case "rename":
//             manager.rename(id!, name!);
//             break;
//     }
    
//     return manager.getAll();
// };

// const processAgent2Payload = (agent2_actions: AgentAction[], current_metadata: any) => {
//     let updated_metadata = current_metadata;
    
//     for (const agent2_result of agent2_actions) {
//         if (agent2_result.action && ["undo", "redo"].indexOf(agent2_result.action) === -1) {
//             updated_metadata = manipulateJson(agent2_result, updated_metadata);
//         } else {
//             throw new Error("Undo/Redo operations not supported yet. Please use the Undo/Redo action on Canvas instead");
//         }
//     }
    
//     return updated_metadata;
// };

// const processAgent2 = async (conversations: any[], question: string, metadata: any) => {
//     const normalizedMetadata = normalizeIsometricMetadata(metadata);
    
//     const placeholders = {
//         question,
//         conversations,
//         _CURRENT_METADATA_: JSON.stringify(normalizedMetadata),
//         __3DSHAPES__,
//         __2DSHAPES__,
//         __LAYERS__,
//         __COMPONENTS__
//     };

//     const response = await generateJsonWithConversation(__DIAGRAM_MODIFIER_AGENT_PROMPT__, placeholders, __LLM_PLATFORM.OPENAI_MATURE);
    
//     conversations.push(question);
//     conversations.push(JSON.stringify(response));

//     return response;
// };

// const processDiagramModifierAgent = async (question: string, currentState: any[] = [], uuid: string) => {
//     const chat_uuid = `diagram_modifier_${uuid}`;
//     const { conversations } = await fetchOldConversationContext(chat_uuid);
//     const current_metadata = cleanIsometricMetadata(currentState);

//     let agent2_result;
//     try {
//         agent2_result = await processAgent2(conversations, question, current_metadata);
//     } catch (error) {
//         return {
//             feedback: error.message,
//             action: null,
//             result: null,
//             needFeedback: true
//         };
//     }

//     global.logger.info("[Agent] Diagram modifier agent:", agent2_result);

//     let agent2_metadata_result;
//     let errorFeedback: string | boolean = false;

//     try {
//         agent2_metadata_result = processAgent2Payload(agent2_result, current_metadata);
//     } catch (error) {
//         errorFeedback = error.message;
//     }

//     if (uuid) {
//         await saveChatContext(`chat-${chat_uuid}`, { context: "", metadata: "", conversations: JSON.stringify(conversations) });
//     }

//     return {
//         feedback: errorFeedback || "Processed!",
//         action: agent2_result,
//         result: agent2_metadata_result,
//         needFeedback: Boolean(errorFeedback)
//     };
// };

// export { processDiagramModifierAgent };
