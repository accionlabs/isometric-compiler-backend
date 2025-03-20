// import { generateJsonWithConversation, __LLM_PLATFORM } from "../../services/llm";
// import * as fs from "fs";

// const __PERSONAS_PROMPT__ = fs.readFileSync("./agents/qum_agent/PERSONA_EXTRACTOR_PROMPT.md", "utf8");
// const __BUSINESS_PROMPT__ = fs.readFileSync("./agents/qum_agent/QUM_BUSINESS_SPEC_AGENT_PROMPT.md", "utf8");
// const __DESIGN_PROMPT__ = fs.readFileSync("./agents/qum_agent/QUM_DESIGN_SPEC_AGENT_PROMPT.md", "utf8");

// const extractPersonas = async (context: string): Promise<any> => {
//     const placeholders = {
//         __CONTEXT__: context
//     };
//     return await generateJsonWithConversation(__PERSONAS_PROMPT__, placeholders, __LLM_PLATFORM.OPENAI);
// };

// const generateQUMBusinessSpec = async (context: string): Promise<any> => {
//     const personas = await extractPersonas(context);
//     const placeholders = {
//         __CONTEXT__: context,
//         __PERSONAS__: JSON.stringify(personas)
//     };
//     return await generateJsonWithConversation(__BUSINESS_PROMPT__, placeholders, __LLM_PLATFORM.OPENAI_MATURE);
// };

// const generateQUMDesignSpec = async (scenarios: string, context: string): Promise<any> => {
//     const placeholders = {
//         __CONTEXT__: context,
//         __SCENARIOS__: scenarios
//     };
//     return await generateJsonWithConversation(__DESIGN_PROMPT__, placeholders, __LLM_PLATFORM.OPENAI);
// };

// export { generateQUMBusinessSpec, generateQUMDesignSpec };
