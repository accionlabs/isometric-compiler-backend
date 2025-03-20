import ShapeManager from '../shapesManager';
import { filterQumByScenarios } from '../helpers';
import blueprintDescription from './blueprint_service_details.json';

type Layer = {
    layer: string | null;
    position: string;
};

const getNextLayer = (layers: string[]): Layer => {
    if (layers.length === 0) {
        return { layer: null, position: 'top' };
    }
    return layers.length % 2 === 0
        ? { layer: layers[layers.length - 2], position: 'front-left' }
        : { layer: layers[layers.length - 1], position: 'front-right' };
};

const attachDefaultPlatformServicesLayer = (manager: ShapeManager, layers: string[]): void => {
    const showLabels = true;
    const currentLayer = manager.addShape(null, 'layer 2x2', "LAYER", "Platform Services", 'top');
    layers.push(currentLayer.id);
    
    manager.addShape(currentLayer.id, 'API Management, Role Based Access Control', "COMPONENT", showLabels ? "IAM" : undefined, 'top', [], showLabels ? blueprintDescription['iam_engine'] : undefined);
    manager.addShape(currentLayer.id, 'Business Work Flow Services-2', "COMPONENT", showLabels ? "Workflow" : undefined, 'top', ['logo round base-L', "synthesis chart-L"], showLabels ? blueprintDescription['workflow_engine'] : undefined);
    manager.addShape(currentLayer.id, 'Generic Server-L', "COMPONENT", showLabels ? "Notification" : undefined, 'top', ['logo round base-L', "notification bell-L"], showLabels ? blueprintDescription['notification_engine'] : undefined);
    manager.addShape(currentLayer.id, 'User Interface Connector', "COMPONENT", showLabels ? "CUI" : undefined, 'top', [], showLabels ? blueprintDescription['cui_engine'] : undefined);
    manager.addShape(currentLayer.id, 'Generic Server-L', "COMPONENT", showLabels ? "Forms" : undefined, 'top', ['logo round base-L', "table-L"], showLabels ? blueprintDescription['forms_engine'] : undefined);
    manager.addShape(currentLayer.id, 'Search and Custom Reporting', "COMPONENT", showLabels ? "Search" : undefined, 'top', [], showLabels ? blueprintDescription['search_engine'] : undefined);
    manager.addShape(currentLayer.id, 'Master Data Management', "COMPONENT", showLabels ? "Polyglot" : undefined, 'top', [], showLabels ? blueprintDescription['oodebe_engine'] : undefined);
};

const attachDefaultDataLakeLayer = (manager: ShapeManager, layers: string[], blueprint: any): void => {
    const showLabels = true;
    const layer = getNextLayer(layers);
    const currentLayer = manager.addShape(layer.layer, 'layer 2x2', "LAYER", "Data Lake, Analytics, AI/ML", 'front-right', [], [], true);
    layers.push(currentLayer.id);

    manager.addShape(currentLayer.id, "AI Inference Engine", "COMPONENT", showLabels ? "AIML" : undefined, 'top', [], showLabels ? blueprintDescription['aiml_engine'] : undefined);
    manager.addShape(currentLayer.id, "Legacy Data Sources", "COMPONENT", showLabels ? "Data Lake" : undefined, 'top', [], showLabels ? blueprintDescription['data_lake_engine'] : undefined);
    manager.addShape(currentLayer.id, "Self Service Analytics", "COMPONENT", showLabels ? "Analytics" : undefined, 'top', [], showLabels ? blueprintDescription['analytics_engine'] : undefined);
};

const convertBlueprintToIsometric = (blueprint: any, qum: any): any => {
    const manager = new ShapeManager([]);
    const layers: string[] = [];
    
    attachDefaultPlatformServicesLayer(manager, layers);
    attachDefaultDataLakeLayer(manager, layers, blueprint);
    
    if (blueprint.external_integrations.length > 0) {
        const layer = getNextLayer(layers);
        const currentLayer = manager.addShape(layer.layer, 'layer 2x2', "LAYER", "External Integrations", layer.position);
        layers.push(currentLayer.id);

        blueprint.external_integrations.forEach((integration: any) => {
            const { scenarios, ...restData } = integration;
            manager.addShape(currentLayer.id, 'Application Integration services-2', "COMPONENT", integration.name, 'top', undefined, { "blueprint": restData, "qum": filterQumByScenarios(qum, scenarios) });
        });
    }
    
    return manager.getAll();
};

export { convertBlueprintToIsometric };
