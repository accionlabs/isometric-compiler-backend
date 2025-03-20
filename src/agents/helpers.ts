const shapes = require('../config/shapesv3.json');
const layers_master = shapes['layers'];

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


// Function to get shape details
const getShapeDetailsFromMaster = (shapeName: string) => {
    if (shapes.components[shapeName]) {
        return { name: shapeName, type: "COMPONENT" };
    }
    if (shapes.layers[shapeName]) {
        return { name: shapeName, type: "LAYER" };
    }
    if (shapes["3dshapes"][shapeName]) {
        return { name: shapeName, type: "3D" };
    }
    if (shapes["2dshapes"][shapeName]) {
        return { name: "server-L", type: "3D", decorator: shapeName };
    }
    console.info(`[Shape Validator]: No such shape as ${shapeName} found!`);
    return { name: "Generic Server-M", type: "COMPONENT" };
};

// Check if position is out of bounds
const isOutsideBounds = (position: string, col: number, row: number): boolean => {
    const splits = position.split("-")[1].split("");
    const x = splits[0].charCodeAt(0);
    const y = Number.parseInt(splits[1]);
    return x >= 97 + col || y > row;
};

// Validate 3D shape placement
const validate3DPlacement = (
    currentMetadata: any[],
    type: string,
    relativeToId: string | null,
    position: string
): { relativeToId: string | null; position: string } => {
    const flatMetadata = getFlatShapesMetadata(currentMetadata);
    const layersKeys = flatMetadata.layers;
    const layersIdList = Object.keys(layersKeys);

    if (type === "LAYER") {
        if (!["front-left", "front-right", "top"].includes(position)) {
            console.info("[Agent]: Invalid position. Resetting to 'top'");
            position = "top";
        }
        if ((!layersKeys[relativeToId!] || layersKeys[relativeToId!]?.type !== "layer") && layersIdList.length > 0) {
            console.info("[Agent]: Layer should be placed relative to another layer.");
            relativeToId = layersIdList[layersIdList.length - 1];
        }
        if (position === "top" && layersIdList.length > 0) {
            console.info("[Agent]: Layer cannot be placed on top of existing layers. Placing it in front-left.");
            position = "front-left";
            relativeToId = layersIdList[layersIdList.length - 1];
        }
    } else {
        if (layersIdList.length === 0) {
            const generatedId = "layer 2x2" + Math.random().toString(36).substr(2, 5);
            currentMetadata.push({
                id: generatedId,
                shape: "layer 2x2",
                type: "layer",
                attached2DShapes: [],
                position: "top",
                relativeToId: null,
                metadata: { name: "Layer 1", labelPosition: "front-left" },
                source: "shape",
            });
            return { relativeToId: generatedId, position: "top-a1" };
        }
        if (!relativeToId && layersIdList.length > 0) {
            if (layersIdList.length === 1) {
                console.info("Missing relativeId, attaching the default layer", layersIdList);
                relativeToId = layersIdList[0];
            } else {
                throw new Error("Multiple layers exist. Please specify the layer.");
            }
        }
    }
    return { relativeToId, position };
};

// Function to check if a position is occupied
const isPositionOccupiedInMetadata = (
    metadata: Metadata[],
    relativeToId: string,
    position: string
): boolean => {
    return metadata.some((meta) => meta.relativeToId === relativeToId && meta.position === position);
};

// Get shape type from metadata
const getShapeType = (metadata: Metadata[], id: string): string | null => {
    return metadata.find((x) => x.id === id)?.type || null;
};

// Flatten metadata structure
const getFlatShapesMetadata = (metadata: Metadata[]) => {
    const layers: Record<string, any> = {};
    const others: Record<string, any> = {};

    for (const item of metadata) {
        const { id, type, position, relativeToId } = item;

        if (type === "layer") {
            layers[id] = { occupiedPositions: {}, ...item };
        } else {
            others[id] = { occupiedPositions: {}, ...item };
        }

        if (relativeToId && layers[relativeToId]) {
            layers[relativeToId].occupiedPositions[position] = id;
        }
        if (relativeToId && others[relativeToId]) {
            others[relativeToId].occupiedPositions[position] = id;
        }
    }

    return { layers, others };
};

