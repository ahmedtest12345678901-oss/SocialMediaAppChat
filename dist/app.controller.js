"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({ path: (0, path_1.resolve)("./config/.env") });
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_1 = __importDefault(require("express"));
const classError_1 = require("./utils/classError");
const user_controller_1 = __importDefault(require("./moduels/users/user.controller"));
const connectionDB_1 = __importDefault(require("./DataBase/connectionDB"));
const s3_config_1 = require("./utils/s3.config");
const promises_1 = require("stream/promises");
const post_controller_1 = __importDefault(require("./moduels/posts/post.controller"));
const geteway_1 = require("./moduels/geteway/geteway");
const express_2 = require("graphql-http/lib/use/express");
const schema_glq_1 = require("./moduels/garphQL/schema.glq");
const authentication_1 = require("./middleware/authentication");
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
const bootstarp = async () => {
    app.use(express_1.default.json());
    app.use((0, cors_1.default)({ origin: "*" }));
    app.use((0, helmet_1.default)());
    app.all('/graphql', (0, authentication_1.Authentication)(), (0, express_2.createHandler)({ schema: schema_glq_1.schemaGQL, context: (req) => ({ req }) }));
    app.get("/upload/pre-signed/*path", async (req, res, next) => {
        try {
            const { path } = req.params;
            const { downloadName } = req.query;
            const Key = path.join("/");
            const url = await (0, s3_config_1.createGetFilePreSignedUrl)({
                Key,
                downloadName: downloadName ? downloadName : undefined,
            });
            console.log("Pre-signed URL:", url);
            return res.status(200).json({ message: "success", url });
        }
        catch (error) {
            next(error);
        }
    });
    app.get("/upload/delete/*path", async (req, res, next) => {
        const { path } = req.params;
        const Key = path.join("/");
        const result = await (0, s3_config_1.deleteFile)({
            Key,
        });
        return res.status(200).json({ message: "success", result });
    });
    app.get("/upload/delete", async (req, res, next) => {
        try {
            const result = await (0, s3_config_1.deleteFiles)({
                Key: [
                    "SocialMediaApp/users/68c877656580fb315c2c8806/d176c9cc-51d6-4fab-b30a-9499dc5338e4_sa-mp-000.png",
                    "SocialMediaApp/users/68c877656580fb315c2c8806/d176c9cc-51d6-4fab-b30a-9499dc5338e4_sa-mp-001.png"
                ],
                Quiet: false
            });
            return res.status(200).json({
                message: "Deleted files (or some not found)",
                result
            });
        }
        catch (error) {
            next(error);
        }
    });
    app.get("/upload", async (req, res, next) => {
        try {
            const folderPath = "users/68c877656580fb315c2c8806";
            const result = await (0, s3_config_1.listFiles)({
                path: folderPath
            });
            if (!result?.Contents || result.Contents.length === 0) {
                throw new classError_1.AppError("No files found", 404);
            }
            const fileKeys = result.Contents.map(item => item.Key);
            return res.status(200).json({
                message: "Files retrieved successfully",
                files: fileKeys
            });
        }
        catch (error) {
            next(error);
        }
    });
    app.get("/upload/*path", async (req, res, next) => {
        try {
            const { path } = req.params;
            const { downloadName } = req.query;
            const Key = path.join("/");
            const result = await (0, s3_config_1.getFile)({ Key });
            const stream = result.Body;
            res.set("cross-origin-resource-policy", "cross-origin");
            res.setHeader("Content-Type", result?.ContentType || "application/octet-stream");
            if (downloadName) {
                res.setHeader("Content-Disposition", `attachment; filename="${downloadName || path.join("/").split("/").pop()}"`);
            }
            await (0, promises_1.pipeline)(stream, res);
        }
        catch (error) {
            next(error);
        }
    });
    app.use("/users", user_controller_1.default);
    app.use("/posts", post_controller_1.default);
    await (0, connectionDB_1.default)();
    app.get("/", (req, res, next) => {
        return res.status(200).json({ message: "Hello on my app..... " });
    });
    app.use("/*demo", (req, res, next) => {
        throw new classError_1.AppError(`invaild URL ${req.originalUrl}`, 404);
    });
    app.use((err, req, res, next) => {
        return res
            .status(err.statusCode || 500)
            .json({ message: err.message, stack: err.stack });
    });
    const server = app.listen(port, () => {
        console.log(`server is running on ${port}`);
    });
    (0, geteway_1.initializer)(server);
};
exports.default = bootstarp;
