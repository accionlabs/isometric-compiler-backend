// import { generateQUMBusinessSpec, generateQUMDesignSpec } from './qum_agent/qumAgent';
// import { vectorSearch } from '../services/isomtericPgVector';
// import { extractScenarios } from './helpers';
// import { saveSemanticModel } from '../services/isometricQuery';
// import { SemanticModelStatus } from '../config/isometric_db';
// import { getCache } from './cache';

// // Define Interfaces
// interface Scenario {
//     scenario: string;
//     steps?: any[];
// }

// interface Outcome {
//     scenarios: Scenario[];
// }

// interface Persona {
//     outcomes: Outcome[];
// }

// interface BusinessSpec {
//     qum_business?: {
//         personas: Persona[];
//     };
// }

// interface DesignSpec {
//     qum_design?: {
//         scenarios: Scenario[];
//     };
// }

// // Helper Function
// const getDesignSpec = (scenario: string, design?: Scenario[]): any[] => {
//     for (let i = 0; i < (design?.length ?? 0); i++) {
//         if (scenario.toLowerCase() === design![i].scenario.toLowerCase()) {
//             return design![i].steps ?? [];
//         }
//     }
//     return [];
// };

// // Merges Business and Design Specifications
// const mergeBusinessDesignSpec = (business: BusinessSpec, design: DesignSpec): Persona[] | undefined => {
//     const personas = business?.qum_business?.personas;
//     if (!personas) return undefined;

//     for (const persona of personas) {
//         for (const outcome of persona.outcomes) {
//             for (const scenario of outcome.scenarios) {
//                 scenario.steps = getDesignSpec(scenario.scenario, design?.qum_design?.scenarios);
//             }
//         }
//     }
//     return personas;
// };

// // Main Function: Regenerate Unified Model
// export const regenerateUnifiedModel = async (uuid: string, filename: string): Promise<void> => {
//     const cache = await getCache(filename);
//     if (cache !== null) {
//         await saveSemanticModel(uuid, { metadata: cache, visualModel: [], status: SemanticModelStatus.ACTIVE });
//         return;
//     }

//     try {
//         let context = '';
//         await saveSemanticModel(uuid, { metadata: {}, visualModel: [], status: SemanticModelStatus.INITIATED });

//         const documents = await vectorSearch("", { uuid });
//         documents.forEach((x: any) => (context += `\n\n---\n${x.pageContent}`));

//         await saveSemanticModel(uuid, { metadata: {}, visualModel: [], status: SemanticModelStatus.GENERATING_BUSINESS_SPEC });

//         const businessSpec: BusinessSpec = await generateQUMBusinessSpec(context);
//         global.logger.info(`[Unified Model] QUM Business SPEC generated for ${uuid}`);

//         const scenarios = extractScenarios(businessSpec?.qum_business?.personas);
//         global.logger.info(`[Unified Model] QUM Scenarios SPEC generated for ${uuid}`);

//         await saveSemanticModel(uuid, { metadata: {}, visualModel: [], status: SemanticModelStatus.GENERATING_QUM_DESIGN_SPEC });

//         const designSpec: DesignSpec = await generateQUMDesignSpec(JSON.stringify(scenarios), context);
//         global.logger.info(`[Unified Model] QUM Design SPEC generated for ${uuid}`);

//         const qumBlueprint = mergeBusinessDesignSpec(businessSpec, designSpec) ?? [];

//         const unifiedModel = {
//             qum: qumBlueprint
//         };

//         await saveSemanticModel(uuid, { metadata: unifiedModel, visualModel: [], status: SemanticModelStatus.ACTIVE });
//     } catch (error: any) {
//         global.logger.error("[Unified Model] Error generating unified model:", error.message);
//     }
// };
