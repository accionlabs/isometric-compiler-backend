import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { createWriteStream } from "fs";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ModelOperations } from "@vscode/vscode-languagedetection";
import { GoogleGenerativeAI } from '@google/generative-ai';
import simpleGit from 'simple-git';
import hljs from "highlight.js";
import { getPrompt, getModel } from '../../services/llm';
import archiver from "archiver";
import { uploadFile } from "../../services/s3BucketService";

interface FileMetadata {
    filePath: string;
    fileType: string;
    chunks: string[];
}

interface ClassifiedFile {
    file: string;
}

interface LLMBatch {
    repository: string;
    files: FileMetadata[];
}

interface UploadResponse {
    s3Url: string;
    [key: string]: any;
}

interface RepoMetadata {
    mimetype: string;
    originalname: string;
    fileUrl: string;
    fileType: string;
    uuid: string;
}

export class RepositoryAnalyzerAgent {
    private genAI: GoogleGenerativeAI;
    private supportedList = ["html", "cpp", "go", "java", "js", "php", "proto", "python", "rst", "ruby", "rust", "scala", "swift", "markdown", "latex", "sol"];
    private extensionMap: Record<string, string> = {
        js: "javascript",
        ts: "typescript",
        py: "python",
        java: "java",
        cpp: "cpp",
        cs: "csharp",
        go: "go",
        php: "php",
        rb: "ruby",
        html: "html",
        css: "css",
        json: "json",
        sh: "shell",
    };

    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
    }

    public async cloneRepository(repoUrl: string, localPath: string): Promise<string> {
        const gitPath = path.join(localPath, '.git');

        if (fs.existsSync(localPath) && fs.existsSync(gitPath)) {
            console.log(`Repository already exists at ${localPath}. Fetching latest changes...`);
            try {
                await simpleGit(localPath).pull();
            } catch (error) {
                console.error(`Error pulling latest changes: ${error instanceof Error ? error.message : String(error)}`);
            }
        } else {
            if (fs.existsSync(localPath)) {
                console.log(`Directory ${localPath} exists but is not a valid Git repository. Removing...`);
                fs.rmSync(localPath, { recursive: true, force: true });
            }

            console.log(`Cloning repository: ${repoUrl} into ${localPath}...`);
            try {
                await simpleGit().clone(repoUrl, localPath);
                console.log("Repository cloned successfully.");
            } catch (error) {
                console.error(`Error cloning repository: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        return localPath;
    }

    public traverseDirectory(
        dirPath: string,
        excludeDirs: string[] = ["node_modules", "dist", ".git", "out", "build", "__pycache__", "vendor"],
        excludeFiles: string[] = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml", ".gitignore", "manifest.json", "robots.txt", "LICENSE", "README.md"],
        excludeExtensions: string[] = [".lock", ".png", ".jpg", ".jpeg", ".ico", ".svg", ".gif", ".webp", ".min.js", ".min.css", ".css", ".scss", ".sass", ".less", ".md", ".rst", ".txt"]
    ): string[] {
        console.log("Traversing directory:", dirPath);
        try {
            let fileList: string[] = [];

            const readDir = (dir: string) => {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    const fullPath = path.join(dir, file);
                    const stat = fs.statSync(fullPath);
                    const fileName = path.basename(file);

                    if (stat.isDirectory() && !excludeDirs.includes(file)) {
                        readDir(fullPath);
                    } else if (
                        stat.isFile() &&
                        !excludeFiles.includes(fileName) &&
                        !excludeExtensions.some(ext => file.endsWith(ext))
                    ) {
                        fileList.push(fullPath);
                    }
                }
            };

            readDir(dirPath);
            return fileList;
        } catch (error) {
            console.error("Error traversing directory:", error instanceof Error ? error.message : String(error));
            return [];
        }
    }

    public async detectFileType(content: string, filePath: string): Promise<string> {
        console.log("Detecting file type for:", filePath);
        const ext = filePath.split(".").pop()?.toLowerCase() || '';
        if (this.extensionMap[ext]) return this.extensionMap[ext];

        const hljsResult = hljs.highlightAuto(content);
        if (hljsResult?.language) return hljsResult.language;

        const modelOperations = new ModelOperations();
        const langResult = await modelOperations.runModel(content);
        if (langResult?.languages?.length > 0) {
            const bestMatch = langResult.languages[0];
            if (bestMatch.confidence > 0.6) return bestMatch.languageId;
        }

        return "unknown";
    }

    public async splitContent(content: string, fileType: string): Promise<string[]> {
        let textSplitter;
        if (this.supportedList.includes(fileType)) {
            textSplitter = RecursiveCharacterTextSplitter.fromLanguage(fileType, {
                chunkSize: 500,
                chunkOverlap: 50
            });
        } else {
            textSplitter = new RecursiveCharacterTextSplitter({
                chunkSize: 500,
                chunkOverlap: 50
            });
        }
        return await textSplitter.splitText(content);
    }

    public async extractMetadata(filePath: string): Promise<FileMetadata | undefined> {
        try {
            const content = fs.readFileSync(filePath, "utf8");
            const fileType = await this.detectFileType(content, filePath);
            const chunks = await this.splitContent(content, fileType);
            return { filePath, fileType, chunks };
        } catch (error) {
            console.log(error);
            return undefined;
        }
    }

    public async generateLLMBatch(classifiedFiles: ClassifiedFile[]): Promise<LLMBatch> {
        const batch: LLMBatch = { repository: "Project", files: [] };
        for (const file of classifiedFiles) {
            const metadata = await this.extractMetadata(file.file);
            if (metadata) {
                batch.files.push(metadata);
            }
        }
        return batch;
    }

    public async constructPrompt(jsonBatch: LLMBatch, promptType: string): Promise<string> {
        try {
            const promptFilePath = path.join(__dirname, `REPO_STRUCTURE_PROMPT_${promptType.toUpperCase()}.md`);
            console.log("Prompt file path:", promptFilePath);
            let prompt = fs.readFileSync(promptFilePath, "utf8").trim();
            if (!prompt) {
                throw new Error("Prompt file is empty or not found.");
            }

            const jsonInput = JSON.stringify(jsonBatch, null, 2);
            prompt = prompt.replace("{jsonBatch}", jsonInput);

            return prompt;
        } catch (error) {
            console.error("Error constructing prompt:", error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    public async sendToLLM(jsonBatch: LLMBatch, promptType: string): Promise<any> {
        try {
            const prompt = await this.constructPrompt(jsonBatch, promptType);
            const model = getModel('GEMINI');

            const response = await model.invoke([
                'system', prompt
            ]);

            if (!response || !response.content) {
                throw new Error("Invalid response from LLM");
            }
            const result = response.content;
            const sanitizedResult = result.replace(/```json|```/g, "").trim();
            try {
                return JSON.parse(sanitizedResult);
            } catch (parseError) {
                console.error("Failed to parse JSON:", parseError);
                return null;
            }
        } catch (error) {
            console.error("Error sending data to LLM:", error);
            return null;
        }
    }

    public async analyzeRepository(incomingRequest: { repoUrl: string; promptType: string }): Promise<any> {
        const repoUrl = incomingRequest.repoUrl;
        const repoName = repoUrl.split('/').pop()?.replace('.git', '') || '';
        const localPath = path.join(__dirname, '../../../repos', repoName);
        const repoPath = await this.cloneRepository(repoUrl, localPath);

        const allFiles = this.traverseDirectory(repoPath);
        console.log(`Found ${allFiles.length} relevant files.`);

        const classifiedFiles = allFiles.map(file => ({ file }));
        const llmBatch = await this.generateLLMBatch(classifiedFiles);
        return await this.sendToLLM(llmBatch, incomingRequest.promptType);
    }

    private getRepoName(repoUrl: string): string {
        return repoUrl.split("/").pop()?.replace(".git", "") || '';
    }

    public async uploadGitRepo(repoUrl: string, uuid: string, isCloudStore: boolean): Promise<{ fileUrl: string; metadata: RepoMetadata }> {
        const repoName = this.getRepoName(repoUrl);
        const tempDir = path.join(__dirname, `repo-${uuid}`);
        const zipPath = `${tempDir}.zip`;

        try {
            console.log("Cloning repository...");
            await this.execPromise(`git clone ${repoUrl} ${tempDir}`);

            console.log("Zipping repository...");
            await this.zipDirectory(tempDir, zipPath);

            const zipBuffer = fs.readFileSync(zipPath);
            const zipFile = {
                originalname: `${repoName}.zip`,
                mimetype: "application/zip",
                buffer: zipBuffer,
            };

            console.log("Uploading to S3...");
            const uploadResponse = await uploadFile("git-repos/", zipFile);
            const fileUrl = uploadResponse.s3Url;

            console.log("Repository uploaded to:", uploadResponse);
            const metadata: RepoMetadata = {
                mimetype: "application/zip",
                originalname: `${repoName}.zip`,
                fileUrl: fileUrl,
                fileType: "git-repo-zip",
                uuid: uuid
            };
            return { fileUrl, metadata };
        } catch (error) {
            console.error("Error:", error);
            throw error;
        } finally {
            fs.rmSync(tempDir, { recursive: true, force: true });
            fs.unlinkSync(zipPath);
        }
    }

    private execPromise(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) return reject(error);
                resolve(stdout || stderr);
            });
        });
    }

    private zipDirectory(sourceDir: string, outPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const output = createWriteStream(outPath);
            const archive = archiver("zip", { zlib: { level: 9 } });

            output.on("close", resolve);
            archive.on("error", reject);

            archive.pipe(output);
            archive.directory(sourceDir, false);
            archive.finalize();
        });
    }
}