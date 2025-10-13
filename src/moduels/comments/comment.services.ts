import { NextFunction, Request, Response } from "express";
import userModel from "../../DataBase/models/user.model";
import { AppError } from "../../utils/classError";
import { UserRepository } from "../../repositories/user.repositories";
import postModel, { postAllowCommentEunm } from "../../DataBase/models/post.model";
import { PostRepository } from "../../repositories/post.repositories";
import { deleteFiles, uploadFiles } from "../../utils/s3.config";
import { v4 as uuidv4 } from "uuid";
import { CommentRepository } from "../../repositories/comment.repositories";
import commentModel, { IComment, OnModelEnum } from "../../DataBase/models/comment.model";
import { getAvailabilityQuery } from "../../utils/postAccess";
import { HydratedDocument, Types } from "mongoose";
import { sendEmail } from "../../services/sendEmail";

class CommentServices {
  private _userModel = new UserRepository(userModel);
  private _postModel = new PostRepository(postModel);
  private _commentModel = new CommentRepository(commentModel);

  constructor() { }




  //>>>>>>>>>>>>>>>>>>>>>>createCommentReply>>>>>>>>>>>>>>>>>>>>>>

  createCommentReply = async (req: Request, res: Response, next: NextFunction) => {
    const { postId, commentId } = req.params;
    let { content, tags, attachments } = req.body;

    try {
      const parentComment = await this._commentModel.findOne({ _id: commentId, refId: postId });
      if (!parentComment) return next(new AppError("Parent comment not found", 404));

      if (tags?.length) {
        const users = await this._userModel.find({ filter: { _id: { $in: tags } } });
        if (users.length !== tags.length) return next(new AppError("Some tags are not valid", 400));
      }

      const assetFolderId = uuidv4();
      if (req?.files?.length) {
        attachments = await uploadFiles({
          files: req.files as Express.Multer.File[],
          path: `users/${(req.user?._id)}/posts/${parentComment.assetFolderId || "root"}/comments/${assetFolderId}`,
        });
      }

      const reply = await this._commentModel.create({
        content,
        tags,
        attachments,
        assetFolderId,
        refId: parentComment._id as Types.ObjectId,
        OnModel: OnModelEnum.Comment,
        createdBy: req?.user?._id as Types.ObjectId,
      });

      if (tags?.length) {
        const users = await this._userModel.find({ filter: { _id: { $in: tags } } });
        const emails = users.map(u => u.email);

        if (emails.length) {
          await sendEmail({
            to: emails.join(","),
            subject: "You were tagged in a reply",
            text: `You were tagged in a reply on comment ${parentComment._id}`,
          });
        }
      }

      return res.status(201).json({ message: "Success", reply });
    } catch (error) {
      return next(error);
    }
  };


  //>>>>>>>>>>>>>>>>>>>>>>createComment>>>>>>>>>>>>>>>>>>>>>>


