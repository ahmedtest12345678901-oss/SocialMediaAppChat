"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listFiles = exports.deleteFiles = exports.deleteFile = exports.createGetFilePreSignedUrl = exports.getFile = exports.createUploadFilePressignedUrl = exports.uploadFiles = exports.uploadLargeFile = exports.uploadFile = exports.s3Client = exports.StorageEnum = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const fs_1 = require("fs");
const uuid_1 = require("uuid");
const classError_1 = require("./classError");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
var StorageEnum;
(function (StorageEnum) {
    StorageEnum["disk"] = "disk";
    StorageEnum["cloud"] = "cloud";
})(StorageEnum || (exports.StorageEnum = StorageEnum = {}));
const s3Client = () => {
    return new client_s3_1.S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });
};
exports.s3Client = s3Client;
const uploadFile = async ({ storageType = StorageEnum.cloud, Bucket = process.env.AWS_BUCKET_NAME, path = "general", ACL = "private", file, }) => {
    const command = new client_s3_1.PutObjectCommand({
        Bucket,
        ACL,
        Key: `${process.env.APP_NAME}/${path}/${(0, uuid_1.v4)()}_${file.originalname}`,
        Body: storageType === StorageEnum.cloud ? file.buffer : (0, fs_1.createReadStream)(file.path),
        ContentType: file.mimetype,
    });
    await (0, exports.s3Client)().send(command);
    if (!command.input.Key) {
        throw new classError_1.AppError("Failed to upload file to S3", 500);
    }
    return command.input.Key;
};
exports.uploadFile = uploadFile;
const uploadLargeFile = async ({ storageType = StorageEnum.cloud, Bucket = process.env.AWS_BUCKET_NAME, path = "general", ACL = "private", file, }) => {
    const upload = new lib_storage_1.Upload({
        client: (0, exports.s3Client)(),
        params: {
            Bucket,
            ACL,
            Key: `${process.env.APP_NAME}/${path}/${(0, uuid_1.v4)()}_${file.originalname}`,
            Body: storageType === StorageEnum.cloud ? file.buffer : (0, fs_1.createReadStream)(file.path),
            ContentType: file.mimetype,
        }
    });
    upload.on("httpUploadProgress", (progress) => {
        console.log(progress);
    });
    const { Key } = await upload.done();
    if (!Key) {
        throw new classError_1.AppError("FAILED TO UPLOAD FILE TO S3 ", 500);
    }
    return Key;
};
exports.uploadLargeFile = uploadLargeFile;
const uploadFiles = async ({ storageType = StorageEnum.cloud, Bucket = process.env.AWS_BUCKET_NAME, path = "general", ACL = "private", files, useLarge = false }) => {
    let urls;
    if (useLarge) {
        urls = await Promise.all(files.map(file => (0, exports.uploadLargeFile)({ storageType, Bucket, path, ACL, file })));
    }
    else {
        urls = await Promise.all(files.map(file => (0, exports.uploadFile)({ storageType, Bucket, path, ACL, file })));
    }
    return urls;
};
exports.uploadFiles = uploadFiles;
const createUploadFilePressignedUrl = async ({ Bucket = process.env.AWS_BUCKET_NAME, path, originalname, ContentType, expiresIn = 60 * 60 }) => {
    const command = new client_s3_1.PutObjectCommand({
        Bucket,
        Key: `${process.env.APP_NAME}/${path}`,
        ContentType
    });
    const url = await (0, s3_request_presigner_1.getSignedUrl)((0, exports.s3Client)(), command, { expiresIn });
    return url;
};
exports.createUploadFilePressignedUrl = createUploadFilePressignedUrl;
const getFile = async ({ Bucket = process.env.AWS_BUCKET_NAME, Key, }) => {
    try {
        const command = new client_s3_1.GetObjectCommand({
            Bucket,
            Key,
        });
        const response = await (0, exports.s3Client)().send(command);
        return response;
    }
    catch (error) {
        console.error('Error in getFile:', error);
        throw error;
    }
};
exports.getFile = getFile;
const createGetFilePreSignedUrl = async ({ Bucket = process.env.AWS_BUCKET_NAME, Key, expiresIn = 60, downloadName }) => {
    try {
        console.log("Bucket:", Bucket);
        console.log("Key:", Key);
        const command = new client_s3_1.GetObjectCommand({
            Bucket,
            Key,
            ResponseContentDisposition: downloadName
                ? `attachment; filename="${downloadName}"`
                : undefined,
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)((0, exports.s3Client)(), command, { expiresIn });
        return url;
    }
    catch (error) {
        console.error("Error in createGetFilePreSignedUrl:", error);
        throw error;
    }
};
exports.createGetFilePreSignedUrl = createGetFilePreSignedUrl;
const deleteFile = async ({ Bucket = process.env.AWS_BUCKET_NAME, Key, }) => {
    try {
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket,
            Key,
        });
        return await (0, exports.s3Client)().send(command);
    }
    catch (error) {
        console.error('Error in deleteFile:', error);
        throw error;
    }
};
exports.deleteFile = deleteFile;
const deleteFiles = async (params) => {
    const { Bucket = process.env.AWS_BUCKET_NAME, Key, Quiet = false } = params;
    const keysArray = Array.isArray(Key) ? Key : [Key];
    const Objects = keysArray.map(key => ({ Key: key }));
    const command = new client_s3_1.DeleteObjectsCommand({
        Bucket,
        Delete: {
            Objects,
            Quiet
        }
    });
    return await (0, exports.s3Client)().send(command);
};
exports.deleteFiles = deleteFiles;
const listFiles = async ({ Bucket = process.env.AWS_BUCKET_NAME, path }) => {
    const command = new client_s3_1.ListObjectsV2Command({
        Bucket,
        Prefix: `${process.env.APP_NAME}/${path}`
    });
    return await (0, exports.s3Client)().send(command);
};
exports.listFiles = listFiles;
