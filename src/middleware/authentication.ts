import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/classError";
import { decodTokenAndFetchUser, getTokenSignature, RoleType, TokenType, } from "../utils/token";
import { HydratedDocument } from "mongoose";
import { IUser } from "../DataBase/models/user.model";
import jwt, { JwtPayload } from "jsonwebtoken";
export interface RequestWithUser extends Request {
  user?: HydratedDocument<IUser>;
  decoded?: JwtPayload;
}

export const Authentication = (tokenType: TokenType = TokenType.access) => {
  return async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
      throw new AppError("Authorization header missing", 400);
    }

    const [prefix, token] = authorization.split(" ");
    if (prefix !== "Bearer" || !token) {
      throw new AppError("Invalid token format", 400);
    }

    const decodedTemp = jwt.decode(token);
    if (!decodedTemp || typeof decodedTemp === "string" || !("role" in decodedTemp)) {
      throw new AppError("Invalid token payload", 401);
    }

    const signature = getTokenSignature(tokenType, decodedTemp.role as RoleType);

    const { decoded, user } = await decodTokenAndFetchUser(token, signature);

    req.user = user;
    req.decoded = decoded;

    return next();
  };
};