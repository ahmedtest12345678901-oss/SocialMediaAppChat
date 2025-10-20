import { Request, Response, NextFunction } from "express";
import z, { httpUrl, ZodType } from "zod";
import { AppError } from "../utils/classError";
import { GraphQLError } from "graphql";
import { error } from "console";
type ReqType = keyof Request;

type schemaType = Partial<Record<ReqType, ZodType>>;

export const Validation = (schema: schemaType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationErrors = [];
    for (const key of Object.keys(schema) as ReqType[]) {
      if (req.file) {
        req.body.attachments = req.file
      }
      if (req?.files) {
        req.body.attachments = req.files
      }
      if (!schema[key]) continue;
      const result = schema[key].safeParse(req[key]);
      if (!result.success) {
        validationErrors.push(result.error);
      }
    }
    if (validationErrors.length) {
      throw new AppError(
        JSON.parse(validationErrors as unknown as string),
        400
      );
    }
    return next();
  };
};



export const ValidationGQL = async <T>(schema: ZodType, args: T) => {
  const errorResult = []
  const result = schema.safeParse(args)
  if (!result.success) {
    errorResult.push(result.error)
  }
  if (errorResult.length) {
    throw new GraphQLError("Validation Error", {
      extensions: {
        message: "Validation",
        http: { status: 400 },
        errors: JSON.parse(errorResult as unknown as string)
      }
    })
  }
}