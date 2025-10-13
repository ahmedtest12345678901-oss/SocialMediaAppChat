import { Router } from "express";
import CS from "./comment.services";
import * as CV from "./comment.validation";
import { Validation } from "../../middleware/validation";
import { fileValidation, multerCloud } from "../../middleware/multer";
import { Authentication } from "../../middleware/authentication";

const commentRouter = Router({ mergeParams: true });

commentRouter.post("/", Authentication(), multerCloud({ fileTypes: fileValidation.image }).array("attachments", 2),
    Validation(CV.createcommentSchema), CS.createComment);

commentRouter.post("/:commentId/reply", Authentication(), multerCloud({ fileTypes: fileValidation.image }).array("attachments", 2),
    Validation(CV.createcommentSchema), CS.createCommentReply);

// commentRouter.patch("/:postId", Authentication(), Validation(PV.likePostSchema), PS.likePost);


// commentRouter.patch("/update/:postId", Authentication(), multerCloud({ fileTypes: fileValidation.image }).array("attachments", 2),
//     Validation(PV.updatePostSchema), PS.updatePost);





commentRouter.patch("/freeze/:commentId", Authentication(), Validation(CV.commentActionSchema), CS.freezeComment);
commentRouter.delete("/hardDeleteComment/:commentId", Authentication(), Validation(CV.commentActionSchema), CS.hardDeleteComment);

commentRouter.put("/:commentId", Authentication(), Validation(CV.updateCommentSchema), CS.updateComment
);

``
commentRouter.get("/:commentId", Validation(CV.getCommentSchema), CS.getCommentById);


commentRouter.get("/getCommentWithReplies/:commentId", Validation(CV.getCommentWithReplySchema), CS.getCommentWithReply);

export default commentRouter;
