import Shapes from '../configs/shapesv3.json'
import { PersonaResp, ScenarioResp } from './qum_agent/qumAgent';
const layers_master: any = Shapes['layers'];

// Define types
interface Shape {
    name: string;
    description: string;
    attachmentPoint: any[];
}

interface ShapesMaster {
    components: Record<string, Shape>;
    layers: Record<string, any>;
    "3dshapes": Record<string, any>;
    "2dshapes": Record<string, any>;
}

interface Metadata {
    id: string;
    shape: string;
    type: 'layer' | 'shape' | 'component';
    position: string;
    relativeToId: string | null;
    metadata?: { name?: string; labelPosition?: string };
    attached2DShapes?: { name: string }[];
    source?: string;
}

interface LayerDimensions {
    col: number;
    row: number;
}

interface Layer {
    name: string;
    dimentions: LayerDimensions;
}

const shapes: any = Shapes

// Function to get shape details
const getShapeDetailsFromMaster = (shapeName: string) => {
    if (shapes['components'][shapeName]) {
        return {
            name: shapeName,
            type: "COMPONENT"
        }
    }

    if (shapes['layers'][shapeName]) {
        return {
            name: shapeName,
            type: "LAYER"
        }
    }

    if (shapes['3dshapes'][shapeName]) {
        return {
            name: shapeName,
            type: "3D"
        }
    }
    if (shapes['2dshapes'][shapeName]) {
        return {
            name: "server-L",
            type: "3D",
            decorator: shapeName
        }
    }
    // global.logger.info(`[Shape Validator]: No such shape as ${shapeName} found!`);
    return {
        name: "Generic Server-M",
        type: "COMPONENT"
    }
};

// Check if position is out of bounds
const isOutsideBounds = (position: string, col: number, row: number): boolean => {
    const splits = position.split("-")[1].split("");
    const x = splits[0].charCodeAt(0);
    const y = Number.parseInt(splits[1]);
    if (x >= 97 + col || y > row) {
        return true;
    }
    return false;
};

const validate3DPlacement = (currentMetadata: any[], type: string, relativeToId: string | null, position: string) => {
    const flat_metadata = getFlatShapesMetadata(currentMetadata);
    const layers_keys = flat_metadata.layers;
    const others_keys = flat_metadata.others;
    const layers_id_list = Object.keys(layers_keys);
    if (type === "LAYER") {
        if (['front-left', 'front-right', 'top'].indexOf(position) === -1) {
            // global.logger.info("[Agent]: Invalid postion. Resetting to 'top'");
            position = 'top';
        }
        //validate relativeTo should be a layer or null if no layer exists
        if ((!layers_keys[relativeToId || ''] || layers_keys[relativeToId || '']?.type !== "layer") && layers_id_list.length > 0) {
            // global.logger.info("[Agent]: Layer should be placed relative to another layer.");
            relativeToId = layers_id_list[layers_id_list.length - 1];
        }
        //validate to ensure layers are not stacked on each other
        if (position === "top" && layers_id_list.length > 0) {
            // global.logger.info("[Agent]: Layer cannot be placed on top of existing layers. PLacing it in front of the last layer");
            position = 'front-left';
            relativeToId = layers_id_list[layers_id_list.length - 1];
        }
    } else {
        //since there are no layer adding this shape on top of a new layer
        if (layers_id_list.length === 0) {
            const generatedId = "layer 2x2".trim() + Math.random().toString(36).substr(2, 5);
            currentMetadata.push({
                id: generatedId,
                shape: "layer 2x2",
                type: 'layer',
                attached2DShapes: [],
                position: "top",
                relativeToId: null,
                metadata: {
                    name: "Layer 1",
                    labelPosition: "front-left"
                },
                source: "shape"
            });
            return { relativeToId: generatedId, position: "top-a1" };
        }
        if (!relativeToId && layers_id_list.length > 0) {
            if (layers_id_list.length === 1) {
                console.info(`Missing relativeId , attaching the default layer`, layers_id_list);
                relativeToId = layers_id_list[0];
            } else {
                throw new Error("Multiple layer exists. Please specify the layer");
            }
        }
        const relativeToIdMetadata = layers_keys[relativeToId || ''];
        if (relativeToIdMetadata?.type === "layer") {
            try {
                position = nextEmptyPositionOnLayer(relativeToIdMetadata.shape, position, relativeToIdMetadata.occupiedPositions);
            } catch (error: any) {
                if (error.message === "No space left on layer!") {
                    position = resizeLayer(relativeToIdMetadata.id, currentMetadata);
                } else
                    throw new Error(error.message)
            }
        } else {
            //convert front-left && front-right to actual positions of layer if one exists and check if those are occupied!
        }
    }
    return { relativeToId, position };
}

