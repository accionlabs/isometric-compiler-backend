import Container, { Service } from 'typedi';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { AIMessageChunk, HumanMessage, MessageContent } from '@langchain/core/messages';
import config from '../configs';
import { HuggingFaceInference } from '@langchain/community/llms/hf';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import { PromptTemplate } from '@langchain/core/prompts';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { HarmBlockThreshold, HarmCategory, TaskType } from '@google/generative-ai';
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import fs from 'fs';
import { BedrockChat } from '@langchain/community/chat_models/bedrock/web';
import { AwsBedrockService } from './awsbedrock.service';


@Service()
export class LlmService {
    private bedrockService: AwsBedrockService;

    constructor() {
        this.bedrockService = Container.get(AwsBedrockService);
    }

    private readonly HF_KEY = config.HUGGING_FACE_KEY;
    private readonly HF_DEFAULT_MODEL = config.HUGGING_FACE_DEFAULT_MODEL;
    private readonly OPENAI_KEY = config.OPENAI_KEY;
    private readonly OPENAI_DEFAULT_MODEL = config.OPENAI_DEFAULT_MODEL;
    private readonly OPENAI_MATURE_MODEL = config.OPENAI_MATURE_MODEL;
    private readonly GEMINI_KEY = config.GEMINI_KEY;
    private readonly DEFAULT_CHAT_LLM_PLATFORM = config.DEFAULT_CHAT_LLM_PLATFORM;
    private readonly GEMINI_DEFAULT_MODEL = config.GEMINI_DEFAULT_MODEL;
    private readonly DEFAULT_EMBEDDING_LLM_PLATFORM = config.DEFAULT_EMBEDDING_LLM_PLATFORM;

    private static readonly LLM_PLATFORM = {
        OPENAI: "OPENAI",
        OPENAI_MATURE: "OPENAI_MATURE",
        HUGGINGFACE: "HF",
        GOOGLEAI: "GEMINI",
        AWSBEDROCK: 'AWSBEDROCK'
    };
    static getPlatform() {
        return this.LLM_PLATFORM;
    }


    private readonly PROMPT_CACHE: Record<string, string> = {};
    private readonly PROMPT_PATHS: Record<string, string> = {
        SYSTEM: "./prompts/SYS_PROMPT_v3.txt",
        QUERY_ANALYSIS: "./prompts/QUERY_ANALYSIS_PROMPT.txt",
        QUERY_EMPLOYEE_ANALYSIS: "./prompts/QUERY_EMPLOYEE_ANALYSIS.txt",
        ISOMETRIC_DIAGRAM_PROMPT: "./prompts/ISOMETRIC_DIAGRAM_PROMPT.txt",
        ISOMETRIC_VISUAL_MODEL_PROMPT: "./prompts/ISOMETRIC_VISUAL_MODEL_PROMPT.txt",
        ISOMETRIC_VISUAL_MODEL_PROMPT_V2: "./prompts/ISOMETRIC_VISUAL_MODEL_PROMPT_V2.txt",
        ISOMETRIC_AGENT_1: "./prompts/ISOMETRIC_AGENT_1.txt",
        ISOMETRIC_AGENT_0: "./prompts/ISOMETRIC_AGENT_0.txt",
        ISOMETRIC_AGENT_INIT: "./prompts/ISOMETRIC_AGENT_init.txt",
        ISOMETRIC_IMAGE_TO_DIAGRAM: "./prompts/ISOMETRIC_IMAGE_TO_DIAGRAM.txt",
        BREEZE: "./prompts/breeze_prompt.txt"
    };

    getModel(llmPlatform: string = this.DEFAULT_CHAT_LLM_PLATFORM) {
        switch (llmPlatform) {
            case LlmService.LLM_PLATFORM.OPENAI:
                return new ChatOpenAI({
                    modelName: this.OPENAI_DEFAULT_MODEL,
                    openAIApiKey: this.OPENAI_KEY,
                    temperature: 0
                });

            case LlmService.LLM_PLATFORM.OPENAI_MATURE:
                return new ChatOpenAI({
                    modelName: this.OPENAI_MATURE_MODEL,
                    openAIApiKey: this.OPENAI_KEY,
                    temperature: 0
                });

            case LlmService.LLM_PLATFORM.HUGGINGFACE:
                return new HuggingFaceInference({
                    model: this.HF_DEFAULT_MODEL,
                    apiKey: this.HF_KEY
                });

            case LlmService.LLM_PLATFORM.GOOGLEAI:
                return new ChatGoogleGenerativeAI({
                    model: this.GEMINI_DEFAULT_MODEL,
                    apiKey: this.GEMINI_KEY,
                    maxOutputTokens: 10000,
                    temperature: 0,
                    safetySettings: [
                        {
                            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                            threshold: HarmBlockThreshold.BLOCK_NONE
                        },
                        {
                            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                            threshold: HarmBlockThreshold.BLOCK_NONE
                        }
                    ]
                });

            case LlmService.LLM_PLATFORM.AWSBEDROCK:
                return new BedrockChat({
                    model: config.BEDROCK_AWS_MODELID,
                    credentials: {
                        accessKeyId: config.BEDROCK_AWS_ACCESS_KEY_ID,
                        secretAccessKey: config.BEDROCK_AWS_SECRET_ACCESS_KEY,
                    },
                    region: config.BEDROCK_AWS_REGION
                });

            default:
                return null;
        }
    }

