import z from "zod";
import { generalRules } from "../../utils/generalRules";
import { OnModelEnum } from "../../DataBase/models/comment.model";
export enum ActionEnum {
    like = "like",
    unlike = "unlike"
}
export const createcommentSchema = {

    params: z.strictObject({
        postId: generalRules.id,
        commentId: generalRules.id.optional(),
    }),
    body: z.strictObject({
        content: z.string().min(5).max(100000).optional(),
        attachments: z.array(generalRules.file).max(2).optional(),
        assetFolderId: z.string().optional(),

        tags: z.array(generalRules.id).refine((value) => {
            return new Set(value).size === value?.length
        }, {
            message: "Duplicate Tags"
        }).optional(),
        OnModel: z.enum(OnModelEnum),
    }).superRefine((data, ctx) => {
        if (!data?.content && !data.attachments?.length) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "content or empty you must enter content at least"
            })
        }
    })
}


export const commentActionSchema = {
    params: z.strictObject({
        postId: generalRules.id,
        commentId: generalRules.id,
    }),
};

export const updateCommentSchema = {
    params: z.strictObject({
        postId: generalRules.id,
        commentId: generalRules.id,
    }),
    body: z.strictObject({
        content: z.string().min(5).max(1000).optional(),
        attachments: z.array(generalRules.file).max(2).optional(),
        tags: z.array(generalRules.id).optional(),
    }).superRefine((data, ctx) => {
        if (!data.content && !data.attachments?.length && !data.tags?.length) {
            ctx.addIssue({
                code: "custom",
                path: ["content"],
                message: "At least one field must be provided to update",
            });
        }
    }),
};


export const getCommentSchema = {
    params: z.strictObject({
        postId: generalRules.id.optional(), 
        commentId: generalRules.id,
    }),
    body: z.undefined(), 
};

export const getCommentWithReplySchema = {
    params: z.strictObject({
        postId: generalRules.id.optional(), 
        commentId: generalRules.id,
    }),
    body: z.undefined(),
};