// Function to check if a position is occupied
const isPositionOccupiedInMetadata = (
    metadata: Metadata[],
    relativeToId: string,
    position: string
): boolean => {
    for (let i = 0; i < metadata.length; i++) {
        if (metadata[i].relativeToId === relativeToId && metadata[i].position === position) {
            return true;
        }
    }
    return false;
};

// Get shape type from metadata
const getShapeType = (metadata: Metadata[], id: string): string | null => {
    const y = metadata.find(x => x.id === id);
    return y?.type || null;
};

// Flatten metadata structure
const getFlatShapesMetadata = (metadata: Metadata[]) => {
    const layers: Record<string, any> = {};
    const others: Record<string, any> = {};

    for (let i = 0; i < metadata.length; i++) {
        const relativeId = metadata[i].relativeToId;
        const id = metadata[i].id;
        const type = metadata[i].type;
        const position = metadata[i].position;
        if (type === 'layer') {
            layers[id] = {
                occupiedPositions: {},
                ...metadata[i]
            };
        } else {
            others[id] = {
                occupiedPositions: {},
                ...metadata[i]
            }
        }
        if (layers[relativeId || ''] != null) {
            layers[relativeId || '']['occupiedPositions'][position] = id;
        }
        if (others[relativeId || ''] != null) {
            others[relativeId || '']['occupiedPositions'][position] = id;
            //this shape might be in relivateToId with front left or front right set. In this case the position on layer should get occupied
        }
    }
    return {
        layers: layers,
        others: others
    };
};



const resizeLayer = (currLayerId: string, currentState: Metadata[]) => {
    const currLayer = getShapeFromMetadata(currLayerId, currentState);
    const layerDimention = layers_master[currLayer.shape];
    const oldCol = layerDimention.dimentions.col;
    const oldRow = layerDimention.dimentions.row;
    const newLayer = getLayerByLength(oldCol * oldRow + 1);
    const newCol = newLayer.dimentions.col;
    const newRow = newLayer.dimentions.row;
    currLayer.shape = newLayer.name;
    let pos = 'top-a0'
    for (let i = 0; i < currentState.length; i++) {
        if (currentState[i].relativeToId === currLayer.id && currentState[i].type !== 'layer') {
            pos = nextPositionOnLayer(pos, newCol, newRow);
            currentState[i].position = pos;
        }
    }
    pos = nextPositionOnLayer(pos, newCol, newRow);
    return pos;
}

// Get next available position on layer
const nextPositionOnLayer = (pos: string, col = 4, row = 3): string => {
    const splits = pos.split("-")[1].split("");
    const x = splits[0].charCodeAt(0);
    const y = Number.parseInt(splits[1]);
    let new_x = x;
    let new_y = (y + 1) % (row + 1);
    if (new_y === 0) {
        new_y = 1;
        new_x = (x + 1);
    }
    if (new_x >= 97 + col) {
        throw new Error("No space left on layer!");
    }
    return "top-" + String.fromCharCode(new_x) + "" + new_y;
};

