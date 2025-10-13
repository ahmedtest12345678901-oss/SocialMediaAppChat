import z from "zod";
import { generalRules } from "../../utils/generalRules";
import { Types } from "mongoose";

export const createChatGroupSchema = {
  body: z
    .strictObject({
      participants: z.array(generalRules.id).min(1, "At least one participant is required"),
      group: z.string().min(2, "Group name too short").max(1000, "Group name too long"),
      attachment: generalRules.file.optional(), 
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

export const getConversationSchema = {
  params: z
    .object({
      conversationId: z
        .string()
        .refine((id) => Types.ObjectId.isValid(id), {
          message: "Invalid conversation ID",
        }),
    })
    .required(),
};

export const sendPrivateMessageSchema = {
  body: z
    .strictObject({
      targetUserId: generalRules.id,
      text: z.string().min(1, "Message cannot be empty"),
    })
    .required(),
};

export const sendGroupMessageSchema = {
  body: z
    .strictObject({
      targetGroupId: generalRules.id,
      text: z.string().min(1, "Message cannot be empty"),
    })
    .required(),
};

export type createChatGroupSchemaType = z.infer<typeof createChatGroupSchema.body>;
export type getConversationSchemaType = z.infer<typeof getConversationSchema.params>;
export type sendPrivateMessageSchemaType = z.infer<typeof sendPrivateMessageSchema.body>;
export type sendGroupMessageSchemaType = z.infer<typeof sendGroupMessageSchema.body>;
