import axios from "axios";
import { Service } from "typedi";
import xml2js from "xml2js";
import config from "../configs";

@Service()
export class WikiService {
    /**
     * Check if a string is valid XML.
     * @param data - The string to check.
     * @returns A boolean indicating if the string is XML.
     */
    private isXml(data: string): boolean {
        try {
            const parser = new xml2js.Parser();
            parser.parseString(data, (err: Error | null) => {
                if (err) {
                    throw new Error("Invalid XML");
                }
            });
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
        return new Promise((resolve, reject) => {
            xml2js.parseString(xmlData, { explicitArray: false }, (err: Error | null, result: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
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
            };

            const apiResponse = await axios.request(postConfig);
            let data = '';
            for await (const chunk of apiResponse.data) {
                data += chunk;
            }
            if (data.includes('<wiki_structure>')) {
                if (this.isXml(data)) {
                    const jsonData = await this.convertXmlToJson(data);
                    return jsonData;
                }
            }
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