// Get layer based on length
const getLayerByLength = (compLength: number) => {
    if (compLength <= 4) {
        return { name: "layer 2x2", dimentions: { col: 2, row: 2 } }
    }
    if (compLength <= 8) {
        return { name: "layer 4x2", dimentions: { col: 4, row: 2 } }
    }
    if (compLength <= 9) {
        return { name: "layer 3x3", dimentions: { col: 3, row: 3 } }
    }
    if (compLength <= 12) {
        return { name: "layer 4x3", dimentions: { col: 4, row: 3 } }
    }
    if (compLength > 12) {
        return { name: "layer 4x8", dimentions: { col: 4, row: 8 } }
    }
    return { name: "layer 4x3", dimentions: { col: 4, row: 3 } };
}
const nextEmptyPositionOnLayer = (layerId: string, position: string, occupiedPositions: Record<string, string> = {}): string => {
    const currLayer = layers_master[layerId];
    const col = currLayer.dimentions.col;
    const row = currLayer.dimentions.row;
    if (!currLayer) {
        throw new Error("Layer Not Found!");
    }
    if (!position || position === "top" || isOutsideBounds(position, col, row)) {
        position = 'top-a1';
    }
    if (['front-left', 'front-right'].indexOf(position) !== -1) {
        if (!occupiedPositions[position]) {
            return position;
        } else {
            position = 'top-a1';
        }
    }
    if (position.indexOf('top-') === -1) {
        position = 'top-a1';
    }
    let loop = 0;
    while (occupiedPositions[position] && loop < col * row) {
        position = nextPositionOnLayer(position, col, row);
        loop++;
    }
    return position;
};

const getShapeFromMetadata = (id: string, currentState: any[]) => {
    for (let i = 0; i < currentState.length; i++) {
        if (currentState[i].id === id) {
            return currentState[i];
        }
    }
}




const filterQumByScenarios = (qum: PersonaResp[], scenariosFilter: string | string[]): any[] => {
    const scenariosSet = new Set(
        (Array.isArray(scenariosFilter) ? scenariosFilter : [scenariosFilter])
            .map(scenario => scenario?.trim().toLowerCase())
    );

    return qum
        ?.map(persona => ({
            ...persona,
            outcomes: persona?.outcomes
                ?.map((outcome) => ({
                    ...outcome,
                    scenarios: outcome?.scenarios?.filter(scenario => scenariosSet.has(scenario.scenario?.trim().toLowerCase()))
                }))
                ?.filter((outcome) => (outcome?.scenarios?.length || 0) > 0)
        }))
        ?.filter(persona => (persona?.outcomes?.length || 0) > 0);
};

const extractScenarios = (personas: PersonaResp[]): string[] => {
    const out: string[] = [];
    for (let i = 0; i < personas?.length; i++) {
        const outcomes = personas[i].outcomes;
        for (let j = 0; j < (outcomes?.length || 0); j++) {
            const scenarios = outcomes?.[j].scenarios;
            for (let k = 0; k < (scenarios?.length || 0); k++) {
                out.push(scenarios?.[k].scenario || '');
            }
        }
    }
    return out;
};

const cleanIsometricMetadata = (metadata: any[]): any[] => {
    const clean_metadata = JSON.parse(JSON.stringify(metadata))
    for (let i = 0; i < clean_metadata?.length; i++) {
        delete clean_metadata[i].attachmentPoints;
        delete clean_metadata[i].absolutePosition;
        delete clean_metadata[i].parentAttachmentPoints;
        delete clean_metadata[i].cut;
    }
    return clean_metadata;
};

const normalizeIsometricMetadata = (metadata: any[]): any[] => {
    const normalizedMetadata: any[] = [];

    for (let i = 0; i < metadata?.length; i++) {
        const meta = metadata[i];
        let type = "shape";
        if (meta.type === "layer") type = "layer";
        if (meta.source === "component") type = "component";

        normalizedMetadata.push({
            id: meta.id,
            name: meta.metadata?.name || "",
            shape: meta.shape,
            type: type,
            position: meta.position,
            relativeToId: meta.relativeToId,
            attached2DShapes: meta.attached2DShapes?.map((x: { name: any; }) => x.name) || []
        });
    }

    return normalizedMetadata;
};


// Export functions
export {
    resizeLayer,
    getLayerByLength,
    getShapeDetailsFromMaster,
    getShapeType,
    validate3DPlacement,
    nextPositionOnLayer,
    isPositionOccupiedInMetadata,
    nextEmptyPositionOnLayer,
    filterQumByScenarios, extractScenarios, cleanIsometricMetadata, normalizeIsometricMetadata
};
