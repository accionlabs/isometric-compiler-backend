import { Inject, Service } from "typedi";
import { Agents, MessageRoles, MessageTypes } from "../../enums";
import { MainAgent } from "../mainAgent";
import { FunctionalAgentWorkflowService } from "./functionalAgentWorkflow";
import { DiagramGeneratorAgent } from "../diagram_generator_agent/diagramGeneratorAgent";
import { ArchitectualAgentWorkflowService } from "./architecturalAgentWorkflow";
import { AttdAgentWorkflowService } from "./attdAgentWorkflow";
import { Chat } from "../../entities/chat.entity";
import { GitWorkflowService } from "./gitWorkflow";


type processChatReq = { uuid: string, query: string, agent: Agents, userId: number, currentState: any, file?: Express.Multer.File, gitUrl?: string, gitToken?: string }

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

    @Inject(() => GitWorkflowService)
    private readonly gitWorkflowService: GitWorkflowService

    async processChat({ agent = Agents.REQUIREMENT_AGENT, query, file, userId, uuid, currentState, gitUrl, gitToken }: processChatReq): Promise<[Partial<Chat>, Partial<Chat>]> {
        let messageType: MessageTypes = !!file ? MessageTypes.FILE : MessageTypes.TEXT;
        let fileIdexingResp
        let result
        if (!!gitUrl) {
            result = await this.gitWorkflowService.gitWorkflow({
                uuid: uuid,
                userId: userId,
                git_url: gitUrl,
                git_token: gitToken,
                agent: agent
            })
        }
        else if (!!file) {
            switch (agent) {
                case Agents.REQUIREMENT_AGENT:
                case Agents.DESIGN_AGENT:
                case Agents.ATDD_AGENT:
                    fileIdexingResp = await this.functionalAgentWorkflowService.fileIndexingWorkflow(uuid, agent, file, userId)
                    break;
                case Agents.ARCHITECTURE_AGENT:
                    fileIdexingResp = await this.architectualAgentWorkflowService.fileIndexingWorkflow(uuid, file)
                    break;
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


        const question: Partial<Chat> =
        {
            uuid: uuid as string,
            message: query as string,
            messageType: messageType,
            agent,
            metadata: {
                ...fileIdexingResp?.metadata,
                gitUrl
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
                documentId: result?.documentId,
                isPdfUploaded: fileIdexingResp?.metadata.fileType === 'pdf' ? true : false,
                isGherkinScriptQuery: result?.isGherkinScriptQuery,
                isGitQuery: !!gitUrl ? true : false,
            },
            role: MessageRoles.SYSTEM
        }
        return [question, chats]
    }

}