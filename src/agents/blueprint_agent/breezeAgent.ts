// import { generateJsonWithConversation, __LLM_PLATFORM } from "../../services/llm";
// import * as fs from "fs";

// const __BLUEPRINT_PROMPT__ = fs.readFileSync("./agents/blueprint_agent/BREEZE_EXTRACTOR_PROMPT.md", "utf8");
// const __MAPPER_PROMPT__ = fs.readFileSync("./agents/blueprint_agent/SCENARIO_BLUEPRINT_MAPPER.md", "utf8");

// type LinkedComponents = {
//     entity_microservices: string[];
//     workflow_services: string[];
//     external_integrations: string[];
// };

// type ScenarioMapper = {
//     scenarios: { scenario: string; linked_components: LinkedComponents }[];
// };

// type Blueprint = {
//     entity_microservices: { name: string; qum?: string[] }[];
//     workflow_services: { process: string; qum?: string[] }[];
//     external_integrations: { name: string; qum?: string[] }[];
// };

// const mapScenarioWithBlueprint = (scenarioMapper: ScenarioMapper, blueprint: Blueprint): Blueprint => {
//     const { scenarios } = scenarioMapper;
//     scenarios.forEach(({ scenario, linked_components }) => {
//         blueprint.entity_microservices.forEach(ms => {
//             if (linked_components.entity_microservices.includes(ms.name)) {
//                 ms.qum = ms.qum || [];
//                 ms.qum.push(scenario);
//             }
//         });
//         blueprint.workflow_services.forEach(ws => {
//             if (linked_components.workflow_services.includes(ws.process)) {
//                 ws.qum = ws.qum || [];
//                 ws.qum.push(scenario);
//             }
//         });
//         blueprint.external_integrations.forEach(ei => {
//             if (linked_components.external_integrations.includes(ei.name)) {
//                 ei.qum = ei.qum || [];
//                 ei.qum.push(scenario);
//             }
//         });
//     });
//     return blueprint;
// };

// const generateBreezeSpec = async (scenarios: string[], context: string): Promise<any> => {
//     const placeholders = {
//         __CONTEXT__: context,
//         __SCENARIOS__: scenarios.map(x => `- ${x}`).join("\n")
//     };
//     return generateJsonWithConversation(__BLUEPRINT_PROMPT__, placeholders, __LLM_PLATFORM.OPENAI_MATURE);
// };

// const linkQumWithBreezeSpec = async (scenarios: string[], blueprint: Blueprint): Promise<any> => {
//     const placeholders = {
//         __BLUEPRINT__: JSON.stringify(blueprint),
//         __SCENARIOS__: JSON.stringify(scenarios)
//     };
//     return generateJsonWithConversation(__MAPPER_PROMPT__, placeholders, __LLM_PLATFORM.OPENAI);
// };

// export { generateBreezeSpec };