// Resize a layer
const resizeLayer = (currLayerId: string, currentState: Metadata[]): string => {
    const currLayer = currentState.find((shape) => shape.id === currLayerId);
    if (!currLayer) throw new Error("Layer not found");

    const layerDimensions = layers_master[currLayer.shape];
    const { col, row } = layerDimensions.dimentions;
    const newLayer = getLayerByLength(col * row + 1);
    currLayer.shape = newLayer.name;

    let pos = "top-a0";
    for (const item of currentState) {
        if (item.relativeToId === currLayer.id && item.type !== "layer") {
            pos = nextPositionOnLayer(pos, newLayer.dimentions.col, newLayer.dimentions.row);
            item.position = pos;
        }
    }
    return nextPositionOnLayer(pos, newLayer.dimentions.col, newLayer.dimentions.row);
};

// Get next available position on layer
const nextPositionOnLayer = (pos: string, col = 4, row = 3): string => {
    const splits = pos.split("-")[1].split("");
    let x = splits[0].charCodeAt(0);
    let y = Number.parseInt(splits[1]);

    y = (y + 1) % (row + 1);
    if (y === 0) {
        y = 1;
        x++;
    }
    if (x >= 97 + col) throw new Error("No space left on layer!");

    return `top-${String.fromCharCode(x)}${y}`;
};

// Get layer based on length
const getLayerByLength = (compLength: number): Layer => {
    if (compLength <= 4) return { name: "layer 2x2", dimentions: { col: 2, row: 2 } };
    if (compLength <= 8) return { name: "layer 4x2", dimentions: { col: 4, row: 2 } };
    if (compLength <= 9) return { name: "layer 3x3", dimentions: { col: 3, row: 3 } };
    if (compLength <= 12) return { name: "layer 4x3", dimentions: { col: 4, row: 3 } };
    return { name: "layer 4x8", dimentions: { col: 4, row: 8 } };
};
const nextEmptyPositionOnLayer = (layerId: string, position: string, occupiedPositions: Record<string, string> = {}): string => {
    const currLayer = layers_master[layerId];

    if (!currLayer) {
        throw new Error("Layer Not Found!");
    }

    const col = currLayer.dimentions.col;
    const row = currLayer.dimentions.row;

    if (!position || position === "top" || isOutsideBounds(position, col, row)) {
        position = "top-a1";
    }

    if (["front-left", "front-right"].includes(position)) {
        if (!occupiedPositions[position]) {
            return position;
        } else {
            position = "top-a1";
        }
    }

    if (!position.startsWith("top-")) {
        position = "top-a1";
    }

    let loop = 0;
    while (occupiedPositions[position] && loop < col * row) {
        position = nextPositionOnLayer(position, col, row);
        loop++;
    }

    return position;
};

const filterQumByScenarios = (qum: any[], scenariosFilter: string | string[]): any[] => {
    const scenariosSet = new Set(
        (Array.isArray(scenariosFilter) ? scenariosFilter : [scenariosFilter])
            .map(scenario => scenario?.trim().toLowerCase())
    );

    return qum
        ?.map(persona => ({
            ...persona,
            outcomes: persona?.outcomes
                ?.map((outcome: { scenarios: any[]; }) => ({
                    ...outcome,
                    scenarios: outcome?.scenarios?.filter(scenario => scenariosSet.has(scenario.scenario?.trim().toLowerCase()))
                }))
                ?.filter((outcome: { scenarios: string | any[]; }) => outcome?.scenarios?.length > 0)
        }))
        ?.filter(persona => persona?.outcomes?.length > 0);
};

const extractScenarios = (personas: any[]): string[] => {
    const out: string[] = [];
    for (let i = 0; i < personas?.length; i++) {
        const outcomes = personas[i].outcomes;
        for (let j = 0; j < outcomes.length; j++) {
            const scenarios = outcomes[j].scenarios;
            for (let k = 0; k < scenarios.length; k++) {
                out.push(scenarios[k].scenario);
            }
        }
    }
    return out;
};

const cleanIsometricMetadata = (metadata: any[]): any[] => {
    const cleanMetadata = JSON.parse(JSON.stringify(metadata));

    for (let i = 0; i < cleanMetadata?.length; i++) {
        delete cleanMetadata[i].attachmentPoints;
        delete cleanMetadata[i].absolutePosition;
        delete cleanMetadata[i].parentAttachmentPoints;
        delete cleanMetadata[i].cut;
    }

    return cleanMetadata;
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
