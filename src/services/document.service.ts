import { Inject, Service } from "typedi";
import { Brackets, FindOptionsWhere, ILike } from "typeorm";
import { AppDataSource } from "../configs/database";
import { BaseService } from "./base.service";
import { Document, FileType } from "../entities/document.entity";
import { PgVectorService } from "./pgVector.service";
import { DiagramGeneratorAgent } from "../agents/diagram_generator_agent/diagramGeneratorAgent";
import { Document as VectorDocument } from "@langchain/core/documents"
import { UnifiedModelGenerator } from "../agents/unifiedModel";
import { Agents } from "../enums";
import { UnifiedModelWorkflow } from "../agents/workflows/unifiedModel";
import { UpdateMetadataDto } from "../validations/document.validation";
import ApiError from "../utils/apiError";

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

    @Inject(() => UnifiedModelWorkflow)
    private readonly unifiedModelWorkflow: UnifiedModelWorkflow

    async updateMetadata(id: number, metadataDto: UpdateMetadataDto): Promise<Document> {
        const document = await this.findOneById(id)

        if (!document) {
            throw new ApiError("Document not found", 404);
        }

        // Merge existing metadata with incoming updates
        const updatedMetadata = {
            ...document.metadata,
            ...metadataDto
        };

        document.metadata = updatedMetadata;
        return await this.getRepository().save(document);
    }

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
                fileName: file.originalname,
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




    async getDocumentsByUUID(uuid: string) {
        return this.getRepository().find({ where: { uuid } });
    }

    async search(query: string, { page = 1, limit = 10, filters }: {
        filters?: FindOptionsWhere<Document>,
        page?: number;
        limit?: number;
    }): Promise<{ data: Document[]; total: number; }> {
        const skip = limit * (page - 1)
        const repository = this.getRepository()
        const qb = repository
            .createQueryBuilder("document")
            .where(`
                to_tsvector('english', coalesce(
            (
                SELECT string_agg(tag, ' ')
                FROM jsonb_array_elements_text(document.metadata->'tags') AS tag
            ), ''
        )) ||
                to_tsvector('english', coalesce(document.metadata->>'fileName', '')) ||
                to_tsvector('english', coalesce(document.metadata->>'fileType', ''))
                @@ plainto_tsquery(:query)
            `, { query });

        if (filters) {
            qb.andWhere(filters);
        }

        const total = await qb.getCount();

        if (skip) {
            qb.skip(skip);
        }
        if (limit) {
            qb.take(limit);
        }

        const data = await qb.getMany();
        return { data, total };
    }

}