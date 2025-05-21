import axios from "axios";
import config from "../../configs";
import { Service } from "typedi";
import FormData from 'form-data';


@Service()
export class KmsWorkflowService {

    async KmsDocumentWorkflow(uuid: string, agent: string, document: Express.Multer.File, userId: number = 1): Promise<any> {
        try {
            const workflowUrl = `${config.N8N_WEBHOOK_URL}/kms/document/index`;

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
            throw error;
        }

    }


    async KmsGenerateArchitectureAgent(uuid: string, documentId: number) {
        try {
            const workflowUrl = `${config.N8N_WEBHOOK_URL}/kms/generate/architecture-agent`;
            const response = await axios.post(workflowUrl, { uuid: uuid, documentId: documentId }, {
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


    async KmsGenerateUnifiedModelWithPayload(payload: {
        document_id: number;
        uuid: string;
        agent: string;
        userId: number;
    }): Promise<any> {
        try {
            const workflowUrl = `${config.N8N_WEBHOOK_URL}/kms/generate/unified-model`;
            const response = await axios.post(workflowUrl, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error calling unified model webhook:', error);
            throw error;
        }
    }
}