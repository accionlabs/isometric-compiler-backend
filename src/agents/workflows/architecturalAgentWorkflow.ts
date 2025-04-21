import axios from 'axios';
import FormData from 'form-data';
import { Inject, Service } from "typedi";
import config from "../../configs";
import { FileType } from "../../entities/document.entity";
import ShapeManager, { IShape } from '../shapesManager';
import { filterQumByScenarios, getLayerByLength, nextPositionOnLayer } from '../helpers';
import shapes from '../../configs/shapesv3.json';
import { SemanticModelService } from '../../services/semanticModel.service';
import { DiagramManager } from '../diagramManager';

const COMPONENTS = Object.keys(shapes['components']);
const SHAPES_3D = Object.keys(shapes['3dshapes']);
const SHAPES_2D = Object.keys(shapes['2dshapes']);
const ALL_SHAPES = [...SHAPES_2D, ...COMPONENTS];

export interface FileIndexingWorkflowResp {
    metadata:
    {
        documentId: number
        fileUrl: string
        fileType: FileType
        uuid: string
    }
}

@Service()
export class ArchitectualAgentWorkflowService {

    @Inject(() => SemanticModelService)
    private readonly semanticModelService: SemanticModelService

    async fileIndexingWorkflow(uuid: string, document: Express.Multer.File): Promise<FileIndexingWorkflowResp> {
        const workflowUrl = `${config.N8N_WEBHOOK_URL}/architecture-agent/document/index?uuid=${uuid}`;
        const formData = new FormData();
        formData.append('document', document.buffer, {
            filename: document.originalname,
            contentType: document.mimetype
        });
        const response = await axios.post(workflowUrl, formData)
        return response.data;
    }

    async generateBlueprint(uuid: string) {
        const workflowUrl = `${config.N8N_WEBHOOK_URL}/architecture-agent/generate/blueprint?uuid=${uuid}`;
        // const formData = new FormData();
        // formData.append('document', document.buffer, {
        //     filename: document.originalname,
        //     contentType: document.mimetype
        // });

        const response = await axios.get(workflowUrl)
        return this.mapIsometricToBluprint(response.data?.result, uuid)
    }

    async generateIsometricFromDocment(uuid: string, document: Buffer, mimeType: string, filename: string): Promise<IShape[]> {
        const workflowUrl = `${config.N8N_WEBHOOK_URL}/architecture-agent/generate/image2isometric?uuid=${uuid}`;
        const formData = new FormData();
        const imageBuffer = Buffer.from(document);
        formData.append('document', imageBuffer, {
            filename: filename, // or get original filename if available
            contentType: mimeType,
            knownLength: imageBuffer.length
        });
        formData.append('uuid', uuid)
        const axiosConfig = {
            headers: {
                ...formData.getHeaders(),
                'Content-Length': formData.getLengthSync()
            }
        };
        const response = await axios.post(workflowUrl, formData, axiosConfig)
        const mappedData = await this.mapIsometricToQum(response.data?.result, uuid)
        return this.convertFlatToIsometric(mappedData)
    }

    private async mapIsometricToBluprint(result: any, uuid: string) {
        const semanticModel = await this.semanticModelService.findByUuid(uuid);
        const diagrmaManger = new DiagramManager()
        return diagrmaManger.convertBlueprintToIsometric(result, semanticModel?.qum_specs?.unified_model)
    }

    private async mapIsometricToQum(result: any, uuid: string) {
        const semanticModel = await this.semanticModelService.findByUuid(uuid);
        if (!semanticModel?.qum_specs?.unified_model) {
            return result
        }
        const qum = semanticModel.qum_specs.unified_model;
        return result.map((res: any) => {
            const comp = res.components.map((r: any) => {
                return {
                    ...r,
                    qum: filterQumByScenarios(qum, r.scenarios)
                }
            })
            return { layer: res.layer, components: comp }
        })
    }

    private async convertFlatToIsometric(result: any): Promise<IShape[]> {

        const playlist = result
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

}