    getPrompt(type: string = "SYSTEM"): string | null {
        if (this.PROMPT_CACHE[type]) {
            return this.PROMPT_CACHE[type];
        }
        if (!this.PROMPT_PATHS[type]) {
            throw new Error("Unsupported type to fetch prompt");
        }
        try {
            const data = fs.readFileSync(this.PROMPT_PATHS[type], 'utf8');
            this.PROMPT_CACHE[type] = data;
            return data;
        } catch (err) {
            console.error('Error reading file:', err);
            return null;
        }
    }

    async generate(prompt: string, placeholders: Record<string, string>, llm_model: string = this.DEFAULT_CHAT_LLM_PLATFORM) {
        const model = this.getModel(llm_model);
        const formattedPrompt = this.formatPrompt(prompt, placeholders);
        if (!model) return "Error: No model found";

        try {
            if (llm_model === LlmService.LLM_PLATFORM.AWSBEDROCK) {
                return await this.bedrockService.chatWithBedrock([{ role: "user", content: formattedPrompt }]);
            } else {
                const response = await model.invoke(formattedPrompt);
                if (typeof response === 'string') {
                    return response
                } else {
                    return response.content
                }

            }
        } catch (err: any) {
            console.error("Error generating AI response:", err.message);
            return "We're experiencing technical difficulties. Please try again later.";
        }
    }

