import { Service } from 'typedi';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import config from '../configs/llmmodel';
import { PromptTemplate } from '@langchain/core/prompts';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { HarmBlockThreshold, HarmCategory, TaskType } from '@google/generative-ai';
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { LLM_PLATFORM } from '../enums';


@Service()
export class LlmService {

    private readonly OPENAI_KEY = config.OPENAI_KEY;
    private readonly OPENAI_DEFAULT_MODEL = config.OPENAI_DEFAULT_MODEL;
    private readonly OPENAI_MATURE_MODEL = config.OPENAI_MATURE_MODEL;
    private readonly GEMINI_KEY = config.GEMINI_KEY;
    private readonly DEFAULT_CHAT_LLM_PLATFORM = config.DEFAULT_CHAT_LLM_PLATFORM;
    private readonly GEMINI_DEFAULT_MODEL = config.GEMINI_DEFAULT_MODEL;
    private readonly DEFAULT_EMBEDDING_LLM_PLATFORM = config.DEFAULT_EMBEDDING_LLM_PLATFORM;


    getModel(llmPlatform: string = this.DEFAULT_CHAT_LLM_PLATFORM) {
        switch (llmPlatform) {

            case LLM_PLATFORM.OPENAI:
                return new ChatOpenAI({
                    modelName: this.OPENAI_DEFAULT_MODEL,
                    openAIApiKey: this.OPENAI_KEY,
                    temperature: 0
                });

            case LLM_PLATFORM.OPENAI_MATURE:
                return new ChatOpenAI({
                    modelName: this.OPENAI_MATURE_MODEL,
                    openAIApiKey: this.OPENAI_KEY,
                    temperature: 0
                });

            case LLM_PLATFORM.GOOGLEAI:
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

            default:
                return null;
        }
    }

    async generate(prompt: string, placeholders: Record<string, string>, llm_model: string = this.DEFAULT_CHAT_LLM_PLATFORM) {
        const model = this.getModel(llm_model);
        const formattedPrompt = this.formatPrompt(prompt, placeholders);
        if (!model) return "Error: No model found";

        try {
            const response = await model.invoke(formattedPrompt);
            if (typeof response === 'string') {
                return response
            } else {
                return response.content
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
            case LLM_PLATFORM.OPENAI:
            case LLM_PLATFORM.OPENAI_MATURE:
                return new OpenAIEmbeddings({
                    openAIApiKey: this.OPENAI_KEY,
                    modelName: 'text-embedding-3-large'
                });

            case LLM_PLATFORM.GOOGLEAI:
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

    // Utility: Merge chunks to fit within a token limit
    private mergeChunks(chunks: string[], maxLength: number): string[] {
        const merged: string[] = [];
        let current = "";

        for (const chunk of chunks) {
            if (current.length + chunk.length < maxLength) {
                current += chunk + "\n";
            } else {
                merged.push(current);
                current = chunk;
            }
        }
        if (current) merged.push(current);

        return merged;
    }

    // Function: Process PDF chunks efficiently without chat history
    async generateJsonSequentially(
        contextChunks: string[],
        promptTemplate: string,
        dependentVariales: Record<string, string>,
        llm_model: string = this.DEFAULT_CHAT_LLM_PLATFORM,
        maxTokensPerBatch = 5000,
    ) {
        const model = this.getModel(llm_model);
        if (!model) throw new Error("No model has been assigned");

        const combinedChunks = this.mergeChunks(contextChunks, maxTokensPerBatch);

        let accumulatedResult: any = {};

        for (const chunk of combinedChunks) {
            try {
                if (!promptTemplate.includes('{__CONTEXT__}')) {
                    promptTemplate = promptTemplate + '\n```{__CONTEXT__}```';
                }
                dependentVariales.__CONTEXT__ = chunk;
                dependentVariales.previousResult = JSON.stringify(accumulatedResult);
                promptTemplate = `${promptTemplate}\n\n we are giving context in chunks consider the previously generated result as follows \n{previousResult}\n and merge it with newly generated result`;
                for (const key in dependentVariales) {
                    promptTemplate = promptTemplate.replaceAll(`{${key}}`, dependentVariales[key]);
                }


                const chats: [string, string][] = [['system', promptTemplate]];

                if (dependentVariales?.conversations?.length > 0) {
                    for (let i = 0; i < dependentVariales.conversations.length; i += 2) {
                        chats.push(['human', dependentVariales.conversations[i]]);
                        chats.push(['assistant', dependentVariales.conversations[i + 1]]);
                    }
                }

                if (dependentVariales?.question) {
                    chats.push(['human', dependentVariales.question]);
                }


                const response = await model.invoke(chats);

                let res
                // Parse the new result and merge with accumulated data
                if (typeof response === 'string') {
                    res = response
                } else {
                    res = response.content as string
                }
                accumulatedResult = JSON.parse(res.replace(/^[^\[\{]*|[^\]\}]*$/g, ''));

            } catch (error) {
                console.error(`Error processing chunk: ___________________ ${error}`);
                // Continue with next chunk even if current fails
            }
        }

        return accumulatedResult;
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

        if (!!model) {
            const modelResponse = await model.invoke(input);
            if (typeof modelResponse === 'string') {
                response = modelResponse
            } else {
                response = modelResponse.content
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
