"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOneUserSchema = exports.sendGroupMessageSchema = exports.sendPrivateMessageSchema = exports.getConversationSchema = exports.createChatGroupSchema = exports.frezzSchema = exports.refreshTokenSchema = exports.loginWithGmailSchema = exports.forgetPasswordSchema = exports.logOutSchema = exports.resetPasswordSchema = exports.confirmEmailSchema = exports.signUpSchema = exports.signInSchema = exports.FlagType = void 0;
const zod_1 = __importDefault(require("zod"));
const user_model_1 = require("../../DataBase/models/user.model");
const mongoose_1 = require("mongoose");
const generalRules_1 = require("../../utils/generalRules");
var FlagType;
(function (FlagType) {
    FlagType["all"] = "all";
    FlagType["current"] = "current";
})(FlagType || (exports.FlagType = FlagType = {}));
exports.signInSchema = {
    body: zod_1.default
        .object({
        email: zod_1.default.string().email().min(2).trim(),
        password: zod_1.default
            .string()
            .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*()-+=]).{8,}$/),
    })
        .required(),
};
exports.signUpSchema = {
    body: exports.signInSchema.body
        .extend({
        userName: zod_1.default.string().min(2).trim(),
        email: zod_1.default.string().email().min(2).trim(),
        password: zod_1.default
            .string()
            .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*()-+=]).{8,}$/),
        cPassword: zod_1.default.string(),
        phone: zod_1.default.string().min(2).trim(),
        age: zod_1.default.number(),
        address: zod_1.default.string(),
        gender: zod_1.default.enum([user_model_1.GenderType.male, user_model_1.GenderType.female]),
        FullName: zod_1.default.string(),
    })
        .superRefine((data, ctx) => {
        if (data.password !== data.cPassword) {
            ctx.addIssue({
                code: "custom",
                path: ["cPassword"],
                message: "password not Match",
            });
        }
    })
        .refine((data) => data.userName !== "Allah", {
        message: "Sorry this name is banned",
        path: ["userName"],
    }),
};
exports.confirmEmailSchema = {
    body: zod_1.default.object({ email: zod_1.default.string().email().min(2).trim(), otp: zod_1.default.string().min(6).regex(/^\d{6}$/).trim(), }).required(),
};
exports.resetPasswordSchema = {
    body: exports.confirmEmailSchema.body
        .extend({
        password: zod_1.default
            .string()
            .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*()-+=]).{8,}$/),
        cPassword: zod_1.default.string(),
    })
        .superRefine((data, ctx) => {
        if (data.password !== data.cPassword) {
            ctx.addIssue({
                code: "custom",
                path: ["cPassword"],
                message: "password not Match",
            });
        }
    })
};
exports.logOutSchema = {
    body: zod_1.default.strictObject({
        flag: zod_1.default.enum(FlagType),
    }),
};
exports.forgetPasswordSchema = {
    body: zod_1.default.strictObject({
        email: zod_1.default.email()
    }).required()
};
exports.loginWithGmailSchema = {
    body: zod_1.default
        .strictObject({
        idToken: zod_1.default.string(),
    })
        .required(),
};
exports.refreshTokenSchema = {
    headers: zod_1.default.object({
        authorization: zod_1.default.string().min(1, "authorization header required"),
    }),
};
exports.frezzSchema = {
    params: zod_1.default.object({
        userId: zod_1.default.string().optional()
            .refine((value) => {
            if (!value)
                return true;
            return mongoose_1.Types.ObjectId.isValid(value);
        }, {
            message: "userId must be a valid ObjectId",
            path: ["userId"]
        })
    })
};
exports.createChatGroupSchema = {
    body: zod_1.default
        .object({
        memberIds: zod_1.default.array(generalRules_1.generalRules.id).min(1, "At least one member is required"),
        name: zod_1.default.string().min(2, "Group name too short").max(1000, "Group name too long"),
        attachment: generalRules_1.generalRules.file.optional(),
    })
        .superRefine((data, ctx) => {
        const unique = new Set(data.memberIds);
        if (data.memberIds.length !== unique.size) {
            ctx.addIssue({
                code: "custom",
                path: ["memberIds"],
                message: "Some of the tagged users are duplicated",
            });
        }
    }),
};
exports.getConversationSchema = {
    params: zod_1.default.object({
        conversationId: zod_1.default.string().refine((id) => mongoose_1.Types.ObjectId.isValid(id), {
            message: "Invalid conversation ID",
        }),
    }),
};
exports.sendPrivateMessageSchema = {
    body: zod_1.default.object({
        targetUserId: generalRules_1.generalRules.id,
        text: zod_1.default.string().min(1, "Message cannot be empty"),
    }),
};
exports.sendGroupMessageSchema = {
    body: zod_1.default.object({
        targetGroupId: generalRules_1.generalRules.id,
        text: zod_1.default.string().min(1, "Message cannot be empty"),
    }),
};
exports.getOneUserSchema = zod_1.default.object({
    id: generalRules_1.generalRules.id
});
