import { resolve } from "path";
import { config } from "dotenv";
config({ path: resolve("./config/.env") });
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import express, { Request, Response, NextFunction } from "express";
import { AppError } from "./utils/classError";
import userRouter from "./moduels/users/user.controller";
import connectionDB from "./DataBase/connectionDB";
import { createGetFilePreSignedUrl, deleteFile, deleteFiles, getFile, listFiles } from "./utils/s3.config";
import { pipeline } from "stream/promises";
import { ListObjectsV2CommandOutput } from "@aws-sdk/client-s3";
import postRouter from "./moduels/posts/post.controller";
import commentRouter from "./moduels/comments/comment.controller";
import { Server } from "socket.io";
import { Socket } from "net";
import { initializer } from "./moduels/geteway/geteway";
import { createHandler } from 'graphql-http/lib/use/express';
import { schemaGQL } from "./moduels/garphQL/schema.glq";
import { Authentication } from "./middleware/authentication";




const app: express.Application = express();
const port: string | number = process.env.PORT || 5000;

// const limiter = rateLimit({
//   windowMs: 5 * 60 * 1000,
//   limit: 30,
//   message: {
//     error: "GAME OVER.........",
//   },
//   statusCode: 429,
//   legacyHeaders: false
// });

const bootstarp = async () => {
  app.use(express.json());
  app.use(cors({ origin: "*" }));
  app.use(helmet());
  // app.use(limiter);





  app.all('/graphql', Authentication(), createHandler({ schema: schemaGQL, context: (req) => ({ req }) }))





  app.get("/upload/pre-signed/*path", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { path } = req.params as unknown as { path: string[] };
      const { downloadName } = req.query as { downloadName?: string };
      const Key = path.join("/");
      const url = await createGetFilePreSignedUrl({
        Key,
        downloadName: downloadName ? downloadName : undefined,
      });

      console.log("Pre-signed URL:", url);

      return res.status(200).json({ message: "success", url });
    } catch (error) {
      next(error);
    }
  });


  app.get("/upload/delete/*path", async (req: Request, res: Response, next: NextFunction) => {
    const { path } = req.params as unknown as { path: string[] }
    const Key = path.join("/");
    const result = await deleteFile({
      Key,
    })
    return res.status(200).json({ message: "success", result })
  })


  app.get("/upload/delete", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await deleteFiles({
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

    } catch (error) {
      next(error);
    }
  });

  app.get("/upload", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const folderPath = "users/68c877656580fb315c2c8806";

      const result = await listFiles({
        path: folderPath
      });

      if (!result?.Contents || result.Contents.length === 0) {
        throw new AppError("No files found", 404);
      }

      const fileKeys = result.Contents.map(item => item.Key);

      return res.status(200).json({
        message: "Files retrieved successfully",
        files: fileKeys
      });

    } catch (error) {
      next(error);
    }
  });

  ///////////////////////////////////////
  app.get("/upload/*path", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { path } = req.params as unknown as { path: string[] };
      const { downloadName } = req.query as { downloadName?: string };

      const Key = path.join("/");
      const result = await getFile({ Key });

      const stream = result.Body as NodeJS.ReadableStream;

      res.set("cross-origin-resource-policy", "cross-origin")
      res.setHeader("Content-Type", result?.ContentType || "application/octet-stream");

      if (downloadName) {
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${downloadName || path.join("/").split("/").pop()}"`
        );
      }

      await pipeline(stream, res);
    } catch (error) {
      next(error);
    }
  });

  //////////////////////////////////////////////



















  app.use("/users", userRouter);


  app.use("/posts", postRouter);







  await connectionDB();

  app.get("/", (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({ message: "Hello on my app..... " });
  });

  app.use("/*demo", (req: Request, res: Response, next: NextFunction) => {
    throw new AppError(`invaild URL ${req.originalUrl}`, 404);
  });

  app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
    return res
      .status((err.statusCode as unknown as number) || 500)
      .json({ message: err.message, stack: err.stack });
  });

  const server = app.listen(port, () => {
    console.log(`server is running on ${port}`);
  });

  initializer(server)
};

export default bootstarp;
