import axios from 'axios';
import FormData from 'form-data';
import { Service } from "typedi";
import config from "../../configs";
import { FileType } from "../../entities/document.entity";

export interface FileIndexingWorkflowResp {
    feedback: string;
    metadata:
    {
        documentId: number
        fileUrl: string
        fileType: FileType
        uuid: string
    }
}

export interface AttdAgentWorkflowResp {
    feedback: string
    result?: any,
    action?: any[],
    needFeedback?: boolean,
    isEmailQuery?: boolean,
    email?: string,
    isGherkinScriptQuery?: boolean,
}
@Service()
export class AttdAgentWorkflowService {

    async fileIndexingWorkflow(uuid: string, agent: string, document: Express.Multer.File): Promise<FileIndexingWorkflowResp> {
        const workflowUrl = `${config.N8N_WEBHOOK_URL}/functional-agent/document/index`;
        const formData = new FormData();
        formData.append('document', document.buffer, {
            filename: document.originalname,
            contentType: document.mimetype
        });
        formData.append('uuid', uuid);
        formData.append('agent', agent);
        const response = await axios.post(workflowUrl, formData)
        console.log("response", response.data)
        return response.data;
    }

    async attdAgentWorkflow(uuid: string, query: string): Promise<AttdAgentWorkflowResp> {
        const workflowUrl = `${config.N8N_WEBHOOK_URL}/atdd-agent/chat`;
        const requestBody = {
            uuid: uuid,
            query: query
        };
        const response = await axios.post(workflowUrl, requestBody, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    }

}