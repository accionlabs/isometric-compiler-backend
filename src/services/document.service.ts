import { Inject, Service } from "typedi";
import { AppDataSource } from "../configs/database";
import { BaseService } from "./base.service";
import { Document, FileType } from "../entities/document.entity";
import { PgVectorService } from "./pgVector.service";

@Service()
export class Documentervice extends BaseService<Document> {
    constructor() {
        super(AppDataSource.getRepository(Document));
    }

    @Inject(() => PgVectorService)
    private readonly pgVectorService: PgVectorService

    async handleImage(file: Express.Multer.File, uuid: string, fileUrl: string) {
        // const result = await extractInfoFromImage(file.mimetype, file.buffer, uuid);
        const savedDocument = await this.create({
            uuid,
            content: '',// result from above
            metadata: {
                filename: file.fieldname,
                fileType: FileType.image,
                fileUrl,
                mimetype: file.mimetype

            }
        });
        // const fileContent = {
        //     pageContent: result,
        //     metadata: {
        //         documentId: savedDocument.id,
        //         fileName: file.originalname,
        //         fileUrl,
        //         fileType: 'image',
        //         uuid: uuid
        //     }
        // }
        // await isometricPgVector.indexDocument(file, [fileContent]);
        // await regenerateUnifiedModel(uuid);
        return { savedDocument };
    }

    async handlePdf(file: Express.Multer.File, uuid: string, fileUrl: string) {
        let fileContent = await this.pgVectorService.parsePdf(file, uuid);
        const fileContentText = fileContent.map((content) => content.pageContent).join("\n\n");
        const savedDocument = await this.create({
            uuid,
            content: fileContentText,// fileContentText from above
            metadata: {
                filename: file.fieldname,
                fileType: FileType.image,
                fileUrl,
                mimetype: file.mimetype

            }
        });
        fileContent = fileContent.map((content) => {
            return { ...content, metadata: { ...content.metadata, fileName: file.originalname, documentId: savedDocument._id, fileUrl, fileType: 'pdf' } };
        });
        const indexedDoc = await this.pgVectorService.indexDocument(file, fileContent);
        // await regenerateUnifiedModel(uuid);
        return { savedDocument };
    }
}