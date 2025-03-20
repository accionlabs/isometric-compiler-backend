// import { generateMultiModel, generateJsonWithConversation, __LLM_PLATFORM } from '../../services/llm';
// import shapes from '../../config/shapesv3.json';
// import ShapeManager from '../shapesManager';
// import { vectorSearch } from '../../services/isomtericPgVector';
// import { getLayerByLength, nextPositionOnLayer, filterQumByScenarios, extractScenarios } from '../helpers';
// import { getSemanticModelByUUID, saveSemanticModel } from '../../services/isometricQuery';
// import fs from 'fs';
// import { convertBlueprintToIsometric } from '../blueprint_agent/blueprintGenerate';
// import { generateBreezeSpec } from '../blueprint_agent/breezeAgent';
// import { SemanticModelStatus } from '../../config/isometric_db';
// import { getPresignedUrlFromUrl } from '../../services/signedUrl';
// import axios from 'axios';

// const __IMAGE_PROMPT__: string = fs.readFileSync("./agents/diagram_generator_agent/DIAGRAM_GENERATOR_AGENT.md", 'utf8');
// const __IMAGE_EXTRACTOR_PROMPT__: string = fs.readFileSync("./agents/diagram_generator_agent/IMAGE_EXTRACTOR_AGENT.md", 'utf8');
// const __QUM_MAPPER_PROMPT__: string = fs.readFileSync("./agents/diagram_generator_agent/DIAGRAM_QUM_MAPPER.md", 'utf8');

// const __COMPONENTS__: string[] = Object.keys(shapes['components']);
// const __3DSHAPES__: string[] = Object.keys(shapes['3dshapes']);
// const __2DSHAPES__: string[] = Object.keys(shapes['2dshapes']);
// const __SHAPES__: string[] = [...__2DSHAPES__, ...__COMPONENTS__];

// const getExactShapeName = (shape: string): string => {
//     const index = __SHAPES__.indexOf(shape);
//     if (index >= 0) {
//         return shape;
//     } else {
//         for (const originalShape of __SHAPES__) {
//             if (originalShape.toLowerCase() === shape.toLowerCase() || originalShape.toLowerCase().includes(shape.toLowerCase())) {
//                 console.info(`Incorrect shape ${shape} detected for ${originalShape}`);
//                 return originalShape;
//             }
//         }
//         console.info(`No shape detected for ${shape}`);
//         return 'Generic Server-L';
//     }
// };

// const convertFlatToIsometric = (result: any[]): any[] => {
//     const playlist = result;
//     const manager = new ShapeManager([]);
//     let lastAddedLayerId: string | null = null;

//     for (const item of playlist) {
//         if (item.layer && item.components?.length > 0) {
//             const selectedLayer = getLayerByLength(item.components.length);
//             const currentLayer = manager.addShape(lastAddedLayerId, selectedLayer.name, 'LAYER', item.layer, lastAddedLayerId ? 'front-left' : "top");
//             lastAddedLayerId = currentLayer.id;
//             let __current_position_on_layer = 'top-a0';

//             for (const comp of item.components) {
//                 if (comp.name && comp.componentShape) {
//                     let default_shape_type = "COMPONENT";
//                     let default_shape = getExactShapeName(comp.componentShape);
//                     let decorator: string | null = null;

//                     if (__2DSHAPES__.includes(default_shape)) {
//                         default_shape_type = "COMPONENT";
//                         decorator = default_shape;
//                         default_shape = 'Generic Server-L';
//                     }

//                     if (item.components.length === 1) {
//                         manager.addShape(lastAddedLayerId, default_shape, default_shape_type, comp.name, 'top-c1', decorator, { qum: comp.qum }, true);
//                     } else {
//                         __current_position_on_layer = nextPositionOnLayer(__current_position_on_layer, selectedLayer.dimentions?.col, selectedLayer.dimentions?.row);
//                         manager.addShape(lastAddedLayerId, default_shape, default_shape_type, comp.name, __current_position_on_layer, decorator, { qum: comp.qum });
//                     }
//                 }
//             }
//         }
//     }

//     return manager.getAll();
// };

// const generateIsometricJSONFromBlueprint = async (uuid: string): Promise<any> => {
//     let context: string | null = null;
//     const semanticModel = await getSemanticModelByUUID(uuid);
//     const documents = await vectorSearch("", { uuid });

