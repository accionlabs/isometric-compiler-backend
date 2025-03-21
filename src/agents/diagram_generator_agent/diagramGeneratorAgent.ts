// import { generateMultiModel, generateJsonWithConversation, __LLM_PLATFORM } from '../../services/llm';
import shapes from '../../configs/shapesv3.json';
import ShapeManager from '../shapesManager';
// import { vectorSearch } from '../../services/isomtericPgVector';
import { getLayerByLength, nextPositionOnLayer, filterQumByScenarios, extractScenarios } from '../helpers';
// import { getSemanticModelByUUID, saveSemanticModel } from '../../services/isometricQuery';
import * as fs from 'fs';
// import { convertBlueprintToIsometric } from '../blueprint_agent/blueprintGenerate';
// import { generateBreezeSpec } from '../blueprint_agent/breezeAgent';
// import { SemanticModelStatus } from '../../config/isometric_db';
import axios from 'axios';
import { Inject, Service } from 'typedi';
import { PgVectorService } from '../../services/pgVector.service';
import { LlmService } from '../../services/llm.service';
import { LLM_PLATFORM, SemanticModelStatus } from '../../enums'
import { AWSService } from '../../services/aws.service';
import { SemanticModelService } from '../../services/semanticModel.service';
import { BlueprintConverterAgent } from '../blueprint_agent/blueprintGenerate';

const IMAGE_PROMPT = fs.readFileSync("./src/agents/diagram_generator_agent/DIAGRAM_GENERATOR_AGENT.md", 'utf8');
const IMAGE_EXTRACTOR_PROMPT = fs.readFileSync("./src/agents/diagram_generator_agent/IMAGE_EXTRACTOR_AGENT.md", 'utf8');
const QUM_MAPPER_PROMPT = fs.readFileSync("./src/agents/diagram_generator_agent/DIAGRAM_QUM_MAPPER.md", 'utf8');

const COMPONENTS = Object.keys(shapes['components']);
const SHAPES_3D = Object.keys(shapes['3dshapes']);
const SHAPES_2D = Object.keys(shapes['2dshapes']);
const ALL_SHAPES = [...SHAPES_2D, ...COMPONENTS];


interface Subcomponent {
    name: string;
}

interface Component {
    name: string;
    componentShape: string;
    scenarios: string[];
    subcomponents: Subcomponent[];
}

interface Layer {
    layer: string;
    components: Component[];
}

interface ServiceLayerResult {
    result: Layer[];
}


@Service()
export class DiagramGeneratorAgent {

    @Inject(() => PgVectorService)
    private readonly pgVectorService: PgVectorService

    @Inject(() => LlmService)
    private readonly llmService: LlmService

    @Inject(() => AWSService)
    private readonly awsService: AWSService

    @Inject(() => SemanticModelService)
    private readonly semanticModelService: SemanticModelService

    @Inject(() => BlueprintConverterAgent)
    private readonly blueprintConvertorAgent: BlueprintConverterAgent

    private getExactShapeName(shape: string): string {
        const index = ALL_SHAPES.indexOf(shape);
        if (index >= 0) return shape;

        for (const originalShape of ALL_SHAPES) {
            if (originalShape.toLowerCase().includes(shape.toLowerCase())) {
                // global.logger.info(`Incorrect shape ${shape} detected for ${originalShape}`);
                return originalShape;
            }
        }
        // global.logger.info(`No shape detected for ${shape}`);
        return 'Generic Server-L';
    }

    async extractInfoFromImage(mimeType: string, image: any) {
        const placeholders = {
        }
        if (image) {
            return await this.llmService.generateMultiModel(mimeType, image, IMAGE_EXTRACTOR_PROMPT, placeholders, LLM_PLATFORM.OPENAI_MATURE)
        }
    }

    async generateIsometricJSONFromBlueprint(uuid: string): Promise<any> {
        const semanticModel = await this.semanticModelService.findByUuid(uuid);
        const documents = await this.pgVectorService.vectorSearch("", { uuid });

        if (!documents?.length) {
            return { message: "Please upload some artifacts like Requirement Documents, SRS, architecture diagrams to generate blueprint!" };
        }

        const scenarios = extractScenarios(semanticModel?.metadata?.qum);
        const context = documents.map(x => x.pageContent).join('\n\n---\n');
        const blueprint = await this.blueprintConvertorAgent.generateBreezeSpec(scenarios, context);

        if (!blueprint) {
            return { message: "Unable to fetch blueprint right now!" };
        }

        if (semanticModel?.status === 'active') {
            this.semanticModelService.saveSemanticModel({ uuid, metadata: { qum: semanticModel?.metadata?.qum, blueprint }, visualModel: [], status: SemanticModelStatus.ACTIVE });
        }

        return {
            message: semanticModel?.status === 'active' ? "Blueprint is successfully generated!" : "Blueprint generated without mapping functional and design requirements as functional unified artifacts are still under process!",
            isometric: this.blueprintConvertorAgent.convertBlueprintToIsometric(blueprint, semanticModel?.metadata?.qum)
        };
    }

