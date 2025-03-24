import ShapeManager, { IShape } from './shapesManager';
import { filterQumByScenarios } from './helpers';
import blueprintDescription from './blueprint_service_details.json';
import { Inject, Service } from 'typedi';
import { PersonaResp } from './qum_agent/qumAgent';


type Blueprint = any; // Define a proper interface for Blueprint as needed
type Qum = any; // Define a proper interface for Qum as needed

type LayerPosition = {
    layer: string | null;
    position: string;
};


@Service()
export class DiagramManager {
    private manager: ShapeManager;
    private layers: string[];

    constructor() {
        this.manager = new ShapeManager([]);
        this.layers = [];
    }

    private getNextLayer(): LayerPosition {
        if (this.layers.length === 0) {
            return { layer: null, position: 'top' };
        }
        return this.layers.length % 2 === 0
            ? { layer: this.layers[this.layers.length - 2], position: 'front-left' }
            : { layer: this.layers[this.layers.length - 1], position: 'front-right' };
    }

    private attachDefaultPlatformServicesLayer(): void {
        const showLabels = true;
        const currentLayer = this.manager.addShape(null, 'layer 2x2', "LAYER", "Platform Services", 'top');
        this.layers.push(currentLayer.id);

        this.manager.addShape(currentLayer.id, 'API Management, Role Based Access Control', "COMPONENT", showLabels ? "IAM" : null, 'top', null, showLabels ? blueprintDescription['iam_engine'] : null);
        this.manager.addShape(currentLayer.id, 'Business Work Flow Services-2', "COMPONENT", showLabels ? "Workflow" : null, 'top', ['logo round base-L', "synthesis chart-L"], showLabels ? blueprintDescription['workflow_engine'] : null);
        this.manager.addShape(currentLayer.id, 'Generic Server-L', "COMPONENT", showLabels ? "Notification" : null, 'top', ['logo round base-L', "notification bell-L"], showLabels ? blueprintDescription['notification_engine'] : null);
        this.manager.addShape(currentLayer.id, 'User Interface Connector', "COMPONENT", showLabels ? "CUI" : null, 'top', null, showLabels ? blueprintDescription['cui_engine'] : null);
        this.manager.addShape(currentLayer.id, 'Generic Server-L', "COMPONENT", showLabels ? "Forms" : null, 'top', ['logo round base-L', "table-L"], showLabels ? blueprintDescription['forms_engine'] : null);
        this.manager.addShape(currentLayer.id, 'Search and Custom Reporting', "COMPONENT", showLabels ? "Search" : null, 'top', null, showLabels ? blueprintDescription['search_engine'] : null);
        this.manager.addShape(currentLayer.id, 'Master Data Management', "COMPONENT", showLabels ? "Polyglot" : null, 'top', null, showLabels ? blueprintDescription['oodebe_engine'] : null);
    }

    private attachDefaultApiAbstractionlayer() {
        const layer = this.getNextLayer();
        const currentLayer = this.manager.addShape(layer.layer, 'layer 2x2', "LAYER", "API Abstraction", layer.position);
        this.layers.push(currentLayer.id);
        this.manager.addShape(currentLayer.id, 'Generic Server-L', "COMPONENT", "GraphQL", 'top', ['logo round base-L', "graphql logo-L"], blueprintDescription['graphql_engine']);
        this.manager.addShape(currentLayer.id, "API Management, Role Based Access Control", "COMPONENT", "API Gateway", 'top', null, blueprintDescription['iam_engine']);
        //below is coming from default admin support layer
        this.manager.addShape(currentLayer.id, "Interaction Logger", "COMPONENT", "Monitoring", 'top', null, blueprintDescription['monitoring_engine']);
        this.manager.addShape(currentLayer.id, "Admin and support", "COMPONENT", "Admin & Support", "top", null, blueprintDescription['admin_support_engine']);
    }

    private attachDefaultDataLakeLayer(blueprint: Blueprint): void {
        const showLabels = true;
        const layer = this.getNextLayer();
        const currentLayer = this.manager.addShape(layer.layer, 'layer 2x2', "LAYER", "Data Lake, Analytics, AI/ML", 'front-right', null, null, true);
        this.layers.push(currentLayer.id);

        this.manager.addShape(currentLayer.id, "AI Inference Engine", "COMPONENT", showLabels ? "AIML" : null, 'top', null, showLabels ? blueprintDescription['aiml_engine'] : null);
        this.manager.addShape(currentLayer.id, "Legacy Data Sources", "COMPONENT", showLabels ? "Data Lake" : null, 'top', null, showLabels ? blueprintDescription['data_lake_engine'] : null);
        this.manager.addShape(currentLayer.id, "Self Service Analytics", "COMPONENT", showLabels ? "Analytics" : null, 'top', null, showLabels ? blueprintDescription['analytics_engine'] : null);
    }

