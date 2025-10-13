import { Router } from "express";
import * as PV from "./post.validation";
import PS from "./post.services";
import { Validation } from "../../middleware/validation";
import { fileValidation, multerCloud } from "../../middleware/multer";
import { Authentication } from "../../middleware/authentication";
import commentRouter from "../comments/comment.controller";

const postRouter = Router();

// postRouter.use("/:postId/comments{/:commentId/reply}", commentRouter)
postRouter.use("/:postId/comments", commentRouter)





postRouter.post("/createPost", Authentication(), multerCloud({ fileTypes: fileValidation.image }).array("attachments", 2),
    Validation(PV.createPostSchema), PS.createPost);


postRouter.patch("/:postId", Authentication(), Validation(PV.likePostSchema), PS.likePost);


postRouter.patch("/update/:postId", Authentication(), multerCloud({ fileTypes: fileValidation.image }).array("attachments", 2),
    Validation(PV.updatePostSchema), PS.updatePost);

postRouter.get("/", PS.getPosts)


postRouter.delete("/hardDelete/:postId", Authentication(), PS.hardDeletePost);
postRouter.get("/getPostById/:postId", Authentication(), PS.getPostById);
postRouter.patch("/freeze/:postId", Authentication(), PS.freezePost);
postRouter.patch("/unfreeze/:postId", Authentication(), PS.unfreezePost);




export default postRouter;
