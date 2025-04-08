import { LLM_PLATFORM } from "../../enums";
import { LlmService } from "../../services/llm.service";
import * as fs from "fs";
import { SemanticModelService } from "../../services/semanticModel.service";
import { Inject, Service } from "typedi";
import { LoggerService } from "../../services/logger.service";
import { OutecomeReps, PersonaResp, ScenarioResp } from "../qum_agent/qumAgent";

const __GHERKIN_PROMPT__ = fs.readFileSync("./src/agents/gherkin_agent/GHERKIN_SCRIPT_AGENT.md", "utf8");


@Service()
export class GherkinAgent {
    private gherkinPrompt: string;

    @Inject(() => LlmService)
    private readonly llmService: LlmService

    @Inject(() => SemanticModelService)
    private readonly semanticModelService: SemanticModelService

    @Inject(() => LoggerService)
    private readonly loggerService: LoggerService

    constructor() {
        this.gherkinPrompt = __GHERKIN_PROMPT__;
    }

    private extractScenariosNested(personas?: PersonaResp[]): ScenarioResp[] {
        const scenarios: ScenarioResp[] = [];
        if (!personas) return scenarios;

        for (const persona of personas) {
            for (const outcome of persona?.outcomes ?? []) {
                scenarios.push(...outcome?.scenarios ?? []);
            }
        }
        return scenarios;
    }

    private async generateGherkinScriptFromScenario(context: string, question: string): Promise<string> {
        const placeholders = {
            __CONTEXT__: context,
            question: question
        };
        return await this.llmService.generateJsonWithConversation(this.gherkinPrompt, placeholders, LLM_PLATFORM.OPENAI);
    }

    // public async getGherkinScript(uuid: string, question: string): Promise<any> {
    //     const semanticModel: SemanticModel | null = await this.semanticModelService.findByUuid(uuid);
    //     if (!semanticModel) {
    //         throw new Error(`Semantic model not found for UUID: ${uuid}`);
    //     }

    //     const extractedScenarios = this.extractScenariosNested(semanticModel.metadata?.qum);
    //     const gherkinScript = await this.generateGherkinScriptFromScenario(JSON.stringify(extractedScenarios), question);

    //     this.loggerService.info(`[Unified Model] Gherkin Script generated for ${uuid}`);

    //     await this.semanticModelService.saveSemanticModel({
    //         uuid,
    //         metadata: { ...semanticModel.metadata, gherkin: gherkinScript },
    //         visualModel: semanticModel.visualModel,
    //         // status: semanticModel.status
    //     });

    //     return gherkinScript;
    // }

    public async getGherkinScript(uuid: string, question: string): Promise<{ feedback: string, result: string | null }> {
        const semanticModel = await this.semanticModelService.findByUuid(uuid);
        if (!semanticModel) {
            return {
                feedback: 'Semantic model not found, Please upload some project artifacts.',
                result: null,
            }
        }
        let outcomdes: OutecomeReps[] | never[] = []
        semanticModel.metadata?.qum?.forEach((persona: PersonaResp) => {
            outcomdes = [...outcomdes, ...persona.outcomes ?? []]
        })
        return {
            feedback: 'A Gherkin script has beend generated successfully.',
            result: this.generateGherkinFromOutcomes(outcomdes),
        }
    }

    private generateGherkinFromOutcomes(inputs: OutecomeReps[]): string {
        const allLines: string[] = [];

        inputs.forEach((input) => {
            allLines.push(`Feature: ${input.outcome}`);
            allLines.push('');

            input.scenarios?.forEach((scenarioObj) => {
                allLines.push(`  # ${scenarioObj.description}`);
                allLines.push(`  Scenario: ${scenarioObj.scenario}`);

                let isFirstAction = true;

                scenarioObj?.steps?.forEach((step) => {
                    step?.actions?.forEach((action) => {
                        const keyword = isFirstAction ? '    When' : '    And';
                        allLines.push(`${keyword} ${action.action}`);
                        isFirstAction = false;
                    });
                });

                allLines.push('');
            });

            allLines.push(''); // Extra line between features
        });

        return allLines.join('\n');
    }


}

