import z, { email, strictObject } from "zod";
import { GenderType } from "../../DataBase/models/user.model";
import { Types } from "mongoose";
import { generalRules } from "../../utils/generalRules";

export enum FlagType {
  all = "all",
  current = "current",
}

export const signInSchema = {
  body: z
    .object({
      email: z.string().email().min(2).trim(),
      password: z
        .string()
        .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*()-+=]).{8,}$/),
    })
    .required(),
};

export const signUpSchema = {
  body: signInSchema.body
    .extend({
      userName: z.string().min(2).trim(),
      email: z.string().email().min(2).trim(),
      password: z
        .string()
        .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*()-+=]).{8,}$/),
      cPassword: z.string(),
      phone: z.string().min(2).trim(),
      age: z.number(),
      address: z.string(),
      gender: z.enum([GenderType.male, GenderType.female]),
      FullName: z.string(),
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


export const confirmEmailSchema = {
  body: z.object({ email: z.string().email().min(2).trim(), otp: z.string().min(6).regex(/^\d{6}$/).trim(), }).required(),
};

export const resetPasswordSchema = {
  body: confirmEmailSchema.body
    .extend({
      password: z
        .string()
        .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*()-+=]).{8,}$/),
      cPassword: z.string(),

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

export const logOutSchema = {
  body: z.strictObject({
    flag: z.enum(FlagType),
  }),
};



export const forgetPasswordSchema = {
  body: z.strictObject({
    email: z.email()
  }).required()

};



export const loginWithGmailSchema = {
  body: z
    .strictObject({
      idToken: z.string(),
    })
    .required(),
};

export const refreshTokenSchema = {
  headers: z.object({
    authorization: z.string().min(1, "authorization header required"),
  }),
};



export const frezzSchema = {
  params: z.object({
    userId: z.string().optional()
      .refine((value) => {
        if (!value) return true;
        return Types.ObjectId.isValid(value);
      }, {
        message: "userId must be a valid ObjectId",
        path: ["userId"]
      })
  })
};



export const createChatGroupSchema = {
  body: z
    .object({
      memberIds: z.array(generalRules.id).min(1, "At least one member is required"),
      name: z.string().min(2, "Group name too short").max(1000, "Group name too long"),
      attachment: generalRules.file.optional(),
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


export const getConversationSchema = {
  params: z.object({
    conversationId: z.string().refine((id) => Types.ObjectId.isValid(id), {
      message: "Invalid conversation ID",
    }),
  }),
};

export const sendPrivateMessageSchema = {
  body: z.object({
    targetUserId: generalRules.id,
    text: z.string().min(1, "Message cannot be empty"),
  }),
};

export const sendGroupMessageSchema = {
  body: z.object({
    targetGroupId: generalRules.id,
    text: z.string().min(1, "Message cannot be empty"),
  }),
};


export const getOneUserSchema = z.object({
  id: generalRules.id
});





export type createChatGroupSchemaType = z.infer<typeof createChatGroupSchema.body>;
export type getConversationSchemaType = z.infer<typeof getConversationSchema.params>;
export type sendPrivateMessageSchemaType = z.infer<typeof sendPrivateMessageSchema.body>;
export type sendGroupMessageSchemaType = z.infer<typeof sendGroupMessageSchema.body>;



export type signUpSchemaType = z.infer<typeof signUpSchema.body>;
export type confirmEmailSchemaType = z.infer<typeof confirmEmailSchema.body>;
export type logOutSchema = z.infer<typeof logOutSchema.body>;
export type loginWithGmailSchema = z.infer<typeof loginWithGmailSchema.body>;
export type resetPsswordSchemaType = z.infer<typeof resetPasswordSchema.body>;
export type refreshTokenSchemaType = z.infer<typeof refreshTokenSchema>;
export type forgetPasswordSchemaType = z.infer<typeof forgetPasswordSchema>;
export type frezzSchemaType = z.infer<typeof frezzSchema>;
