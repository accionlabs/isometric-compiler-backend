import { validate3DPlacement, nextEmptyPositionOnLayer } from './helpers';

interface Metadata {
    name?: string;
    labelPosition?: string;
    serviceName?: string;
    [key: string]: any;
}

interface Attached2DShape {
    name: string;
    attachedTo: string;
}

interface Shape {
    id: string;
    shape: string;
    type: 'layer' | 'shape' | 'component';
    attached2DShapes: Attached2DShape[];
    position?: any;
    relativeToId?: string | null;
    metadata?: Metadata;
    source?: 'component' | 'shape';
}

class ShapeManager {
    private shapes: Shape[];

    constructor(initialShapes: Shape[] | string = []) {
        if (typeof initialShapes === 'string') {
            this.shapes = JSON.parse(initialShapes);
        } else {
            this.shapes = JSON.parse(JSON.stringify(initialShapes));
        }
    }

    // Add a new shape
    addShape(
        relativeTo: string | null,
        shapeName: string,
        type: string,
        name?: string | null,
        position?: any | null,
        decorator?: string | string[] | null,
        metadata?: Metadata | null,
        skipAutomatedPlacement: boolean = false
    ): Shape {
        if (!skipAutomatedPlacement) {
            const validPlacements = validate3DPlacement(this.shapes, type, relativeTo, position);
            relativeTo = validPlacements.relativeToId;
            position = validPlacements.position;
        }

        const newShape: Shape = {
            id: shapeName.trim() + Math.random().toString(36).substr(2, 5),
            shape: shapeName,
            type: type === 'LAYER' ? 'layer' : 'shape',
            attached2DShapes: [],
            position: position,
            relativeToId: relativeTo ?? null,
            metadata: {},
        };

        if (decorator) {
            if (Array.isArray(decorator)) {
                newShape.attached2DShapes = decorator.map(name => ({ name, attachedTo: 'top' }));
            } else {
                newShape.attached2DShapes.push({ name: decorator, attachedTo: 'top' });
            }
        }

        if (name) {
            newShape.metadata!.name = name;
            if (type === 'LAYER') {
                newShape.metadata!.labelPosition = 'front-left';
            }
        }

        if (metadata) {
            newShape.metadata = { ...newShape.metadata, ...metadata };
        }

        newShape.source = type === 'COMPONENT' ? 'component' : 'shape';

        this.shapes.push(newShape);
        return newShape;
    }

    add2DShape(relativeTo: string, name: string): Shape {
        if (!relativeTo) {
            throw new Error('No target shape specified. Could you please let me know where to place it?');
        }

        const shape = this.shapes.find(s => s.id === relativeTo);
        if (!shape) {
            throw new Error(`Unable to place ${name}, target shape ${relativeTo} cannot be located.`);
        }

        shape.attached2DShapes.push({ name, attachedTo: 'top' });
        return shape;
    }

    move3DShape(shapeId: string, relativeTo: string, position: any): Shape | undefined {
        const shape = this.shapes.find(s => s.id === shapeId);
        if (shape) {
            const validPlacements = validate3DPlacement(this.shapes, shape.type === 'layer' ? 'LAYER' : 'shape', relativeTo, position);
            shape.relativeToId = validPlacements.relativeToId ?? shape.relativeToId;
            shape.position = validPlacements.position ?? shape.position;
        }
        return shape;
    }

    rename(shapeId: string, name: string): Shape | undefined {
        const shape = this.shapes.find(s => s.id === shapeId);
        if (shape) {
            shape.type = shape.type ?? 'shape'; // Ensure it's 'shape' not 'service'
            shape.metadata = shape.metadata ?? {};
            shape.metadata.name = name;
            if (shape.type === 'layer' && !shape.metadata.labelPosition) {
                shape.metadata.labelPosition = 'front-left';
            } else {
                shape.metadata.serviceName = name;
            }
        }
        return shape;
    }

    move2DShape(shapeId: string, name: string, targetShapeId: string): void {
        const shape = this.remove2DShape(shapeId, name);
        if (shape) {
            this.add2DShape(targetShapeId, shape.name);
        }
    }

    remove3DShape(shapeId: string): Shape | undefined {
        const index = this.shapes.findIndex(obj => obj.id === shapeId);
        if (index !== -1) {
            return this.shapes.splice(index, 1)[0]; // Remove 1 element at the found index
        }
    }

    remove2DShape(shapeId: string, name: string): Attached2DShape | undefined {
        const shape = this.shapes.find(s => s.id === shapeId);
        if (shape) {
            const index = shape.attached2DShapes.findIndex(obj => obj.name === name);
            if (index !== -1) {
                return shape.attached2DShapes.splice(index, 1)[0]; // Remove 1 element at the found index
            }
        }
    }

    getAll(): Shape[] {
        return this.shapes;
    }

    getById(id: string): Shape | null {
        return this.shapes.find(shape => shape.id === id) ?? null;
    }
}

export default ShapeManager;
