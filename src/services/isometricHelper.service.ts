// import isometricPgVector from "./isometricPgVector";
// import isometricQuery from "./isometricQuery";
// import { generateJSONFromImage } from "../agents/diagram_generator_agent/diagramGeneratorAgent";
// import { regenerateUnifiedModel } from "../agents/unifiedModel";
// import httpRequest from "../helpers/http-request";
// import config from "../config";

import { Service } from "typedi";
import { BaseService } from "./base.service";
import { Chat } from "../entities/chat.entity";

interface File {
    mimetype: string;
    buffer: Buffer;
    originalname: string;
}

interface SavedDocument {
    id: string;
}

interface FileContent {
    pageContent: string;
    metadata: {
        documentId: string;
        fileName: string;
        fileUrl: string;
        fileType: string;
        uuid: string;
        isometric?: any;
        result?: any;
    };
}

@Service()
export class IsometricService extends BaseService<Chat> {
    // async  handleImage(file: File, uuid: string, fileUrl: string): Promise<{ savedDocument: SavedDocument }> {
        // const result = await generateJSONFromImage(file.mimetype, file.buffer, uuid);
        // const stringifiedResult = JSON.stringify(result.result);
        // const savedDocument = await isometricQuery.saveDocument(file, stringifiedResult, uuid, fileUrl, "image");
        // const fileContent: FileContent = {
        //     pageContent: `Image Description:${result.description}\n Image Content:${stringifiedResult}`,
        //     metadata: {
        //         documentId: savedDocument.id,
        //         fileName: file.originalname,
        //         fileUrl,
        //         fileType: "image",
        //         uuid,
        //         isometric: result.isometric,
        //         result: result.result,
        //     },
        // };
        // await isometricPgVector.indexDocument(file, [fileContent]);
        // return { savedDocument };
    // }
    
    // export async  handlePdf(file: File, uuid: string, fileUrl: string): Promise<{ savedDocument: SavedDocument }> {
        // let fileContent = await isometricPgVector.parsePdf(file, uuid);
        // const fileContentText = fileContent.map((content) => content.pageContent).join("\n\n");
        // const savedDocument = await isometricQuery.saveDocument(file, fileContentText, uuid, fileUrl, "pdf");
        // fileContent = fileContent.map((content) => {
        //     return {
        //         ...content,
        //         metadata: {
        //             ...content.metadata,
        //             fileName: file.originalname,
        //             documentId: savedDocument.id,
        //             fileUrl,
        //             fileType: "pdf",
        //         },
        //     };
        // });
        // await isometricPgVector.indexDocument(file, fileContent);
        // regenerateUnifiedModel(uuid);
        // return { savedDocument };
    // }
    
    // export async  getShapes(): Promise<any> {
        // const headers = {
        //     "api-key": `${config.ISOMETRIC_API_KEY}`,
        // };
        // const url = `${config.ISOMETRIC_BACKEND_URL}/shapes`;
        // return await httpRequest.getRequest(url, headers);
    // }
}


