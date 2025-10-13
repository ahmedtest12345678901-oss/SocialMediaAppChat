import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, ObjectCannedACL, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createReadStream } from "fs";
import { v4 as uuidv4 } from "uuid";
import { AppError } from "./classError";
import { Upload } from "@aws-sdk/lib-storage";
import { S3 } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { number, string } from "zod";
import { url } from "inspector";
import { Command } from "concurrently";
export enum StorageEnum {
    disk = "disk",
    cloud = "cloud",
}

export const s3Client = () => {
    return new S3Client({
        region: process.env.AWS_REGION!,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
    });
};

export const uploadFile = async ({
    storageType = StorageEnum.cloud,
    Bucket = process.env.AWS_BUCKET_NAME!,
    path = "general",
    ACL = "private" as ObjectCannedACL,
    file,
}: {
    storageType?: StorageEnum;
    Bucket?: string;
    path: string;
    ACL?: ObjectCannedACL;
    file: Express.Multer.File;
}): Promise<string> => {
    const command = new PutObjectCommand({
        Bucket,
        ACL,
        Key: `${process.env.APP_NAME}/${path}/${uuidv4()}_${file.originalname}`,
        Body: storageType === StorageEnum.cloud ? file.buffer : createReadStream(file.path),
        ContentType: file.mimetype,
    });

    await s3Client().send(command);

    if (!command.input.Key) {
        throw new AppError("Failed to upload file to S3", 500);
    }

    return command.input.Key;

};

export const uploadLargeFile = async ({
    storageType = StorageEnum.cloud,
    Bucket = process.env.AWS_BUCKET_NAME!,
    path = "general",
    ACL = "private" as ObjectCannedACL,
    file,
}: {
    storageType?: StorageEnum;
    Bucket?: string;
    path: string;
    ACL?: ObjectCannedACL;
    file: Express.Multer.File;
}): Promise<string> => {
    const upload = new Upload({
        client: s3Client(),
        params: {
            Bucket,
            ACL,
            Key: `${process.env.APP_NAME}/${path}/${uuidv4()}_${file.originalname}`,
            Body: storageType === StorageEnum.cloud ? file.buffer : createReadStream(file.path),
            ContentType: file.mimetype,
        }
    })

    upload.on("httpUploadProgress", (progress) => {
        console.log(progress);
    });
    const { Key } = await upload.done()
    if (!Key) {
        throw new AppError("FAILED TO UPLOAD FILE TO S3 ", 500)
    }
    return Key
}


export const uploadFiles = async ({
    storageType = StorageEnum.cloud,
    Bucket = process.env.AWS_BUCKET_NAME!,
    path = "general",
    ACL = "private" as ObjectCannedACL,
    files,
    useLarge = false
}: {
    storageType?: StorageEnum;
    Bucket?: string;
    path: string;
    ACL?: ObjectCannedACL;
    files: Express.Multer.File[];
    useLarge?: boolean;
}) => {
    let urls: string[];

    if (useLarge) {
        urls = await Promise.all(files.map(file => uploadLargeFile({ storageType, Bucket, path, ACL, file })));
    } else {
        urls = await Promise.all(files.map(file => uploadFile({ storageType, Bucket, path, ACL, file })));
    }

    return urls;
};



////////////////////////////////////////////////

export const createUploadFilePressignedUrl = async (
    {
        Bucket = process.env.AWS_BUCKET_NAME!,
        path,
        originalname,
        ContentType,
        expiresIn = 60 * 60
    }: {
        Bucket?: string;
        path: string;
        originalname: string;
        ContentType: string;
        expiresIn?: number;
    }
) => {


    const command = new PutObjectCommand({
        Bucket,
        Key: `${process.env.APP_NAME}/${path}`,
        ContentType
    })
    const url = await getSignedUrl(s3Client(), command, { expiresIn })
    return url
}


export const getFile = async ({
    Bucket = process.env.AWS_BUCKET_NAME!,
    Key,
}: {
    Bucket?: string;
    Key: string;
}) => {
    try {
        const command = new GetObjectCommand({
            Bucket,
            Key,
        });

        const response = await s3Client().send(command);
        return response;
    } catch (error) {
        console.error('Error in getFile:', error);
        throw error;
    }
};


export const createGetFilePreSignedUrl = async ({
    Bucket = process.env.AWS_BUCKET_NAME!,
    Key,
    expiresIn = 60,
    downloadName
}: {
    Bucket?: string;
    Key: string;
    expiresIn?: number;
    downloadName?: string | undefined;
}) => {
    try {
        console.log("Bucket:", Bucket);
        console.log("Key:", Key);

        const command = new GetObjectCommand({
            Bucket,
            Key,
            ResponseContentDisposition: downloadName
                ? `attachment; filename="${downloadName}"`
                : undefined,
        });

        const url = await getSignedUrl(s3Client(), command, { expiresIn });
        return url;
    } catch (error) {
        console.error("Error in createGetFilePreSignedUrl:", error);
        throw error;
    }
};


export const deleteFile = async ({
    Bucket = process.env.AWS_BUCKET_NAME!,
    Key,
}: {
    Bucket?: string;
    Key: string;
}) => {
    try {
        const command = new DeleteObjectCommand({
            Bucket,
            Key,
        });
        return await s3Client().send(command);
    } catch (error) {
        console.error('Error in deleteFile:', error);
        throw error;
    }
};




export const deleteFiles = async (
    params: {
        Bucket?: string;
        Key: string | string[];
        Quiet?: boolean;
    }
) => {
    const {
        Bucket = process.env.AWS_BUCKET_NAME!,
        Key,
        Quiet = false
    } = params;

    const keysArray = Array.isArray(Key) ? Key : [Key];

    const Objects = keysArray.map(key => ({ Key: key }));

    const command = new DeleteObjectsCommand({
        Bucket,
        Delete: {
            Objects,
            Quiet
        }
    });

    return await s3Client().send(command);
};



export const listFiles = async ({
    Bucket = process.env.AWS_BUCKET_NAME!,
    path
}: {
    Bucket?: string;
    path: string;
}) => {
    const command = new ListObjectsV2Command({
        Bucket,
        Prefix: `${process.env.APP_NAME}/${path}`
    });

    return await s3Client().send(command);
};