    async generateIsometricJSONFromImage(image: string, uuid: string, availableDocuments: any[]): Promise<any> {
        const docImage = availableDocuments.find(doc => doc.metadata.filename === image);
        if (!docImage) {
            return { message: "Please provide a valid image!" };
        }

        const imageUrl = await this.awsService.getPresignedUrlFromUrl(docImage.metadata.fileUrl);
        if (!imageUrl) throw new Error("Image not found!!!")
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        return this.extractIsometricAndMappingFromImage(docImage.metadata.mimetype, Buffer.from(response.data), uuid);
    }

    async extractIsometricAndMappingFromImage(mimeType: string, image: Buffer, uuid: string): Promise<any> {
        const placeholders = { __SHAPES__: ALL_SHAPES.map(x => `"${x}"`).join(",") };
        const response = image ? await this.llmService.generateMultiModel(mimeType, image, IMAGE_PROMPT, placeholders, LLM_PLATFORM.OPENAI_MATURE) :
            await this.llmService.generateJsonWithConversation(IMAGE_PROMPT, placeholders, LLM_PLATFORM.OPENAI);
        const result = this.parseJSON(response);
        const mappedIsometric = await this.mapQumWithIsometricModel(result.result, uuid);
        return {
            description: result.description,
            isometric: this.convertFlatToIsometric(mappedIsometric || result.result),
            result: result.result
        };
    }

    private parseJSON(input: string): any {
        try {
            return JSON.parse(input.replace(/^[^\{]+|[^\}]+$/g, ""));
        } catch {
            throw new Error("Model responded with malformed JSON. Please try again:");
        }
    }

    private async convertFlatToIsometric(result: any) {
        const playlist = result;
        const manager = new ShapeManager([]);
        let lastAddedLayerId = null;
        for (let i = 0; i < playlist.length; i++) {
            if (playlist[i].layer && playlist[i].components?.length > 0) {
                const selectedLayer = getLayerByLength(playlist[i].components?.length)
                const currentLayer = manager.addShape(lastAddedLayerId, selectedLayer.name, 'LAYER', playlist[i].layer, lastAddedLayerId ? 'front-left' : "top");
                lastAddedLayerId = currentLayer.id;
                let __current_poistion_on_layer = 'top-a0';
                for (let j = 0; j < playlist[i].components.length; j++) {
                    const comp = playlist[i].components[j];
                    if (comp.name && comp.componentShape) {
                        let default_shape_type = "COMPONENT";
                        let default_shape = this.getExactShapeName(comp.componentShape);
                        let decorator = null;
                        if (SHAPES_2D.indexOf(default_shape) != -1) {
                            default_shape_type = "COMPONENT";
                            decorator = default_shape;
                            default_shape = 'Generic Server-L';
                        }
                        //center align on 2x2 layer
                        if (playlist[i].components.length === 1) {
                            manager.addShape(lastAddedLayerId, default_shape, default_shape_type, comp.name, 'top-c1', decorator, { qum: comp.qum }, true);
                        } else {
                            __current_poistion_on_layer = nextPositionOnLayer(__current_poistion_on_layer, selectedLayer.dimentions?.col, selectedLayer.dimentions?.row);
                            manager.addShape(lastAddedLayerId, default_shape, default_shape_type, comp.name, __current_poistion_on_layer, decorator, { qum: comp.qum });
                        }
                    }
                }
            }
        }
        return manager.getAll();
    }

    private async mapQumWithIsometricModel(generatedModel: any, uuid: string) {
        const semanticModel = await this.semanticModelService.findByUuid(uuid);
        if (!semanticModel?.metadata?.qum) {
            return
        }
        const qum = semanticModel?.metadata?.qum;
        const scenarios = extractScenarios(qum);
        const placeholders = {
            __CONTEXT__: JSON.stringify(generatedModel),
            __SCENARIOS__: JSON.stringify(scenarios)
        }
        const result: ServiceLayerResult = await this.llmService.generateJsonWithConversation(QUM_MAPPER_PROMPT, placeholders, LLM_PLATFORM.OPENAI);
        return result.result.map((res) => {
            const comp = res.components.map((r) => {
                return {
                    ...r,
                    qum: filterQumByScenarios(qum, r.scenarios)
                }
            })
            return { layer: res.layer, components: comp }
        })

    }
}
