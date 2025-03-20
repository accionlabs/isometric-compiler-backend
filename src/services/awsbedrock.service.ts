import { Service } from 'typedi';
import {
    BedrockRuntimeClient,
    InvokeModelCommand
} from '@aws-sdk/client-bedrock-runtime';
import config from '../configs';

@Service()
export class AwsBedrockService {
    private client: BedrockRuntimeClient;

    constructor() {
        this.client = new BedrockRuntimeClient({
            region: config.BEDROCK_AWS_REGION,
            credentials: {
                accessKeyId: config.BEDROCK_AWS_ACCESS_KEY_ID,
                secretAccessKey: config.BEDROCK_AWS_SECRET_ACCESS_KEY
            }
        });
    }

    async chatWithBedrock(conversationHistory: any): Promise<string | null> {
        console.log("Model ID:", config.BEDROCK_AWS_MODELID);

        const command = new InvokeModelCommand({
            modelId: config.BEDROCK_AWS_MODELID,
            body: JSON.stringify({
                stop: [],
                max_tokens: 8192,
                messages: conversationHistory
            }),
        });

        try {
            const response = await this.client.send(command);
            const responseData = new TextDecoder().decode(await response.body);
            const jsonResponse = JSON.parse(responseData).choices[0].message.content;
            console.log('Response:', jsonResponse.replace(/```json|```/g, ''));
            return jsonResponse;
        } catch (error) {
            console.error('Error invoking Bedrock model:', error);
            return null;
        }
    }
}
