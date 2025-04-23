
import { Inject, Service } from 'typedi';
import { LlmService } from '../../services/llm.service';
import { LLM_PLATFORM } from '../../enums';
import * as fs from "fs";

const __BLUEPRINT_PROMPT__ = fs.readFileSync("./src/agents/blueprint_agent/BREEZE_EXTRACTOR_PROMPT.md", "utf8");

interface PersonalizedUxResp {
    type: "Web App" | "Mobile App" | "Chat Agent"
    description: string
    technology: "React" | "Angular" | "Vue" | "Flutter" | "React Native"
    name: string
}

interface EntityMicroservicesResp {
    name: string
    description: string
    api_exposure: "REST" | "GraphQL" | "Event Based"
    events: {
        consumes: string,
        produces: string
    },
    scenarios: string[]
}

interface WorkflowServicesResp {
    name: string
    description: string
    scenarios: string[]
}

interface ExternalIntegrationsResp {
    name: string
    description: string
    external_system: string
    protocol: "REST" | "SOAP" | "WebSockets" | "GraphQL"
    scenarios: string[]
}
export interface BlueprintResp {
    personalized_ux: PersonalizedUxResp[]
    entity_microservices: EntityMicroservicesResp[]
    workflow_services: WorkflowServicesResp[]
    event_driven_architecture: {
        description: string
        topics: string[]
    },
    external_integrations: ExternalIntegrationsResp[]
}


@Service()
export class BreezeExtractorAgent {

    @Inject(() => LlmService)
    private readonly llmService: LlmService

    public async generateBreezeSpec(scenarios: string[], context: string): Promise<BlueprintResp> {
        const placeholders = {
            __CONTEXT__: context,
            __SCENARIOS__: scenarios.map(x => `- ${x}`).join("\n")
        };
        return this.llmService.generateJsonWithConversation(__BLUEPRINT_PROMPT__, placeholders, LLM_PLATFORM.OPENAI_MATURE);
    };
}
