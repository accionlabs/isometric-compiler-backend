import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { createWriteStream } from "fs";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ModelOperations } from "@vscode/vscode-languagedetection";
import simpleGit from 'simple-git';
import hljs from "highlight.js";
import archiver from "archiver";

export class GitInfoService {
    public async extractGitInfoInZip(repoUrl: string, uuid: string, isCloudStore: boolean): Promise<Express.Multer.File> {
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

            return this.createMulterFileFromBuffer(zipBuffer, `${repoName}.zip`, "application/zip");
        } catch (error) {
            console.error("Error:", error);
            throw error;
        } finally {
            fs.rmSync(tempDir, { recursive: true, force: true });
            fs.unlinkSync(zipPath);
        }
    }

    private createMulterFileFromBuffer(
        buffer: Buffer,
        originalname: string,
        mimetype: string,
        fieldname: string = 'file'
    ): Express.Multer.File {
        return {
            fieldname: fieldname,      // Field name specified in the form
            originalname: originalname, // Name of the file on the user's computer
            encoding: '7bit',          // Encoding type (typically '7bit' for binary files)
            mimetype: mimetype,        // Mime type of the file
            size: buffer.length,       // Size of the file in bytes
            buffer: buffer,            // The actual file data as Buffer
            stream: null as any,       // Not typically used when working with buffers
            destination: '',           // Not needed when working with buffers
            filename: '',              // Not needed when working with buffers
            path: ''                   // Not needed when working with buffers
        };
    }
}