  createComment = async (req: Request, res: Response, next: NextFunction) => {
    const { postId } = req.params;
    let { content, tags, attachments } = req.body;


    const post = await this._postModel.findOne({
      _id: postId,
      allowComment: postAllowCommentEunm.allow,
      $or: getAvailabilityQuery(req),
    });

    if (!post) return next(new AppError("Post not found or unauthorized", 404));

    let emails: string[] = [];
    if (tags?.length) {
      const users = await this._userModel.find({ filter: { _id: { $in: tags } } });
      if (users.length !== tags.length) {
        return next(new AppError("Some tags are not valid", 400));
      }

      emails = users.map(u => u.email).filter(Boolean);
    }

    const assetFolderId = uuidv4();
    if (req?.files?.length) {
      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${req.user?._id}/posts/${post.assetFolderId || "root"}/comments/${assetFolderId}`,
      });
    }

    const comment = await this._commentModel.create({
      content,
      tags,
      attachments,
      assetFolderId,
      refId: post._id as Types.ObjectId,
      OnModel: OnModelEnum.Post,
      createdBy: req?.user?._id as Types.ObjectId,
    });

    if (emails.length > 0) {
      await sendEmail({
        to: emails.join(","),
        subject: "comment Tag",
        text: `comment Tag on post ${post._id}`,
      });
    }

    return res.status(201).json({ message: "Success", comment });

  };



  //>>>>>>>>>>>>>>>>>>>>>>freezeComment>>>>>>>>>>>>>>>>>>>>>>

  freezeComment = async (req: Request, res: Response, next: NextFunction) => {
    const { commentId, postId } = req.params;


    const comment = await this._commentModel.findOne({ _id: commentId });

    if (!comment) {
      return next(new AppError("Comment not found", 404));
    }

    if (
      comment.createdBy.toString() !== req.user?._id.toString() &&
      comment.refId.toString() !== postId
    ) {
      return next(new AppError("Unauthorized", 403));
    }

    comment.isFrozen = true;
    await comment.save();


    console.log("Params:", req.params);
    console.log("User:", req.user?._id);

    if (!comment) {
      return next(new AppError("Comment not found", 404));
    }

    return res.status(200).json({ message: "Success", comment });

  };

  //>>>>>>>>>>>>>>>>>>>>>>hardDeleteComment>>>>>>>>>>>>>>>>>>>>>>


  hardDeleteComment = async (req: Request, res: Response, next: NextFunction) => {
    const { commentId } = req.params;


    const comment = await this._commentModel.findOne({ _id: commentId, createdBy: req.user?._id });

    if (!comment) {
      return next(new AppError("Comment not found ", 404));
    }

    if (comment.attachments?.length) {
      await deleteFiles({ Key: comment.attachments });
    }

    await this._commentModel.deleteOne({ _id: commentId });

    return res.status(200).json({ message: "Success" });
  };

  //>>>>>>>>>>>>>>>>>>>>>>updateComment>>>>>>>>>>>>>>>>>>>>>>


  updateComment = async (req: Request, res: Response, next: NextFunction) => {
    const { commentId, postId } = req.params;
    let { content, tags, attachments } = req.body;

    const comment = await this._commentModel.findOne({ _id: commentId });
    if (!comment) {
      return next(new AppError("Comment not found", 404));
    }

    if (
      comment.createdBy.toString() !== req.user?._id.toString() &&
      comment.refId.toString() !== postId
    ) {
      return next(new AppError("Unauthorized", 403));
    }

    if (comment.isFrozen) {
      return next(new AppError("This comment is frozen", 403));
    }

    if (tags?.length) {
      const users = await this._userModel.find({ filter: { _id: { $in: tags } } });
      if (users.length !== tags.length) {
        return next(new AppError("Some tags are not valid", 400));
      }
    }

    const assetFolderId = comment.assetFolderId || uuidv4();
    if (req?.files?.length) {
      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${comment.createdBy}/posts/${comment.refId}/comments/${assetFolderId}`,
      });

      if (comment.attachments?.length) {
        await deleteFiles({ Key: comment.attachments });
      }
    }

    comment.content = content ?? comment.content;
    comment.tags = tags ?? comment.tags;
    comment.attachments = attachments ?? comment.attachments;
    comment.assetFolderId = assetFolderId;

    await comment.save();

    return res.status(200).json({ message: "Success", comment });

  };

  //>>>>>>>>>>>>>>>>>>>>>>getCommentById>>>>>>>>>>>>>>>>>>>>>>

  getCommentById = async (req: Request, res: Response, next: NextFunction) => {
    const { commentId, postId } = req.params;

    const comment = await this._commentModel.findOneWithPopulate(
      { _id: commentId },
      [
        {
          path: "replies",
          populate: [
            { path: "createdBy", select: "-password" },
            { path: "tags", select: "-password" },
            { path: "likes", select: "-password" }
          ]
        },
        { path: "createdBy", select: "-password" },
        { path: "tags", select: "-password" },
        { path: "likes", select: "-password" }
      ]
    );

    if (!comment) {
      return next(new AppError("Comment not found", 404));
    }

    if (postId && comment.refId.toString() !== postId) {
      return next(new AppError("Unauthorized to view this comment", 403));
    }

    return res.status(200).json({ message: "Success", comment });

  };



  getCommentWithReply = async (req: Request, res: Response, next: NextFunction) => {
    const { commentId, postId } = req.params;


    const comment = await this._commentModel.findOneWithPopulate(
      { _id: commentId },
      [
        { path: "createdBy", select: "-password" },
        { path: "tags", select: "-password" },
        { path: "likes", select: "-password" },
        {
          path: "replies",
          populate: [
            { path: "createdBy", select: "-password" },
            { path: "tags", select: "-password" },
            { path: "likes", select: "-password" },
          ],
        },
      ]
    );

    if (!comment) {
      return next(new AppError("Comment not found", 404));
    }

    if (postId && comment.refId.toString() !== postId) {
      return next(new AppError("Unauthorized to view this comment", 403));
    }

    return res.status(200).json({ message: "Success", comment });

  };



}

export default new CommentServices();
