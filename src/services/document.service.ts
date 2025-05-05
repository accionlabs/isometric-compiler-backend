import { Inject, Service } from "typedi";
import { AppDataSource } from "../configs/database";
import { BaseService } from "./base.service";
import { Document, FileType } from "../entities/document.entity";
import { PgVectorService } from "./pgVector.service";
import { DiagramGeneratorAgent } from "../agents/diagram_generator_agent/diagramGeneratorAgent";
import { Document as VectorDocument } from "@langchain/core/documents"
import { UnifiedModelGenerator } from "../agents/unifiedModel";
import { RepositoryAnalyzerAgent } from "../agents/git_extractor_agent/gitExtractorAgent";
import { Agents } from "../enums";
import { UnifiedModelWorkflow } from "../agents/workflows/unifiedModel";

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

    @Inject(() => UnifiedModelWorkflow)
    private readonly unifiedModelWorkflow: UnifiedModelWorkflow

    async handleImage(file: Express.Multer.File, uuid: string, fileUrl: string, agent: string, userId: number) {
        const result = await this.diagramGeneratorAgent.extractInfoFromImage(file.mimetype, file.buffer);
        const fileContent: VectorDocument = {
            pageContent: result?.toString() || '',
            metadata: {
                fileName: file.originalname,
                fileUrl,
                fileType: 'image',
                uuid: uuid
            }
        }
        const savedDocument = await this.saveAndIndexDocument(file, [fileContent], uuid, fileUrl, agent, FileType.image, userId)

        return { savedDocument };
    }

    async handlePdf(file: Express.Multer.File, uuid: string, fileUrl: string, agent: string, userId: number) {
        let fileContent = await this.pgVectorService.parsePdf(file, uuid);
        const savedDocument = await this.saveAndIndexDocument(file, fileContent, uuid, fileUrl, agent, FileType.pdf, userId)

        return { savedDocument };
    }

    private async saveAndIndexDocument(file: Express.Multer.File, fileContent: VectorDocument[], uuid: string, fileUrl: string, agent: string, fileType: FileType, userId: number) {
        const savedDocument = await this.create({
            uuid,
            content: fileContent.map((content) => content.pageContent).join('\n'), // result from above
            agent,
            metadata: {
                filename: file.originalname,
                fileType: FileType.image,
                fileUrl,
                mimetype: file.mimetype

            }
        });

        fileContent = fileContent.map((content) => {
            return { ...content, metadata: { ...content.metadata, fileName: file.originalname, documentId: savedDocument._id, fileUrl, fileType: fileType } };
        });
        await this.pgVectorService.indexDocument(file, fileContent);
        if (agent === Agents.ARCHITECTURE_AGENT) {
            this.diagramGeneratorAgent.generateIsometricJSONFromBlueprint(uuid, userId, file.originalname)
        } else {
            // const worklowResp = await this.unifiedModelWorkflow.startUnifiedModelWorkflow(uuid, savedDocument._id)
            // console.log("UnifiedModelWorkflow started", worklowResp);
            this.unifiedModelGenerator.regenerateUnifiedModel(uuid, agent, savedDocument._id, userId, file.originalname)
        }
        return savedDocument
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
        // this.unifiedModelGenerator.regenerateUnifiedModel(uuid);

        return { savedDocument };
    }



    async getDocumentsByUUID(uuid: string) {
        return this.getRepository().find({ where: { uuid } });
    }
}