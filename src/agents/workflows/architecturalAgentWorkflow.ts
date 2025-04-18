import axios from 'axios';
import FormData from 'form-data';
import { Service } from "typedi";
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

@Service()
export class ArchitectualAgentWorkflowService {

    async fileIndexingWorkflow(uuid: string, document: Express.Multer.File): Promise<FileIndexingWorkflowResp> {
        const workflowUrl = `${config.N8N_WEBHOOK_URL}/architecture-agent/document/index?uuid=${uuid}`;
        const formData = new FormData();
        formData.append('document', document.buffer, {
            filename: document.originalname,
            contentType: document.mimetype
        });
        const response = await axios.post(workflowUrl, formData)
        console.log("respin", response, workflowUrl)
        return response.data;
    }

}