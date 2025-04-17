import { Service } from "typedi";
import axios from 'axios';
import config from "../../configs";
import { FileType } from "../../entities/document.entity";

export interface FileIndexingWorkflowResp {
    metadata:
    {
        documentId: number
        fileUrl: string
        fileType: FileType
        uuid: string
    }
}

export interface FunctionalAgentWorkflowResp {
    metadata:
    {
        documentId: number
        fileUrl: string
        fileType: FileType
        uuid: string
    }
}
@Service()
export class FunctionalAgentWorkflowService {

    async fileIndexingWorkflow(uuid: string, document: Express.Multer.File): Promise<FileIndexingWorkflowResp> {
        const workflowUrl = `${config.N8N_WEBHOOK_URL}/index/document?uuid=${uuid}`;
        const formData = new FormData();
        formData.append('document', document.buffer, document.originalname);
        formData.append('uuid', uuid);
        const response = await axios.post(workflowUrl, formData)
        return response.data;
    }

    async functionAgentWorkflow(uuid: string, question: string, fileData: Express.Multer.File): Promise<FileIndexingWorkflowResp> {
        const workflowUrl = `${config.N8N_WEBHOOK_URL}/index/document?uuid=${uuid}`;
        const formData = new FormData();
        formData.append('document', fileData.buffer, fileData.originalname);
        formData.append('uuid', uuid);
        formData.append('question', question);
        const response = await axios.post(workflowUrl, formData);
        return response.data;
    }

}