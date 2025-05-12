import axios from "axios";
import { Service } from "typedi";
import xml2js from "xml2js";
import config from "../configs";

@Service()
export class WikiService {

    private async isXml(data: string): Promise<boolean> {
        try {
            await xml2js.parseStringPromise(data);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Convert XML data to JSON.
     * @param xmlData - The XML string to convert.
     * @returns A Promise resolving to the JSON representation of the XML.
     */
    private async convertXmlToJson(xmlData: string): Promise<any> {
        const result = await xml2js.parseStringPromise(xmlData, { explicitArray: false });
        interface Page {
            $?: { id?: string };
            title?: string;
            description?: string;
            importance?: string;
            relevant_files?: { file_path?: string | string[] };
            related_pages?: { related?: string | string[] };
        }

        const structuredJson = {
            title: result?.wiki_structure?.title,
            description: result?.wiki_structure?.description,
            pages: (result?.wiki_structure?.pages?.page as Page[] | undefined)?.map((page) => ({
                id: page?.$?.id,
                title: page?.title,
                description: page?.description,
                importance: page?.importance,
                relevant_files: Array.isArray(page?.relevant_files?.file_path)
                    ? page?.relevant_files?.file_path
                    : [page?.relevant_files?.file_path].filter(Boolean),
                related_pages: Array.isArray(page?.related_pages?.related)
                    ? page?.related_pages?.related
                    : [page?.related_pages?.related].filter(Boolean),
            })) || [],
        };

        console.log(JSON.stringify(structuredJson, null, 2));
        return structuredJson;
    }

    /**
    * Fetch data from a GitHub repository and process the response.
    * @param githubUrl - The GitHub repository URL.
    * @param gitToken - The GitHub personal access token.
    * @param prompt - Additional prompt or query parameter.
    * @returns A Promise resolving to the processed API response.
    */
    async fetchGitHubWikiData(githubUrl: string, gitToken: string, prompt: string): Promise<any> {
        try {
            const requestBody = {
                repo_url: githubUrl.trim(),
                messages: [{ role: "user", content: prompt.trim() }],
            };
            const postConfig = {
                method: 'post',
                maxBodyLength: Infinity,
                url: `${config.WIKI_URL}/chat/completions/stream`,
                headers: {
                    'Content-Type': 'application/json',
                },
                data: JSON.stringify(requestBody),
                responseType: "stream" as const
            };


            const apiResponse = await axios.request(postConfig);

            let data = '';
            apiResponse.data.on('data', (chunk: Buffer) => {
                data += chunk.toString(); // Convert the chunk to a string and append it
            });

            await new Promise((resolve, reject) => {
                apiResponse.data.on('end', resolve); // Resolve when the stream ends
                apiResponse.data.on('error', reject); // Reject if there's an error
            });
            if (data.includes('<wiki_structure>')) {
                if (await this.isXml(data)) {
                    const jsonData = await this.convertXmlToJson(data);
                    console.log("Converted JSON data:", jsonData);
                    return jsonData;
                }
            }
            console.log("Response data:", data);
            return data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error("Error fetching GitHub Wiki data:", {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data?.detail || error.response?.data,
                });
            } else {
                console.error("Error fetching GitHub Wiki data:", error);
            }
            throw error;
        }
    }
}
