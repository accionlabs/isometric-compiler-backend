import { Inject, Service } from "typedi";
import { AppDataSource } from "../configs/database";
import { BaseService } from "./base.service";
import { Document, FileType } from "../entities/document.entity";
import { PgVectorService } from "./pgVector.service";
import { DiagramGeneratorAgent } from "../agents/diagram_generator_agent/diagramGeneratorAgent";
import { Document as VectorDocument } from "@langchain/core/documents"
import { UnifiedModelGenerator } from "../agents/unifiedModel";
import { Agents } from "../enums";

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

    async handleImage(file: Express.Multer.File, uuid: string, fileUrl: string, agent: string) {
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
        const savedDocument = await this.saveAndIndexDocument(file, [fileContent], uuid, fileUrl, agent, FileType.image)

        return { savedDocument };
    }

    async handlePdf(file: Express.Multer.File, uuid: string, fileUrl: string, agent: string) {
        let fileContent = await this.pgVectorService.parsePdf(file, uuid);
        const savedDocument = await this.saveAndIndexDocument(file, fileContent, uuid, fileUrl, agent, FileType.pdf)

        return { savedDocument };
    }

    private async saveAndIndexDocument(file: Express.Multer.File, fileContent: VectorDocument[], uuid: string, fileUrl: string, agent: string, fileType: FileType) {
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
            this.diagramGeneratorAgent.generateIsometricJSONFromBlueprint(uuid, file.originalname)
        } else {
            this.unifiedModelGenerator.regenerateUnifiedModel(uuid, agent, savedDocument._id, file.originalname);
        }
        return savedDocument
    }




    async getDocumentsByUUID(uuid: string) {
        return this.getRepository().find({ where: { uuid } });
    }
}