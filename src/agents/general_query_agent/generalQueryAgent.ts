// import { z } from "zod";
// import { generateJsonWithConversation, __LLM_PLATFORM } from "../../services/llm";
// import { vectorSearch } from "../../services/isomtericPgVector";
// import { normalizeIsometricMetadata } from "../helpers";
// import { zodToJsonSchema } from "zod-to-json-schema";
// import * as fs from "fs";

// const __GENERAL_QUERY_PROMPT__ = fs.readFileSync("./agents/general_query_agent/GENERAL_QUERY_AGENT.md", "utf8");

// interface GeneralQueryResult {
//     answer: string;
//     citations: string[];
// }

// const generalQuery = async (query: string, currentState: any[], uuid: string): Promise<string> => {
//     const documents = await vectorSearch(query, { uuid });
    
//     let context = "";
//     documents.forEach(x => {
//         context += "\n\n---\n" + x.pageContent;
//     });

//     const schema = z.object({
//         answer: z.string(),
//         citations: z.array(z.string()).describe("Citations of the documents referred"),
//     });

//     const placeholders = {
//         __CONTEXT__: context,
//         __JSON_SCHEMA__: JSON.stringify(zodToJsonSchema(schema)),
//         question: query,
//         __CURRENT_STATE__: JSON.stringify(normalizeIsometricMetadata(currentState)),
//     };

//     const result: GeneralQueryResult = await generateJsonWithConversation(__GENERAL_QUERY_PROMPT__, placeholders, __LLM_PLATFORM.OPENAI);
    
//     return result.answer;
// };

// export { generalQuery };
