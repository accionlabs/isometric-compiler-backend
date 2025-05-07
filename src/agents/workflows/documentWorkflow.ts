import axios from "axios";
import config from "../../configs";
import { Service } from "typedi";

@Service()
export class DocumentDeleteWorkflowService {

    async documentDeleteWorkflow(id: number): Promise<any> {
        const workflowUrl = `${config.N8N_WEBHOOK_URL}/document-delete?document_id=${id}`;

        const response = await axios.delete(workflowUrl)
        return {
            message: 'document deleted updated successfully',
            response: response.data
        };
    }
}