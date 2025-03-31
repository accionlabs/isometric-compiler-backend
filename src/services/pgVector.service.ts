import { Inject, Service } from "typedi";
const __PG_ISOMTERIC_CONFIG = {
    tableName: 'isometric_vector',
    filter: {
        idColumnName: 'id',
        vectorColumnName: 'embeddings',
        contentColumnName: 'content',
        metadataColumnName: 'metadata',
    },
    distanceStrategy: "cosine"
}
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { TypeORMVectorStore } from "@langchain/community/vectorstores/typeorm";
import { Document } from "@langchain/core/documents"
import { dataSourceOption } from "../configs/database";
import { LlmService } from "./llm.service";

import path from "path";
import os from "os";
import { promises as fs } from "fs";


@Service()
export class PgVectorService {



    private typeOrmVectorStore: TypeORMVectorStore;

    constructor(@Inject(() => LlmService)
    private readonly llmService: LlmService) {
        const embed_config = this.llmService.getEmbeddings();
        if (!embed_config) throw new Error("No embedding service found");

        (async () => {
            this.typeOrmVectorStore = await TypeORMVectorStore.fromDataSource(
                embed_config,
                {
                    postgresConnectionOptions: dataSourceOption,
                    ...__PG_ISOMTERIC_CONFIG
                }
            );
            // await this.typeOrmVectorStore.ensureTableInDatabase();
        })()


    }

    async createContent(chunks: Document[]) {
        return this.typeOrmVectorStore.addDocuments(chunks)
    }

    async vectorSearch(query: string, filters: any) {
        const documents = await this.typeOrmVectorStore.similaritySearch(query, 20, filters)
        return documents;
    }

    async indexDocument(file: Express.Multer.File, fileContent: Document[]) {
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 500,
            chunkOverlap: 100,
        });

        if (!fileContent) { throw new Error("file is empty") }
        const documentId = fileContent[0]?.metadata?.documentId;
        const chunks = await textSplitter.transformDocuments(fileContent, {
            chunkHeader: `DOCUMENT NAME: ${file.originalname}, DOCUMENT ID: ${documentId} , DOCUMENT TYPE: ${file.mimetype}\n\n---\n\n`,
            appendChunkOverlapHeader: true,
        });
        return await this.createContent(chunks);


    };

    async indexImage(file: Express.Multer.File, fileUrl: string, uuid: string, documentId: string) {

        await this.typeOrmVectorStore.addDocuments([
            {
                pageContent: `IMAGE NAME: ${file.originalname}, IMAGE TYPE: ${file.mimetype}`, metadata: {
                    contentType: file.mimetype,
                    fileUrl: fileUrl,
                    uuid: uuid,
                    name: file.originalname,
                    documentId: documentId
                }
            },
        ]);
    };


    async parsePdf(file: Express.Multer.File, uuid: string) {
        const loader = new PDFLoader(new Blob([file.buffer], { type: file.mimetype }), {
            parsedItemSeparator: "",
        });
        return loader.parse(file.buffer, {
            fileContentType: file.mimetype,
            fileName: file.originalname,
            uuid: uuid,
            // document: fileId,
            type: "content",
            status: "active"
        });
    }

    async parseFile(file: Express.Multer.File, uuid: string): Promise<Document[]> {
        const fileMimeType = file.mimetype;
        const tempFilePath = path.join(os.tmpdir(), file.originalname);
        try {
            let loader;

            await fs.writeFile(tempFilePath, file.buffer);
            switch (file.mimetype) {
                case "text/plain":
                    loader = new TextLoader(tempFilePath);
                    break;
                case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
                    loader = new DocxLoader(tempFilePath);
                    break;
                }
                default:
                    throw new Error(`Unsupported file type: ${fileMimeType}`);
            }
            const documents = await loader.load();
            return documents.map((doc) => ({
                pageContent: doc.pageContent,
                metadata: {
                    fileContentType: file.mimetype,
                    fileName: file.originalname,
                    uuid: uuid,
                    type: "content",
                    status: "active",
                },
            }));

        } finally {
            await fs.unlink(tempFilePath).catch(() => { });
        }
    }

}