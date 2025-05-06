import { Inject, Service } from "typedi";
import { Agents, MessageRoles, MessageTypes } from "../../enums";
import { MainAgent } from "../mainAgent";
import { FunctionalAgentWorkflowService } from "./functionalAgentWorkflow";
import { DiagramGeneratorAgent } from "../diagram_generator_agent/diagramGeneratorAgent";
import { ArchitectualAgentWorkflowService } from "./architecturalAgentWorkflow";
import { AttdAgentWorkflowService } from "./attdAgentWorkflow";
import { Chat } from "../../entities/chat.entity";


type processChatReq = { uuid: string, query: string, agent: Agents, userId: number, currentState: any, file?: Express.Multer.File, git?: { url: string, token: string } }

@Service()
export class MainWorkflow {

    @Inject(() => MainAgent)
    private readonly mainAgent: MainAgent

    @Inject(() => FunctionalAgentWorkflowService)
    private readonly functionalAgentWorkflowService: FunctionalAgentWorkflowService

    @Inject(() => DiagramGeneratorAgent)
    private readonly diagramGeneratorAgent: DiagramGeneratorAgent

    @Inject(() => ArchitectualAgentWorkflowService)
    private readonly architectualAgentWorkflowService: ArchitectualAgentWorkflowService

    @Inject(() => AttdAgentWorkflowService)
    private readonly attdAgentworkFlow: AttdAgentWorkflowService

    async processChat({ agent = Agents.REQUIREMENT_AGENT, query, file, userId, uuid, currentState, git }: processChatReq): Promise<[Partial<Chat>, Partial<Chat>]> {
        let messageType: MessageTypes = !!file ? MessageTypes.FILE : MessageTypes.TEXT;
        let fileIdexingResp
        let result
        if (!!git) {

        }
        else if (!!file) {
            switch (agent) {
                case Agents.REQUIREMENT_AGENT:
                case Agents.DESIGN_AGENT:
                    fileIdexingResp = await this.functionalAgentWorkflowService.fileIndexingWorkflow(uuid, agent, file)
                    break;
                case Agents.ARCHITECTURE_AGENT:
                    fileIdexingResp = await this.architectualAgentWorkflowService.fileIndexingWorkflow(uuid, file)
                    break;
                case Agents.ATDD_AGENT:
                    fileIdexingResp = await this.attdAgentworkFlow.fileIndexingWorkflow(uuid, agent, file)
                    break

                default:
                    fileIdexingResp = await this.functionalAgentWorkflowService.fileIndexingWorkflow(uuid, agent, file)

            }
            if (!fileIdexingResp.feedback) fileIdexingResp.feedback = 'Document Indexed Successfully!'
        } else {

            switch (agent) {
                case Agents.REQUIREMENT_AGENT:
                case Agents.DESIGN_AGENT:
                    result = await this.functionalAgentWorkflowService.functionAgentWorkflow(uuid, query, agent)
                    break;
                case Agents.ATDD_AGENT:
                    result = await this.attdAgentworkFlow.attdAgentWorkflow(uuid, query)
                    break;
                case Agents.ARCHITECTURE_AGENT:
                    result = await this.architectualAgentWorkflowService.architecturalAgentWorkflow(uuid, query, currentState)
                    break;
                default:
                    result = await this.mainAgent.processRequest(query, uuid, currentState, userId, file)
            }

        }

        console.log(JSON.stringify(result, undefined, 2), "result")

        const question: Partial<Chat> =
        {
            uuid: uuid as string,
            message: query as string,
            messageType: messageType,
            agent,
            metadata: {
                ...fileIdexingResp?.metadata
            },
            role: MessageRoles.USER
        }

        const chats: Partial<Chat> = {
            uuid,
            message: result?.feedback || fileIdexingResp?.feedback || "Something Went Wrong!",
            agent,
            messageType: !!result?.result?.length ? MessageTypes.JSON : MessageTypes.TEXT, // json or text check
            metadata: {
                content: result?.result,
                action: result?.action,
                needFeedback: result?.needFeedback,
                isEmailQuery: result?.isEmailQuery,
                emailId: result?.email,
                isPdfUploaded: fileIdexingResp?.metadata.fileType === 'pdf' ? true : false,
                isGherkinScriptQuery: result?.isGherkinScriptQuery
            },
            role: MessageRoles.SYSTEM
        }
        return [question, chats]
    }

}