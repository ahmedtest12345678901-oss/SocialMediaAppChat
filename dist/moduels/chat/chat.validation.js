"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendGroupMessageSchema = exports.sendPrivateMessageSchema = exports.getConversationSchema = exports.createChatGroupSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const generalRules_1 = require("../../utils/generalRules");
const mongoose_1 = require("mongoose");
exports.createChatGroupSchema = {
    body: zod_1.default
        .strictObject({
        participants: zod_1.default.array(generalRules_1.generalRules.id).min(1, "At least one participant is required"),
        group: zod_1.default.string().min(2, "Group name too short").max(1000, "Group name too long"),
        attachment: generalRules_1.generalRules.file.optional(),
    })
        .superRefine((data, ctx) => {
        const unique = new Set(data.participants);
        if (data.participants.length !== unique.size) {
            ctx.addIssue({
                code: "custom",
                path: ["participants"],
                message: "Some of the tagged users are duplicated",
            });
        }
    }),
};
exports.getConversationSchema = {
    params: zod_1.default
        .object({
        conversationId: zod_1.default
            .string()
            .refine((id) => mongoose_1.Types.ObjectId.isValid(id), {
            message: "Invalid conversation ID",
        }),
    })
        .required(),
};
exports.sendPrivateMessageSchema = {
    body: zod_1.default
        .strictObject({
        targetUserId: generalRules_1.generalRules.id,
        text: zod_1.default.string().min(1, "Message cannot be empty"),
    })
        .required(),
};
exports.sendGroupMessageSchema = {
    body: zod_1.default
        .strictObject({
        targetGroupId: generalRules_1.generalRules.id,
        text: zod_1.default.string().min(1, "Message cannot be empty"),
    })
        .required(),
};
