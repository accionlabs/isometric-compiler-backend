import fs from "fs";
import path from "path";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ModelOperations } from "@vscode/vscode-languagedetection";
import simpleGit from 'simple-git';
import hljs from "highlight.js";
import { Inject, Service } from "typedi";
import { LlmService } from "../../services/llm.service";
import { LLM_PLATFORM } from "../../enums";

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


@Service()
export class RepositoryAnalyzerAgent {
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

    @Inject(() => LlmService)
    private readonly llmService: LlmService;


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
        if (langResult?.length > 0) {
            const bestMatch = langResult[0];
            if (bestMatch.confidence > 0.6) return bestMatch.languageId;
        }

        return "unknown";
    }

    public async splitContent(content: string, fileType: string): Promise<string[]> {
        let textSplitter;
        if (this.supportedList.includes(fileType)) {
            textSplitter = RecursiveCharacterTextSplitter.fromLanguage(fileType as "html" | "cpp" | "go" | "java" | "js" | "php" | "proto" | "python" | "rst" | "ruby" | "rust" | "scala" | "swift" | "markdown" | "latex" | "sol", {
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

    public async analyzeRepository({ repoUrl, promptType }: { repoUrl: string; promptType: 'HIGH' | 'LOW' }): Promise<any> {
        const repoName = repoUrl.split('/').pop()?.replace('.git', '') || '';
        const localPath = path.join(__dirname, '../../../repos', repoName);
        const repoPath = await this.cloneRepository(repoUrl, localPath);

        const allFiles = this.traverseDirectory(repoPath);
        console.log(`Found ${allFiles.length} relevant files.`);

        const classifiedFiles = allFiles.map(file => ({ file }));
        const llmBatch = await this.generateLLMBatch(classifiedFiles);
        const promptFilePath = path.join(__dirname, `REPO_STRUCTURE_PROMPT_${promptType.toUpperCase()}.md`);
        console.log("Prompt file path:", promptFilePath);
        const GIT_EXTRACTOR_PROMPT = fs.readFileSync(promptFilePath, "utf8").trim();
        const placeholders = {
            jsonBatch: JSON.stringify(llmBatch, null, 2),
        }
        return this.llmService.generateJsonWithConversation(GIT_EXTRACTOR_PROMPT, placeholders, LLM_PLATFORM.OPENAI)
        // return await this.sendToLLM(llmBatch, incomingRequest.promptType);
    }
}