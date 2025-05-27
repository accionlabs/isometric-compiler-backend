import axios from "axios";
import config from "../../configs";
import { Service } from "typedi";
import FormData from 'form-data';


@Service()
export class KmsWorkflowService {

    async KmsDocumentWorkflow(uuid: string, document: Express.Multer.File, userId: number = 1): Promise<any> {
        try {
            const workflowUrl = `${config.N8N_WEBHOOK_URL}/document/index`;

            const formData = new FormData();
            formData.append('document', document.buffer, {
                filename: document.originalname,
                contentType: document.mimetype
            });
            formData.append('uuid', uuid);
            formData.append('userId', userId)
            const response = await axios.post(workflowUrl, formData)
            return response.data;
        } catch (error) {
            console.log(error)
            throw error;
        }

    }

    async KmsMetricsGenerateWithPayload(payload: {
        document_id: number;
        uuid: string;
        userId: number;
        metrics: string;
    }): Promise<any> {
        try {
            const workflowUrl = `${config.N8N_WEBHOOK_URL}/metrics/generate`;
            const response = await axios.post(workflowUrl, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error calling metrics generated webhook:', error);
            throw error;
        }
    }
}