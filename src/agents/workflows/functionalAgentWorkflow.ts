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

export interface FunctionalAgentWorkflowResp {
    feedback: string,
    result?: any,
    action?: any[],
    needFeedback?: boolean,
    isEmailQuery?: boolean,
    email?: string,
    isGherkinScriptQuery?: boolean,
}
@Service()
export class FunctionalAgentWorkflowService {

    async fileIndexingWorkflow(uuid: string, agent: string, document: Express.Multer.File, userId: number = 1): Promise<FileIndexingWorkflowResp> {
        try {
            const workflowUrl = `${config.N8N_WEBHOOK_URL}/functional-agent/document/index`;
            const formData = new FormData();
            formData.append('document', document.buffer, {
                filename: document.originalname,
                contentType: document.mimetype
            });
            formData.append('uuid', uuid);
            formData.append('agent', agent);
            formData.append('userId', userId)
            const response = await axios.post(workflowUrl, formData)
            return response.data;
        } catch (error) {
            console.log(error)
            throw error
        }

    }

    async functionAgentWorkflow(uuid: string, query: string): Promise<FunctionalAgentWorkflowResp> {
        try {
            const workflowUrl = `${config.N8N_WEBHOOK_URL}/functional-agent/chat`;
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
        } catch (error) {
            console.log(error)
            throw error;
        }

    }

}