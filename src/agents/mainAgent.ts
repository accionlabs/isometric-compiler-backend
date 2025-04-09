import { Inject, Service } from 'typedi';
import { DocumentService } from '../services/document.service';
import { ClassifierAgent } from './classifier_agent/classifierAgent';
import { GherkinAgent } from './gherkin_agent/gherkinAgent';
import { DiagramGeneratorAgent } from './diagram_generator_agent/diagramGeneratorAgent';
import { GeneralQueryAgent } from './general_query_agent/generalQueryAgent';
import { DiagramModifierAgent } from './diagram_modifier_agent/diagramModifierAgent';
import { LoggerService } from '../services/logger.service';

interface MainAgentRespone {
    feedback: string;
    action: any[];
    result: any;
    needFeedback: boolean;
    isEmailQuery?: boolean;
    email?: string;
    isGherkinScriptQuery?: boolean;
};


// interface MainAgentResponeMetadata {
//     isEmailQuery?: boolean;
//     email?: string;
//     isGherkinScriptQuery?: boolean;
//     needFeedback: boolean;
// };

// export interface AgentResposne<T, R> {
//     feedback: string;
//     action?: any[];
//     result: R;
//     metadata: T;
// }

@Service()
export class MainAgent {

    @Inject(() => DocumentService)
    private readonly documentService: DocumentService

    @Inject(() => ClassifierAgent)
    private readonly classifierAgent: ClassifierAgent

    @Inject(() => GherkinAgent)
    private readonly gherKinAgent: GherkinAgent

    @Inject(() => DiagramGeneratorAgent)
    private readonly diagramGeneratorAgent: DiagramGeneratorAgent

    @Inject(() => GeneralQueryAgent)
    private readonly generalQueryAgent: GeneralQueryAgent

    @Inject(() => DiagramModifierAgent)
    private readonly diagramModifierAgent: DiagramModifierAgent

    @Inject(() => LoggerService)
    private readonly loggerService: LoggerService



    private getImage(documents: string | string[]): string | null {
        if (typeof documents === 'string') {
            documents = [documents];
        }
        for (const doc of documents) {
            if (doc?.match(/\.(jpg|jpeg|png|svg)$/i)) {
                return doc;
            }
        }
        return null;
    }

    public async processRequest(question: string, uuid: string, currentState: any = [], file?: Express.Multer.File): Promise<MainAgentRespone> {
        const documentDetails = await this.documentService.getDocumentsByUUID(uuid);
        const availableDocuments = documentDetails?.map((doc) => doc.metadata?.filename || '') || [];
        this.loggerService.info(`Processing documents documents ${availableDocuments.join(",")}`)
        const newDocumentUpload = file?.originalname || null;
        const classifierResult = await this.classifierAgent.processClassifierAgent(question, availableDocuments, newDocumentUpload || '', `classifier_${uuid}`);

        this.loggerService.info(`Classifier agent Response ${JSON.stringify(classifierResult, undefined, 2)}`)
        if (typeof currentState === 'string') {
            currentState = JSON.parse(currentState);
        }

        if (!classifierResult) {
            return {
                feedback: 'Classifier agent failed to process the request.',
                action: [],
                result: currentState,
                needFeedback: true,
                isEmailQuery: false,
                isGherkinScriptQuery: false,
            };
        }

        let defaultResponse = {
            feedback: classifierResult.feedback,
            action: [],
            result: currentState,
            needFeedback: true,
            isEmailQuery: classifierResult.isEmailQuery,
            email: classifierResult.email,
            isGherkinScriptQuery: classifierResult.isGherkinScriptQuery,
        };

        if (classifierResult.isGherkinScriptQuery) {
            const gherkinResponse = await this.gherKinAgent.getGherkinScript(uuid, question);
            defaultResponse.result = gherkinResponse.result;
            defaultResponse.feedback = gherkinResponse.feedback;
        } else if (classifierResult.isDiagramCreationQuery) {
            let image = newDocumentUpload ? this.getImage(newDocumentUpload) : this.getImage(classifierResult.documentReferences);

            if (image && !question.includes('blueprint')) {
                const creationResult = await this.diagramGeneratorAgent.generateIsometricJSONFromImage(image, uuid, documentDetails);
                defaultResponse = {
                    ...defaultResponse,
                    needFeedback: !creationResult.isometric,
                    result: creationResult.isometric || defaultResponse.result,
                    feedback: creationResult.message || defaultResponse.feedback || '',
                };
            } else {
                const creationResult = await this.diagramGeneratorAgent.getIsometricJSONFromUUId(uuid);
                defaultResponse = {
                    ...defaultResponse,
                    needFeedback: !creationResult.isometric,
                    result: creationResult.isometric || defaultResponse.result,
                    feedback: creationResult.message || defaultResponse.feedback || '',
                };
            }
        } else if (classifierResult.isGeneralQuery) {
            const generalQueryResult = await this.generalQueryAgent.generalQuery(classifierResult.transformedQuery, currentState, uuid);
            defaultResponse.feedback = generalQueryResult || classifierResult.feedback;
        } else if (classifierResult.isDiagramModifyQuery) {
            const result = await this.diagramModifierAgent.processDiagramModifierAgent(classifierResult.transformedQuery, currentState, uuid);

            if (!result.needFeedback) {
                defaultResponse = { ...defaultResponse, action: result.action, result: result.result, needFeedback: false };
            } else {
                defaultResponse.feedback = result.feedback;
            }
        }

        return defaultResponse;
    }
}
