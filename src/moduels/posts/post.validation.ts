import z from "zod";
import { postAllowCommentEunm, PostAvailabilltyEunm } from "../../DataBase/models/post.model";
import { generalRules } from "../../utils/generalRules";
export enum ActionEnum {
    like = "like",
    unlike = "unlike"
}
export const createPostSchema = {
    body: z.strictObject({
        content: z.string().min(5).max(100000).optional(),
        attachments: z.array(generalRules.file).max(2).optional(),
        assetFolderId: z.string().optional(),

        allowComments: z.enum(postAllowCommentEunm).default(postAllowCommentEunm.allow).optional(),
        availabillty: z.enum(PostAvailabilltyEunm).default(PostAvailabilltyEunm.public).optional(),
        tags: z.array(generalRules.id).refine((value) => {
            return new Set(value).size === value?.length
        }, {
            message: "Duplicate Tags"
        }).optional(),
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


export const likePostSchema = {
  params: z.strictObject({
    postId: generalRules.id,
  }),
  query: z.strictObject({
    action: z.nativeEnum(ActionEnum).default(ActionEnum.like),
  }),
};


export const updatePostSchema = {
    body: z.strictObject({
        content: z.string().min(5).max(100000).optional(),
        attachments: z.array(generalRules.file).max(2).optional(),
        assetFolderId: z.string().optional(),

        allowComments: z.enum(postAllowCommentEunm).default(postAllowCommentEunm.allow).optional(),
        availabillty: z.enum(PostAvailabilltyEunm).default(PostAvailabilltyEunm.public).optional(),
        tags: z.array(generalRules.id).refine((value) => {
            return new Set(value).size === value?.length
        }, {
            message: "Duplicate Tags"
        }).optional(),
    }).superRefine((data, ctx) => {
        if (!Object.values(data).length ) {
            ctx.addIssue({
                code: "custom",
                message: " at least one filed is required!"
            })
        }
    })
}




export type LikePostDto = z.infer<typeof likePostSchema.params>;
export type LikePostQueryDto = z.infer<typeof likePostSchema.query>;

