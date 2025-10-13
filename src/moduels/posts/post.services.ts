import { NextFunction, Request, Response } from "express";
import userModel, { GenderType, ProviderType, RoleType, } from "../../DataBase/models/user.model";
import { AppError } from "../../utils/classError";
import { UserRepository } from "../../repositories/user.repositories";
import postModel, { IPost, PostAvailabilltyEunm } from "../../DataBase/models/post.model";
import { PostRepository } from "../../repositories/post.repositories";
import { deleteFiles, uploadFiles } from "../../utils/s3.config";
import { v4 as uuidv4 } from "uuid";
import { ActionEnum, LikePostDto, LikePostQueryDto } from "./post.validation";
import { UpdateQuery } from "mongoose";
import { CommentRepository } from "../../repositories/comment.repositories";
import commentModel from "../../DataBase/models/comment.model";
import { success } from "zod";
import { populate } from "dotenv";


class PostServices {
  private _userModel = new UserRepository(userModel);
  private _postModel = new PostRepository(postModel);
  private _commentModel = new CommentRepository(commentModel);


  constructor() { }

  createPost = async (req: Request, res: Response, next: NextFunction) => {
    if (
      req?.body?.tags?.length &&
      (
        await this._userModel.find({
          filter: { _id: { $in: req.body.tags } }
        })
      ).length !== req.body.tags.length
    ) {
      throw new AppError("invalid user id", 400);
    }

    const assetFolderId = uuidv4();

    let attachments;
    if (req?.files?.length) {
      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${req?.user?._id}/posts/${assetFolderId}`,
      });
    }

    const post = await this._postModel.create({
      ...req.body,
      attachments,
      assetFolderId,
      createdBy: req.user?._id,
    });

    if (!post) {
      await deleteFiles({ Key: attachments || [] });
      throw new AppError("failed to create post", 500);
    }

    return res.status(201).json({ message: "Success", post });
  };


  likePost = async (req: Request, res: Response, next: NextFunction) => {
    const { postId }: LikePostDto = req.params as LikePostDto
    const { action }: LikePostQueryDto = req.query as LikePostQueryDto

    let updateQuerey: UpdateQuery<IPost> = { $addToSet: { likes: req.user?._id } }

    if (action === ActionEnum.unlike) {
      updateQuerey = { $pull: { likes: req.user?._id } }
    }



    const post = await this._postModel.findOneAndUpdate({
      _id: postId,
      $or: [
        { availabillty: PostAvailabilltyEunm.public },
        { availabillty: PostAvailabilltyEunm.private, createdBy: req.user?._id },
        { availabillty: PostAvailabilltyEunm.friends, createdBy: { $in: [...(req.user?.friends || []), req.user?._id] } }
      ]
    },
      updateQuerey,
      { new: true }
    )


    if (!post) {
      throw new AppError("post not found ", 404);

    }
    return res.status(201).json({ message: `${action}`, post })
  }


  updatePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { postId }: LikePostDto = req.params as LikePostDto;

      const post = await this._postModel.findOne({
        _id: postId,
        createdBy: req.user?._id,
        deletedAt: { $exists: false }
      });

      if (!post) {
        throw new AppError("post not found", 404);
      }

      if (req?.body.content) {
        post.content = req.body.content;
      }

      if (req?.body.availabillty) {
        post.availabillty = req.body.availabillty;
      }

      if (req?.body.allowComments) {
        post.allowComments = req.body.allowComments;
      }

      if (req?.body?.tags?.length) {
        const validUsers = await this._userModel.find({
          filter: { _id: { $in: req.body.tags } }
        });

        if (validUsers.length !== req.body.tags.length) {
          throw new AppError("invalid user id", 400);
        }

        post.tags = req.body.tags;
      }

      if (req?.files?.length) {
        if (post.attachments?.length) {
          await deleteFiles({ Key: post.attachments });
        }

        const newAttachments = await uploadFiles({
          files: req.files as Express.Multer.File[],
          path: `users/${req?.user?._id}/posts/${post.assetFolderId}`
        });

        post.attachments = newAttachments;
      }

      await post.save();

      return res.status(200).json({ message: "Success", post, });
    } catch (error) {
      next(error);
    }
  };




  getPosts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const posts = await this._postModel.find({
        filter: {},
        options: {
          populate: [
            {
              path: "comments",
              match: { commentId: { $exists: false } },
              populate: {
                path: "replies"
              }
            }
          ]
        }
      });

      return res.status(200).json({ message: "Success", posts });
    } catch (error) {
      next(error);
    }
  };




  freezePost = async (req: Request, res: Response, next: NextFunction) => {
    const { postId }: LikePostDto = req.params as LikePostDto;

    const post = await this._postModel.findOne({
      _id: postId,
      createdBy: req.user?._id
    });

    if (!post) {
      throw new AppError("post not found", 404);
    }

    post.isFrozen = !post.isFrozen;
    await post.save();
  return res.status(200).json({ message: post.isFrozen ? "Post frozen success" : "Post unfrozen Success ", post, });
  };




  getPostById = async (req: Request, res: Response, next: NextFunction) => {

    const { postId }: LikePostDto = req.params as LikePostDto;

    const post = await this._postModel.findOneWithPopulate(
      { _id: postId, deletedAt: { $exists: false } },
      [
        {
          path: "comments",
          match: { commentId: { $exists: false } },
          populate: {
            path: "replies"
          }
        },
        {
          path: "createdBy",
          select: "firstName lastName email"
        },
        {
          path: "tags",
          select: "firstName lastName email"
        },
        {
          path: "likes",
          select: "firstName lastName"
        }
      ]
    );

    if (!post) {
      throw new AppError("Post not found", 404);
    }

    return res.status(200).json({ message: "Success", post });

  };

  unfreezePost = async (req: Request, res: Response, next: NextFunction) => {

    const { postId }: LikePostDto = req.params as LikePostDto;

    const post = await this._postModel.findOneAndUpdate(
      {
        _id: postId,
        createdBy: req.user?._id,
        isFrozen: true,
        deletedAt: { $exists: false }
      },
      { $set: { isFrozen: false } },
      { new: true }
    );

    if (!post) {
      throw new AppError("post not found or not frozen", 404);
    }

 return res.status(200).json({  message: "Success",   post  });

  };



  hardDeletePost = async (req: Request, res: Response, next: NextFunction) => {
    const { postId }: LikePostDto = req.params as LikePostDto;

    const post = await this._postModel.findOne({
      _id: postId,
      createdBy: req.user?._id
    });

    if (!post) {
      throw new AppError("post not found", 404);
    }

    if (post.attachments?.length) {
      await deleteFiles({ Key: post.attachments });
    }

    await userModel.updateMany(
      { _id: { $in: post.likes } },
      { $pull: { likedPosts: post._id } }
    );

    await userModel.updateMany(
      { _id: { $in: post.tags } },
      { $pull: { taggedPosts: post._id } }
    );


    await post.deleteOne();

    return res.status(200).json({
      message: "Post, comments, and replies deleted for ever"
    });
  };

}

export default new PostServices();