//     if (!documents || documents.length === 0) {
//         return { message: "Please upload some artifacts like Requirement Documents, SRS, architecture diagrams to generate blueprint!" };
//     }

//     const scenarios = extractScenarios(semanticModel?.metadata?.qum);
//     documents.forEach(x => context += "\n\n---\n" + x.pageContent);
//     const breeze_blueprint = await generateBreezeSpec(scenarios, context || '');

//     const unifiedModel = { qum: semanticModel?.metadata?.qum, blueprint: breeze_blueprint };

//     if (semanticModel?.status === 'active') {
//         saveSemanticModel(uuid, { metadata: unifiedModel, visualModel: [], status: SemanticModelStatus.ACTIVE });
//     }

//     if (!breeze_blueprint) {
//         return { message: "Unable to fetch blueprint right now!" };
//     }

//     const isometric = convertBlueprintToIsometric(breeze_blueprint, semanticModel?.metadata?.qum);
//     return {
//         message: semanticModel?.status === 'active' ?
//             "Blueprint is successfully generated!" :
//             "Blueprint generated without mapping functional and design requirements as functional unified artifacts are still under process!",
//         isometric
//     };
// };

// const generateIsometricJSONFromImage = async (image: string, uuid: string, availableDocuments: any[]): Promise<any> => {
//     const docImage = availableDocuments.find(doc => doc.metadata.filename === image);
//     if (!docImage) {
//         return { message: "Please provide a valid image!" };
//     }

//     const imageUrl = await getPresignedUrlFromUrl(docImage.metadata.fileUrl);
//     const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
//     const imageBuffer = Buffer.from(response.data);

//     return extractIsometricAndMappingFromImage(docImage.metadata.mimetype, imageBuffer, uuid);
// };

// const extractInfoFromImage = async (mimeType: string, image: Buffer, uuid: string): Promise<any> => {
//     if (image) {
//         return await generateMultiModel(mimeType, image, __IMAGE_EXTRACTOR_PROMPT__, {}, __LLM_PLATFORM.OPENAI_MATURE);
//     }
// };

// const extractIsometricAndMappingFromImage = async (mimeType: string, image: Buffer, uuid: string): Promise<any> => {
//     const placeholders = { __SHAPES__: __SHAPES__.map(x => `"${x}"`).join(",") };
//     let response: any = null, result: any = null;

//     if (image) {
//         response = await generateMultiModel(mimeType, image, __IMAGE_PROMPT__, placeholders, __LLM_PLATFORM.OPENAI_MATURE);
//         result = parseJSON(response);
//     } else {
//         result = await generateJsonWithConversation(__IMAGE_PROMPT__, placeholders, __LLM_PLATFORM.OPENAI);
//     }

//     const mappedIsometric = await mapQumWithIsometricModel(result.result, uuid);
//     const isometric = mappedIsometric ? convertFlatToIsometric(mappedIsometric) : convertFlatToIsometric(result.result);

//     return {
//         message: "Successfully generated diagram from given image!",
//         description: result.description,
//         isometric,
//         result: result.result
//     };
// };

// const mapQumWithIsometricModel = async (generatedModel: any, uuid: string): Promise<any> => {
//     const semanticModel = await getSemanticModelByUUID(uuid);
//     if (!semanticModel?.metadata?.qum) return;

//     const qum = semanticModel.metadata.qum;
//     const scenarios = extractScenarios(qum);
//     const placeholders = { __CONTEXT__: JSON.stringify(generatedModel), __SCENARIOS__: JSON.stringify(scenarios) };

//     const result = await generateJsonWithConversation(__QUM_MAPPER_PROMPT__, placeholders, __LLM_PLATFORM.OPENAI);
//     return result.result.map((res: any) => ({
//         layer: res.layer,
//         components: res.components.map((r: any) => ({ ...r, qum: filterQumByScenarios(qum, r.scenarios) }))
//     }));
// };

// const parseJSON = (input: string): any => {
//     try {
//         return JSON.parse(input.replace(/^[^\{]+|[^\}]+$/g, ""));
//     } catch (error) {
//         throw new Error(`Model responded with malformed JSON. Please try again: ${input}`);
//     }
// };

// export { generateIsometricJSONFromBlueprint, generateIsometricJSONFromImage, extractInfoFromImage };
