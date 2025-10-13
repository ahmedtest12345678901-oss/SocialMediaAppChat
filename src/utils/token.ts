import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { AppError } from "./classError";
import userModel from "../DataBase/models/user.model";
import { NextFunction, Request, Response } from "express";
import { UserRepository } from "../repositories/user.repositories";
import { RevokeTokenRepository } from "../repositories/revokeToken.repositories";
import revokeTokenModel from "../DataBase/models/revokeToken.model";


const _userModel = new UserRepository(userModel);
const _revoketoken = new RevokeTokenRepository(revokeTokenModel);

export const GenerateToken = ({
  payload,
  SIGNATURE,
  options,
}: {
  payload: object;
  SIGNATURE: string;
  options?: SignOptions;
}): string => {
  return jwt.sign(payload, SIGNATURE, options);
};

export enum TokenType {
  access = "access",
  refresh = "refresh",
}

export enum RoleType {
  user = "user",
  admin = "admin",
  superAdmin="super-admin"
}

export const getTokenSignature = (
  type: TokenType,
  role: RoleType
): string => {
  if (type === TokenType.access) {
    return role === RoleType.user
      ? process.env.ACCESS_TOKEN_USER!
      : process.env.ACCESS_TOKEN_ADMIN!;
  }
  if (type === TokenType.refresh) {
    return role === RoleType.user
      ? process.env.REFRESH_TOKEN_USER!
      : process.env.REFRESH_TOKEN_ADMIN!;
  }
  throw new AppError("Invalid token type", 500);
};

export const VerifyToken = ({
  token,
  signature,
}: {
  signature: string;
  token: string;
}): JwtPayload => {
  try {
    const decoded = jwt.verify(token, signature);
    if (typeof decoded === "string") {
      throw new AppError("Invalid token payload", 401);
    }
    return decoded as JwtPayload;
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }
};

export const decodTokenAndFetchUser = async (
  token: string,
  signature: string
) => {
  const decoded = VerifyToken({ token, signature });

  if (!decoded?.email) {
    throw new AppError("Invalid token payload", 401);
  }

  const user = await _userModel.findOne({ email: decoded.email });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.confirmed) {
    throw new AppError("Please Confirm First", 403);
  }

  if (await _revoketoken.findOne({ tokenId: decoded?.jti })) {
    throw new AppError("Token has been revoked", 401);
  }

  if (user?.changeCredentials?.getTime()! > decoded.iat! * 1000) {
    throw new AppError("Token has been revoked", 401);
  }

  return { decoded, user };
};

const decodeTokenWithoutVerify = (token: string) => {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded === "string") {
    throw new AppError("Invalid token payload", 401);
  }
  return decoded as JwtPayload;
};

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      throw new AppError("Authorization header missing", 400);
    }

    const [prefix, token] = authorization.split(" ");
    if (!prefix || !token) {
      throw new AppError("Invalid token format", 400);
    }
    if (prefix !== "Bearer") {
      throw new AppError("Invalid token prefix", 400);
    }

    const decodedTemp = decodeTokenWithoutVerify(token);

    if (!decodedTemp.role) {
      throw new AppError("Role not found in token", 401);
    }

    const signature = getTokenSignature(TokenType.access, decodedTemp.role as RoleType);

    const { user } = await decodTokenAndFetchUser(token, signature);

    (req as any).user = user;

    next();
  } catch (error) {
    next(error);
  }
};