    private attachEventQueueLayer(blueprint: Blueprint) {

        let metadata: any = {};
        if (blueprint['event_driven_architecture']) {
            metadata.blueprint = {
                ...blueprint['event_driven_architecture'],
                description: blueprintDescription['events_engine'].blueprint.description
            }
        } else {
            metadata.blueprint = {
                description: blueprintDescription['events_engine'].blueprint.description
            }
        }
        const layer = this.getNextLayer();
        const currentLayer = this.manager.addShape(layer.layer, 'layer 2x2', "LAYER", "Event Driven", layer.position, null, null);
        this.layers.push(currentLayer.id);
        this.manager.addShape(currentLayer.id, 'Event Based Orchestration', "COMPONENT", "Event Queue", 'top-c1', null, metadata, true)
    }

    public convertBlueprintToIsometric(blueprint: Blueprint, qum: PersonaResp[]): IShape[] {
        console.log("blueprint***********", blueprint)
        this.attachDefaultPlatformServicesLayer();
        this.attachDefaultDataLakeLayer(blueprint)
        this.attachEventQueueLayer(blueprint)
        if (blueprint.external_integrations.length > 0) {
            const layer = this.getNextLayer();
            const currentLayer = this.manager.addShape(layer.layer, 'layer 2x2', "LAYER", "External Integrations", layer.position);
            this.layers.push(currentLayer.id);
            const isSingle = blueprint.external_integrations.length === 1;
            for (let i = 0; i < blueprint.external_integrations.length; i++) {
                const { scenarios: scenarios, ...restData } = blueprint.external_integrations[i]
                this.manager.addShape(currentLayer.id, 'Application Integration services-2', "COMPONENT", blueprint.external_integrations[i].name, isSingle ? 'top-c1' : 'top', undefined, { "blueprint": restData, "qum": filterQumByScenarios(qum, scenarios) }, isSingle);
            }
        }
        if (blueprint.entity_microservices.length > 0) {
            const layer = this.getNextLayer();
            const currentLayer = this.manager.addShape(layer.layer, 'layer 2x2', "LAYER", "Entity Services", layer.position);
            this.layers.push(currentLayer.id);
            const isSingle = blueprint.entity_microservices.length === 1;
            for (let i = 0; i < blueprint.entity_microservices.length; i++) {
                let decorator = ['logo round base-L', 'cloud api-L'];
                let default_shape = 'Business Entity Services';
                const { scenarios: scenarios, ...restData } = blueprint.entity_microservices[i]
                this.manager.addShape(currentLayer.id, default_shape, "COMPONENT", blueprint.entity_microservices[i].name, isSingle ? 'top-c1' : 'top', decorator, { "blueprint": restData, "qum": filterQumByScenarios(qum, scenarios) }, isSingle);
            }
        }
        if (blueprint.workflow_services.length > 0) {
            const layer = this.getNextLayer();
            const currentLayer = this.manager.addShape(layer.layer, 'layer 2x2', "LAYER", "Workflow Services", layer.position);
            this.layers.push(currentLayer.id);
            const isSingle = blueprint.workflow_services.length === 1;
            for (let i = 0; i < blueprint.workflow_services.length; i++) {
                const { scenarios: scenarios, ...restData } = blueprint.workflow_services[i]
                this.manager.addShape(currentLayer.id, 'Business Work Flow Services-1', "COMPONENT", blueprint.workflow_services[i].name, isSingle ? 'top-c1' : 'top', undefined, { "blueprint": restData, "qum": filterQumByScenarios(qum, scenarios) }, isSingle);
            }
        }
        this.attachDefaultApiAbstractionlayer();
        //attachDefaultAdminSupportlayer(manager, layers)
        if (blueprint.personalized_ux.length > 0) {
            const layer = this.getNextLayer();
            const currentLayer = this.manager.addShape(layer.layer, 'layer 2x2', "LAYER", "Personalized UX", layer.position);
            this.layers.push(currentLayer.id);
            const isSingle = blueprint.personalized_ux.length === 1;
            for (let i = 0; i < blueprint.personalized_ux.length; i++) {
                let default_shape = 'Personalized Ux';
                this.manager.addShape(currentLayer.id, default_shape, "COMPONENT", blueprint.personalized_ux[i].type, isSingle ? 'top-c1' : 'top', null, blueprintDescription['ux_engine'], isSingle);
            }
        }
        return this.manager.getAll();
    }
}
