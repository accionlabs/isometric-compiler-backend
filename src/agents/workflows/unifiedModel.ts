import { Service } from "typedi";
import axios from 'axios';
import config from "../../configs";


@Service()
export class UnifiedModelWorkflow {

    async startUnifiedModelWorkflow(uuid: string, documentId: number): Promise<any> {
        const workflowUrl = `${config.N8N_WEBHOOK_URL}/index/document?uuid=${uuid}&document_id=${documentId}`;
        const response = await axios.get(workflowUrl)
        return response.data;
    }

}