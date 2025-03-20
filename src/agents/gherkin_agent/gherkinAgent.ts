// import { getSemanticModelByUUID, saveSemanticModel } from "../../services/isometricQuery";
// import { generateJsonWithConversation, __LLM_PLATFORM } from "../../services/llm";
// import * as fs from "fs";

// const __GHERKIN_PROMPT__ = fs.readFileSync("./agents/gherkin_agent/GHERKIN_SCRIPT_AGENT.md", "utf8");

// interface Scenario {
//     title: string;
//     steps: string[];
// }

// interface Outcome {
//     scenarios: Scenario[];
// }

// interface Persona {
//     outcomes: Outcome[];
// }

// interface SemanticModel {
//     metadata?: {
//         qum?: Persona[];
//         gherkin?: any;
//     };
//     visualModel?: any;
//     status?: string;
// }

// const generateGherkinScriptFromScenario = async (context: string, question: string): Promise<any> => {
//     const placeholders = {
//         __CONTEXT__: context,
//         question: question
//     };
//     return await generateJsonWithConversation(__GHERKIN_PROMPT__, placeholders, __LLM_PLATFORM.OPENAI);
// };

// const extractScenariosNested = (personas?: Persona[]): Scenario[] => {
//     const out: Scenario[] = [];
//     if (!personas) return out;

//     for (const persona of personas) {
//         for (const outcome of persona.outcomes) {
//             out.push(...outcome.scenarios);
//         }
//     }
//     return out;
// };

// const getGherkinScript = async (uuid: string, question: string): Promise<any> => {
//     const semanticModel: SemanticModel | null = await getSemanticModelByUUID(uuid);
//     if (!semanticModel) {
//         throw new Error(`Semantic model not found for UUID: ${uuid}`);
//     }

//     const extractedScenarios = extractScenariosNested(semanticModel.metadata?.qum);
//     const gherkinScript = await generateGherkinScriptFromScenario(JSON.stringify(extractedScenarios), question);

//     global.logger.info(`[Unified Model] Gherkin Script generated for ${uuid}`);

//     await saveSemanticModel(uuid, {
//         metadata: { ...semanticModel.metadata, gherkin: gherkinScript },
//         visualModel: semanticModel.visualModel,
//         status: semanticModel.status
//     });

//     return gherkinScript;
// };

// export { generateGherkinScriptFromScenario, getGherkinScript };
