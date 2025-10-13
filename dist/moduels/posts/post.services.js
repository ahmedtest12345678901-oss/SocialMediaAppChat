"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = __importDefault(require("../../DataBase/models/user.model"));
const classError_1 = require("../../utils/classError");
const user_repositories_1 = require("../../repositories/user.repositories");
const post_model_1 = __importStar(require("../../DataBase/models/post.model"));
const post_repositories_1 = require("../../repositories/post.repositories");
const s3_config_1 = require("../../utils/s3.config");
const uuid_1 = require("uuid");
const post_validation_1 = require("./post.validation");
const comment_repositories_1 = require("../../repositories/comment.repositories");
const comment_model_1 = __importDefault(require("../../DataBase/models/comment.model"));
class PostServices {
    _userModel = new user_repositories_1.UserRepository(user_model_1.default);
    _postModel = new post_repositories_1.PostRepository(post_model_1.default);
    _commentModel = new comment_repositories_1.CommentRepository(comment_model_1.default);
    constructor() { }
    createPost = async (req, res, next) => {
        if (req?.body?.tags?.length &&
            (await this._userModel.find({
                filter: { _id: { $in: req.body.tags } }
            })).length !== req.body.tags.length) {
            throw new classError_1.AppError("invalid user id", 400);
        }
        const assetFolderId = (0, uuid_1.v4)();
        let attachments;
        if (req?.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
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
            await (0, s3_config_1.deleteFiles)({ Key: attachments || [] });
            throw new classError_1.AppError("failed to create post", 500);
        }
        return res.status(201).json({ message: "Success", post });
    };
    likePost = async (req, res, next) => {
        const { postId } = req.params;
        const { action } = req.query;
        let updateQuerey = { $addToSet: { likes: req.user?._id } };
        if (action === post_validation_1.ActionEnum.unlike) {
            updateQuerey = { $pull: { likes: req.user?._id } };
        }
        const post = await this._postModel.findOneAndUpdate({
            _id: postId,
            $or: [
                { availabillty: post_model_1.PostAvailabilltyEunm.public },
                { availabillty: post_model_1.PostAvailabilltyEunm.private, createdBy: req.user?._id },
                { availabillty: post_model_1.PostAvailabilltyEunm.friends, createdBy: { $in: [...(req.user?.friends || []), req.user?._id] } }
            ]
        }, updateQuerey, { new: true });
        if (!post) {
            throw new classError_1.AppError("post not found ", 404);
        }
        return res.status(201).json({ message: `${action}`, post });
    };
    updatePost = async (req, res, next) => {
        try {
            const { postId } = req.params;
            const post = await this._postModel.findOne({
                _id: postId,
                createdBy: req.user?._id,
                deletedAt: { $exists: false }
            });
            if (!post) {
                throw new classError_1.AppError("post not found", 404);
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
                    throw new classError_1.AppError("invalid user id", 400);
                }
                post.tags = req.body.tags;
            }
            if (req?.files?.length) {
                if (post.attachments?.length) {
                    await (0, s3_config_1.deleteFiles)({ Key: post.attachments });
                }
                const newAttachments = await (0, s3_config_1.uploadFiles)({
                    files: req.files,
                    path: `users/${req?.user?._id}/posts/${post.assetFolderId}`
                });
                post.attachments = newAttachments;
            }
            await post.save();
            return res.status(200).json({ message: "Success", post, });
        }
        catch (error) {
            next(error);
        }
    };
    getPosts = async (req, res, next) => {
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
        }
        catch (error) {
            next(error);
        }
    };
    freezePost = async (req, res, next) => {
        const { postId } = req.params;
        const post = await this._postModel.findOne({
            _id: postId,
            createdBy: req.user?._id
        });
        if (!post) {
            throw new classError_1.AppError("post not found", 404);
        }
        post.isFrozen = !post.isFrozen;
        await post.save();
        return res.status(200).json({ message: post.isFrozen ? "Post frozen success" : "Post unfrozen Success ", post, });
    };
    getPostById = async (req, res, next) => {
        const { postId } = req.params;
        const post = await this._postModel.findOneWithPopulate({ _id: postId, deletedAt: { $exists: false } }, [
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
        ]);
        if (!post) {
            throw new classError_1.AppError("Post not found", 404);
        }
        return res.status(200).json({ message: "Success", post });
    };
    unfreezePost = async (req, res, next) => {
        const { postId } = req.params;
        const post = await this._postModel.findOneAndUpdate({
            _id: postId,
            createdBy: req.user?._id,
            isFrozen: true,
            deletedAt: { $exists: false }
        }, { $set: { isFrozen: false } }, { new: true });
        if (!post) {
            throw new classError_1.AppError("post not found or not frozen", 404);
        }
        return res.status(200).json({ message: "Success", post });
    };
    hardDeletePost = async (req, res, next) => {
        const { postId } = req.params;
        const post = await this._postModel.findOne({
            _id: postId,
            createdBy: req.user?._id
        });
        if (!post) {
            throw new classError_1.AppError("post not found", 404);
        }
        if (post.attachments?.length) {
            await (0, s3_config_1.deleteFiles)({ Key: post.attachments });
        }
        await user_model_1.default.updateMany({ _id: { $in: post.likes } }, { $pull: { likedPosts: post._id } });
        await user_model_1.default.updateMany({ _id: { $in: post.tags } }, { $pull: { taggedPosts: post._id } });
        await post.deleteOne();
        return res.status(200).json({
            message: "Post, comments, and replies deleted for ever"
        });
    };
}
exports.default = new PostServices();
