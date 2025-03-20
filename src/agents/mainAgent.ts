// import { getDocumentByUUID } from '../services/isometricQuery';
// import { processClassifierAgent } from './classifier_agent/classifierAgent';
// import { processDiagramModifierAgent } from './diagram_modifier_agent/diagramModifierAgent';
// import { generateIsometricJSONFromBlueprint, generateIsometricJSONFromImage } from './diagram_generator_agent/diagramGeneratorAgent';
// import { generalQuery } from './general_query_agent/generalQueryAgent';
// import { getGherkinScript } from './gherkin_agent/gherkinAgent';

// interface File {
//     originalname?: string;
//     mime?: string;
//     buffer?: Buffer;
// }

// interface DocumentDetail {
//     metadata: { filename: string };
// }

// interface ClassifierResult {
//     feedback: string;
//     isEmailQuery?: boolean;
//     email?: string;
//     isGherkinScriptQuery?: boolean;
//     isDiagramCreationQuery?: boolean;
//     documentReferences?: string[];
//     transformedQuery?: string;
//     isGeneralQuery?: boolean;
//     isDiagramModifyQuery?: boolean;
// }

// interface DefaultResponse {
//     feedback: string;
//     action: any[];
//     result: any;
//     needFeedback: boolean;
//     isEmailQuery?: boolean;
//     email?: string;
//     isGherkinScriptQuery?: boolean;
// }

// const getImage = (documents: string | string[]): string | null => {
//     if (typeof documents === 'string') {
//         documents = [documents];
//     }
//     for (const doc of documents) {
//         if (doc?.match(/\.(jpg|jpeg|png|svg)$/i)) {
//             return doc;
//         }
//     }
//     return null;
// };

// export const processRequest = async (
//     question: string,
//     uuid: string,
//     currentState: any = [],
//     file?: File
// ): Promise<DefaultResponse> => {
//     const documentDetails: DocumentDetail[] = await getDocumentByUUID(uuid);
//     const availableDocuments: string[] = documentDetails?.map(doc => doc.metadata.filename) || [];

//     const newDocumentUpload = file?.originalname || null;
//     const classifierResult: ClassifierResult = await processClassifierAgent(
//         question,
//         availableDocuments,
//         newDocumentUpload,
//         `classifier_${uuid}`
//     );

//     global.logger.info(`[Agent] Classifier Agent response with documents ${availableDocuments}: `, classifierResult);

//     if (typeof currentState === 'string') {
//         currentState = JSON.parse(currentState);
//     }

//     let defaultResponse: DefaultResponse = {
//         feedback: classifierResult.feedback,
//         action: [],
//         result: currentState,
//         needFeedback: true,
//         isEmailQuery: classifierResult.isEmailQuery,
//         email: classifierResult.email,
//         isGherkinScriptQuery: classifierResult.isGherkinScriptQuery
//     };

//     if (classifierResult.isGherkinScriptQuery) {
//         const gherkinResult = await getGherkinScript(uuid, question);
//         defaultResponse.result = gherkinResult;
//     }

//     if (classifierResult.isDiagramCreationQuery) {
//         let image: string | null = null;
//         if (newDocumentUpload) {
//             image = getImage(newDocumentUpload);
//         } else {
//             image = getImage(classifierResult.documentReferences || []);
//         }

//         if (image && !question.includes('blueprint')) {
//             global.logger.info('[Main Agent]: Generating isometric from image ', image);
//             const creationResult = await generateIsometricJSONFromImage(image, uuid, documentDetails);

//             if (!creationResult.isometric) {
//                 defaultResponse.needFeedback = true;
//                 defaultResponse.feedback = creationResult.message;
//             } else {
//                 defaultResponse.needFeedback = false;
//                 defaultResponse.result = creationResult.isometric;
//                 defaultResponse.feedback = creationResult.message;
//             }
//         } else {
//             global.logger.info('[Main Agent]: Generating blueprint');
//             const creationResult = await generateIsometricJSONFromBlueprint(uuid);

//             if (!creationResult.isometric) {
//                 defaultResponse.needFeedback = true;
//                 defaultResponse.feedback = creationResult.message;
//             } else {
//                 defaultResponse.needFeedback = false;
//                 defaultResponse.result = creationResult.isometric;
//                 defaultResponse.feedback = creationResult.message;
//             }
//         }
//     } else if (classifierResult.isGeneralQuery) {
//         const generalQueryResult = await generalQuery(classifierResult.transformedQuery || '', currentState, uuid);
//         defaultResponse.feedback = generalQueryResult || classifierResult.feedback;
//     } else if (classifierResult.isEmailQuery) {
//         if (classifierResult.email) {
//             // send email logic here
//         }
//     } else if (classifierResult.isDiagramModifyQuery) {
//         const result = await processDiagramModifierAgent(classifierResult.transformedQuery || '', currentState, uuid);

//         if (result.needFeedback === false) {
//             defaultResponse.action = result.action;
//             defaultResponse.result = result.result;
//             defaultResponse.needFeedback = false;
//         } else {
//             defaultResponse.feedback = result.feedback;
//         }
//     }

//     return defaultResponse;
// };
