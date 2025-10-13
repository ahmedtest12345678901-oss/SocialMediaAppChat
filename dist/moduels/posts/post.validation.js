"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePostSchema = exports.likePostSchema = exports.createPostSchema = exports.ActionEnum = void 0;
const zod_1 = __importDefault(require("zod"));
const post_model_1 = require("../../DataBase/models/post.model");
const generalRules_1 = require("../../utils/generalRules");
var ActionEnum;
(function (ActionEnum) {
    ActionEnum["like"] = "like";
    ActionEnum["unlike"] = "unlike";
})(ActionEnum || (exports.ActionEnum = ActionEnum = {}));
exports.createPostSchema = {
    body: zod_1.default.strictObject({
        content: zod_1.default.string().min(5).max(100000).optional(),
        attachments: zod_1.default.array(generalRules_1.generalRules.file).max(2).optional(),
        assetFolderId: zod_1.default.string().optional(),
        allowComments: zod_1.default.enum(post_model_1.postAllowCommentEunm).default(post_model_1.postAllowCommentEunm.allow).optional(),
        availabillty: zod_1.default.enum(post_model_1.PostAvailabilltyEunm).default(post_model_1.PostAvailabilltyEunm.public).optional(),
        tags: zod_1.default.array(generalRules_1.generalRules.id).refine((value) => {
            return new Set(value).size === value?.length;
        }, {
            message: "Duplicate Tags"
        }).optional(),
    }).superRefine((data, ctx) => {
        if (!data?.content && !data.attachments?.length) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "content or empty you must enter content at least"
            });
        }
    })
};
exports.likePostSchema = {
    params: zod_1.default.strictObject({
        postId: generalRules_1.generalRules.id,
    }),
    query: zod_1.default.strictObject({
        action: zod_1.default.nativeEnum(ActionEnum).default(ActionEnum.like),
    }),
};
exports.updatePostSchema = {
    body: zod_1.default.strictObject({
        content: zod_1.default.string().min(5).max(100000).optional(),
        attachments: zod_1.default.array(generalRules_1.generalRules.file).max(2).optional(),
        assetFolderId: zod_1.default.string().optional(),
        allowComments: zod_1.default.enum(post_model_1.postAllowCommentEunm).default(post_model_1.postAllowCommentEunm.allow).optional(),
        availabillty: zod_1.default.enum(post_model_1.PostAvailabilltyEunm).default(post_model_1.PostAvailabilltyEunm.public).optional(),
        tags: zod_1.default.array(generalRules_1.generalRules.id).refine((value) => {
            return new Set(value).size === value?.length;
        }, {
            message: "Duplicate Tags"
        }).optional(),
    }).superRefine((data, ctx) => {
        if (!Object.values(data).length) {
            ctx.addIssue({
                code: "custom",
                message: " at least one filed is required!"
            });
        }
    })
};