    private formatPrompt(prompt: string, placeholders: Record<string, string>): string {
        for (const key in placeholders) {
            prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), placeholders[key]);
        }
        return `${prompt}\n\nCurrent Date and Time: ${new Date().toISOString()}`;
    }

    getEmbeddings(llmPlatform: string = this.DEFAULT_EMBEDDING_LLM_PLATFORM) {
        switch (llmPlatform) {
            case LlmService.LLM_PLATFORM.OPENAI:
            case LlmService.LLM_PLATFORM.OPENAI_MATURE:
                return new OpenAIEmbeddings({
                    openAIApiKey: this.OPENAI_KEY,
                    modelName: 'text-embedding-3-large'
                });

            case LlmService.LLM_PLATFORM.HUGGINGFACE:
                return new HuggingFaceInferenceEmbeddings({
                    apiKey: this.HF_KEY
                });

            case LlmService.LLM_PLATFORM.GOOGLEAI:
                return new GoogleGenerativeAIEmbeddings({
                    apiKey: this.GEMINI_KEY,
                    model: "text-embedding-004",
                    taskType: TaskType.RETRIEVAL_DOCUMENT
                });

            default:
                return null;
        }
    }

    async generateWithCitations(
        prompt: string,
        placeholders: Record<string, any>,
        llm_model: string = this.DEFAULT_CHAT_LLM_PLATFORM,
    ) {
        const model = this.getModel(llm_model);
        const schema = z.object({
            answer: z.string().describe('The answer to the user question based on the prompt'),
            citations: z.array(z.string()).describe(`References to unique slug_id within context`),
        });

        const jsonSchema = zodToJsonSchema(schema);
        placeholders['json_schema'] = JSON.stringify(jsonSchema);

        for (const key in placeholders) {
            prompt = prompt.replaceAll(`{${key}}`, placeholders[key]);
        }

        const chats: [string, string][] = [['system', prompt]];

        if (placeholders?.conversations?.length > 0) {
            for (let i = 0; i < placeholders.conversations.length; i += 2) {
                chats.push(['human', placeholders.conversations[i]]);
                chats.push(['assistant', placeholders.conversations[i + 1]]);
            }
        }

        if (placeholders?.question) {
            chats.push(['human', placeholders.question]);
        }

        try {
            if (!!model) {
                const result = await model.invoke(chats);
                const textResponse: string = typeof result === 'string'
                    ? result
                    : Array.isArray(result.content)
                        ? JSON.stringify(result.content) // Convert array to string
                        : String(result.content);

                const response = this.extractJsonFromText(textResponse);
                response.citations = response.citations?.map((x: any) =>
                    x.replaceAll(/\s*slug_id:\s*/gi, '').trim(),
                );
                return response;
            }

        } catch (err: any) {
            console.error('Error generating AI response:', err.message);
            throw new Error(err.message);
        }
    }

    async generateJsonWithConversation(
        prompt: string,
        placeholders: Record<string, any>,
        llm_model: string = this.DEFAULT_CHAT_LLM_PLATFORM,
    ) {
        const model = this.getModel(llm_model);

        for (const key in placeholders) {
            prompt = prompt.replaceAll(`{${key}}`, placeholders[key]);
        }

        const chats: [string, string][] = [['system', prompt]];

        if (placeholders?.conversations?.length > 0) {
            for (let i = 0; i < placeholders.conversations.length; i += 2) {
                chats.push(['human', placeholders.conversations[i]]);
                chats.push(['assistant', placeholders.conversations[i + 1]]);
            }
        }

        if (placeholders?.question) {
            chats.push(['human', placeholders.question]);
        }

        try {
            if (!!model) {
                let res;
                const result = await model.invoke(chats);
                if (typeof result === 'string') {
                    res = result
                } else {
                    res = result.content as string
                }
                return JSON.parse(res.replace(/^[^\[\{]*|[^\]\}]*$/g, ''));
            }

        } catch (err: any) {
            console.error('Error generating AI response:', err.message);
            return null;
        }
    }

    async generateMultiModel(
        mimeType: string,
        buffer: Buffer,
        prompt: string,
        placeholders: Record<string, any>,
        llm_model: string = this.DEFAULT_CHAT_LLM_PLATFORM,
    ) {
        const model = this.getModel(llm_model);

        for (const key in placeholders) {
            prompt = prompt.replaceAll(`{${key}}`, placeholders[key]);
        }

        const message = new HumanMessage({
            content: [
                {
                    type: 'text',
                    text: prompt,
                },
                {
                    type: 'image_url',
                    image_url: {
                        url: `data:${mimeType};base64,${buffer.toString('base64')}`,
                    },
                },
            ],
        });

        try {
            if (!!model) {
                const response = await model.invoke([message]);
                if (typeof response === 'string') {
                    return response
                } else {
                    return response.content
                }
                // return response.content;
            }

        } catch (err: any) {
            console.error('Error generating AI response:', err.message);
            throw new Error(err.message);
        }
    }
    public async generateJson(
        prompt: string,
        jsonInstruction: string,
        partialVariables: any,
        llmModel: any = this.DEFAULT_CHAT_LLM_PLATFORM
    ): Promise<any> {
        if (!prompt.includes("format_instructions")) {
            throw new Error("format_instructions placeholder missing in prompt");
        }

        const model = this.getModel(llmModel);
        const promptTemplate = new PromptTemplate({
            template: prompt,
            inputVariables: Object.keys(partialVariables),
            partialVariables: { format_instructions: jsonInstruction },
        });

        const input = await promptTemplate.format(partialVariables);
        let response: any;

        if (llmModel === LlmService.LLM_PLATFORM.AWSBEDROCK) {
            response = await this.bedrockService.chatWithBedrock([{ role: "user", content: input }]);
        } else {
            if (!!model) {
                const modelResponse = await model.invoke(input);
                if (typeof modelResponse === 'string') {
                    response = modelResponse
                } else {
                    response = modelResponse.content
                }
                // response = modelResponse.content || modelResponse;
            }
        }
        try {
            return JSON.parse(response.replace(/^[^\[\{]*|[^\]\}]*$/g, ""));
        } catch (error) {
            console.error("Error generating JSON:", response);
            throw new Error("Malformed JSON received. Unable to Parse.");
        }
    }

    extractJsonFromText(text: string): any {
        const jsonRegex = /{[^{}]*}/;
        // Find JSON within the text
        const jsonMatch = text.match(jsonRegex);
        if (jsonMatch) {
            try {
                // Parse the JSON if found
                return JSON.parse(jsonMatch[0]);
            } catch (error) {
                console.error('Error parsing JSON:', error);
            }
        }
        return {
            answer: text,
            citations: []
        };
    }

}
