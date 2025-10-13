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
const comment_repositories_1 = require("../../repositories/comment.repositories");
const comment_model_1 = __importStar(require("../../DataBase/models/comment.model"));
const postAccess_1 = require("../../utils/postAccess");
const sendEmail_1 = require("../../services/sendEmail");
class CommentServices {
    _userModel = new user_repositories_1.UserRepository(user_model_1.default);
    _postModel = new post_repositories_1.PostRepository(post_model_1.default);
    _commentModel = new comment_repositories_1.CommentRepository(comment_model_1.default);
    constructor() { }
    createCommentReply = async (req, res, next) => {
        const { postId, commentId } = req.params;
        let { content, tags, attachments } = req.body;
        try {
            const parentComment = await this._commentModel.findOne({ _id: commentId, refId: postId });
            if (!parentComment)
                return next(new classError_1.AppError("Parent comment not found", 404));
            if (tags?.length) {
                const users = await this._userModel.find({ filter: { _id: { $in: tags } } });
                if (users.length !== tags.length)
                    return next(new classError_1.AppError("Some tags are not valid", 400));
            }
            const assetFolderId = (0, uuid_1.v4)();
            if (req?.files?.length) {
                attachments = await (0, s3_config_1.uploadFiles)({
                    files: req.files,
                    path: `users/${(req.user?._id)}/posts/${parentComment.assetFolderId || "root"}/comments/${assetFolderId}`,
                });
            }
            const reply = await this._commentModel.create({
                content,
                tags,
                attachments,
                assetFolderId,
                refId: parentComment._id,
                OnModel: comment_model_1.OnModelEnum.Comment,
                createdBy: req?.user?._id,
            });
            if (tags?.length) {
                const users = await this._userModel.find({ filter: { _id: { $in: tags } } });
                const emails = users.map(u => u.email);
                if (emails.length) {
                    await (0, sendEmail_1.sendEmail)({
                        to: emails.join(","),
                        subject: "You were tagged in a reply",
                        text: `You were tagged in a reply on comment ${parentComment._id}`,
                    });
                }
            }
            return res.status(201).json({ message: "Success", reply });
        }
        catch (error) {
            return next(error);
        }
    };
    createComment = async (req, res, next) => {
        const { postId } = req.params;
        let { content, tags, attachments } = req.body;
        const post = await this._postModel.findOne({
            _id: postId,
            allowComment: post_model_1.postAllowCommentEunm.allow,
            $or: (0, postAccess_1.getAvailabilityQuery)(req),
        });
        if (!post)
            return next(new classError_1.AppError("Post not found or unauthorized", 404));
        let emails = [];
        if (tags?.length) {
            const users = await this._userModel.find({ filter: { _id: { $in: tags } } });
            if (users.length !== tags.length) {
                return next(new classError_1.AppError("Some tags are not valid", 400));
            }
            emails = users.map(u => u.email).filter(Boolean);
        }
        const assetFolderId = (0, uuid_1.v4)();
        if (req?.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${req.user?._id}/posts/${post.assetFolderId || "root"}/comments/${assetFolderId}`,
            });
        }
        const comment = await this._commentModel.create({
            content,
            tags,
            attachments,
            assetFolderId,
            refId: post._id,
            OnModel: comment_model_1.OnModelEnum.Post,
            createdBy: req?.user?._id,
        });
        if (emails.length > 0) {
            await (0, sendEmail_1.sendEmail)({
                to: emails.join(","),
                subject: "comment Tag",
                text: `comment Tag on post ${post._id}`,
            });
        }
        return res.status(201).json({ message: "Success", comment });
    };
    freezeComment = async (req, res, next) => {
        const { commentId, postId } = req.params;
        const comment = await this._commentModel.findOne({ _id: commentId });
        if (!comment) {
            return next(new classError_1.AppError("Comment not found", 404));
        }
        if (comment.createdBy.toString() !== req.user?._id.toString() &&
            comment.refId.toString() !== postId) {
            return next(new classError_1.AppError("Unauthorized", 403));
        }
        comment.isFrozen = true;
        await comment.save();
        console.log("Params:", req.params);
        console.log("User:", req.user?._id);
        if (!comment) {
            return next(new classError_1.AppError("Comment not found", 404));
        }
        return res.status(200).json({ message: "Success", comment });
    };
    hardDeleteComment = async (req, res, next) => {
        const { commentId } = req.params;
        const comment = await this._commentModel.findOne({ _id: commentId, createdBy: req.user?._id });
        if (!comment) {
            return next(new classError_1.AppError("Comment not found ", 404));
        }
        if (comment.attachments?.length) {
            await (0, s3_config_1.deleteFiles)({ Key: comment.attachments });
        }
        await this._commentModel.deleteOne({ _id: commentId });
        return res.status(200).json({ message: "Success" });
    };
    updateComment = async (req, res, next) => {
        const { commentId, postId } = req.params;
        let { content, tags, attachments } = req.body;
        const comment = await this._commentModel.findOne({ _id: commentId });
        if (!comment) {
            return next(new classError_1.AppError("Comment not found", 404));
        }
        if (comment.createdBy.toString() !== req.user?._id.toString() &&
            comment.refId.toString() !== postId) {
            return next(new classError_1.AppError("Unauthorized", 403));
        }
        if (comment.isFrozen) {
            return next(new classError_1.AppError("This comment is frozen", 403));
        }
        if (tags?.length) {
            const users = await this._userModel.find({ filter: { _id: { $in: tags } } });
            if (users.length !== tags.length) {
                return next(new classError_1.AppError("Some tags are not valid", 400));
            }
        }
        const assetFolderId = comment.assetFolderId || (0, uuid_1.v4)();
        if (req?.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${comment.createdBy}/posts/${comment.refId}/comments/${assetFolderId}`,
            });
            if (comment.attachments?.length) {
                await (0, s3_config_1.deleteFiles)({ Key: comment.attachments });
            }
        }
        comment.content = content ?? comment.content;
        comment.tags = tags ?? comment.tags;
        comment.attachments = attachments ?? comment.attachments;
        comment.assetFolderId = assetFolderId;
        await comment.save();
        return res.status(200).json({ message: "Success", comment });
    };
    getCommentById = async (req, res, next) => {
        const { commentId, postId } = req.params;
        const comment = await this._commentModel.findOneWithPopulate({ _id: commentId }, [
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
        ]);
        if (!comment) {
            return next(new classError_1.AppError("Comment not found", 404));
        }
        if (postId && comment.refId.toString() !== postId) {
            return next(new classError_1.AppError("Unauthorized to view this comment", 403));
        }
        return res.status(200).json({ message: "Success", comment });
    };
    getCommentWithReply = async (req, res, next) => {
        const { commentId, postId } = req.params;
        const comment = await this._commentModel.findOneWithPopulate({ _id: commentId }, [
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
        ]);
        if (!comment) {
            return next(new classError_1.AppError("Comment not found", 404));
        }
        if (postId && comment.refId.toString() !== postId) {
            return next(new classError_1.AppError("Unauthorized to view this comment", 403));
        }
        return res.status(200).json({ message: "Success", comment });
    };
}
exports.default = new CommentServices();
