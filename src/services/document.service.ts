import { Inject, Service } from "typedi";
import { AppDataSource } from "../configs/database";
import { BaseService } from "./base.service";
import { Document, FileType } from "../entities/document.entity";
import { PgVectorService } from "./pgVector.service";
import { DiagramGeneratorAgent } from "../agents/diagram_generator_agent/diagramGeneratorAgent";
import { Document as VectorDocument } from "@langchain/core/documents"
import { UnifiedModelGenerator } from "../agents/unifiedModel";
import { RepositoryAnalyzerAgent } from "../agents/git_extractor_agent/gitExtractorAgent";

@Service()
export class DocumentService extends BaseService<Document> {
    constructor() {
        super(AppDataSource.getRepository(Document));
    }

    @Inject(() => PgVectorService)
    private readonly pgVectorService: PgVectorService

    @Inject(() => DiagramGeneratorAgent)
    private readonly diagramGeneratorAgent: DiagramGeneratorAgent

    @Inject(() => UnifiedModelGenerator)
    private readonly unifiedModelGenerator: UnifiedModelGenerator

    @Inject(() => RepositoryAnalyzerAgent)
    private readonly repositoryAnalyzerAgent: RepositoryAnalyzerAgent

    async handleImage(file: Express.Multer.File, uuid: string, fileUrl: string) {
        const result = await this.diagramGeneratorAgent.extractInfoFromImage(file.mimetype, file.buffer);
        const savedDocument = await this.create({
            uuid,
            content: result?.toString(), // result from above
            metadata: {
                filename: file.originalname,
                fileType: FileType.image,
                fileUrl,
                mimetype: file.mimetype

            }
        });
        const fileContent: VectorDocument = {
            pageContent: result?.toString() || '',
            metadata: {
                documentId: savedDocument._id,
                fileName: file.originalname,
                fileUrl,
                fileType: 'image',
                uuid: uuid
            }
        }
        await this.pgVectorService.indexDocument(file, [fileContent]);
        this.unifiedModelGenerator.regenerateUnifiedModel(uuid);
        return { savedDocument };
    }

    async handlePdf(file: Express.Multer.File, uuid: string, fileUrl: string) {
        let fileContent = await this.pgVectorService.parsePdf(file, uuid);
        const fileContentText = fileContent.map((content) => content.pageContent).join("\n\n");
        const savedDocument = await this.create({
            uuid,
            content: fileContentText,// fileContentText from above
            metadata: {
                filename: file.originalname,
                fileType: FileType.image,
                fileUrl,
                mimetype: file.mimetype

            }
        });
        fileContent = fileContent.map((content) => {
            return { ...content, metadata: { ...content.metadata, fileName: file.originalname, documentId: savedDocument._id, fileUrl, fileType: 'pdf' } };
        });
        await this.pgVectorService.indexDocument(file, fileContent);
        this.unifiedModelGenerator.regenerateUnifiedModel(uuid);
        return { savedDocument };
    }

    async handleGitInformation({ repoUrl, file, uuid, fileUrl }: { repoUrl: string, file: Express.Multer.File, uuid: string, fileUrl: string }) {

        // Run both analyzeRepository calls in parallel
        const [highResponse, lowResponse] = await Promise.all([
            this.repositoryAnalyzerAgent.analyzeRepository({ repoUrl, promptType: 'HIGH' }),
            this.repositoryAnalyzerAgent.analyzeRepository({ repoUrl, promptType: 'LOW' })
        ]);

        console.log("Git Information:", highResponse, lowResponse);


        //merge response and save it in db
        const mergedResponse = {
            highLevel: highResponse,
            lowLevel: lowResponse
        };

        const savedDocument = await this.create({
            uuid,
            content: JSON.stringify(mergedResponse),
            metadata: {
                filename: file.originalname,
                fileType: FileType.repository,
                fileUrl,
                mimetype: file.mimetype
            }
        })

        const fileContent = {
            pageContent: JSON.stringify(mergedResponse),
            metadata: {
                documentId: savedDocument._id,
                fileName: file.originalname,
                fileUrl,
                fileType: 'repository',
                uuid
            }
        };

        this.pgVectorService.indexDocument(file, [fileContent]);
        this.unifiedModelGenerator.regenerateUnifiedModel(uuid);

        return { savedDocument };
    }

    async getDocumentsByUUID(uuid: string) {
        return this.getRepository().find({ where: { uuid } });
    }
}