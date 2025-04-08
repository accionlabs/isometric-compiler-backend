import multer from 'multer'
import { Request, Response, NextFunction } from "express";

export interface FileUploadOptions {
    maxSize?: number,
    allowedMimeTypes?: string[],
    fileNo?: 'single' | 'multiple',
    maxCount?: number
}
const storage = multer.memoryStorage();

export function fileUpload({ maxSize = 2 * 1024 * 1024,
    allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf"],
    fileNo = 'single',
    maxCount = 20
}: FileUploadOptions) {
    const upload = multer({
        storage,
        limits: { fileSize: maxSize }, // Set file size limit
        fileFilter: (req, file, cb) => {
            if (!allowedMimeTypes.includes(file.mimetype)) {
                return cb(new Error(`Invalid file type! Only ${allowedMimeTypes.join(", ")} allowed.`));
            }
            cb(null, true);
        },
    });

    return async function (req: Request, res: Response, next: NextFunction) {
        const multerMiddleware = fileNo === "multiple" ? upload.array("file", maxCount) : upload.single("file");

        multerMiddleware(req, res, (err: any) => {
            if (err) {
                return res.status(400).json({ message: err.message });
            }
            next();
        });
    }
}