import axios from "axios";
import config from "../../configs";
import { Service } from "typedi";

@Service()
export class GitWorkflowService {

    async gitWorkflow(requestBody: {
        uuid: string,
        userId: number,
        git_url: string,
        git_token?: string,
        agent?: string,
    }): Promise<{ feedback: string, documentId: number }> {
        const workflowUrl = `${config.N8N_WEBHOOK_URL}/repository/index`;
        const response = await axios.post(workflowUrl, requestBody, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return {
            feedback: response.data.feedback || "Git repo indexed",
            documentId: response.data.documentId
        };
    }
}