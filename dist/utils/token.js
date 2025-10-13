"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = exports.decodTokenAndFetchUser = exports.VerifyToken = exports.getTokenSignature = exports.RoleType = exports.TokenType = exports.GenerateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const classError_1 = require("./classError");
const user_model_1 = __importDefault(require("../DataBase/models/user.model"));
const user_repositories_1 = require("../repositories/user.repositories");
const revokeToken_repositories_1 = require("../repositories/revokeToken.repositories");
const revokeToken_model_1 = __importDefault(require("../DataBase/models/revokeToken.model"));
const _userModel = new user_repositories_1.UserRepository(user_model_1.default);
const _revoketoken = new revokeToken_repositories_1.RevokeTokenRepository(revokeToken_model_1.default);
const GenerateToken = ({ payload, SIGNATURE, options, }) => {
    return jsonwebtoken_1.default.sign(payload, SIGNATURE, options);
};
exports.GenerateToken = GenerateToken;
var TokenType;
(function (TokenType) {
    TokenType["access"] = "access";
    TokenType["refresh"] = "refresh";
})(TokenType || (exports.TokenType = TokenType = {}));
var RoleType;
(function (RoleType) {
    RoleType["user"] = "user";
    RoleType["admin"] = "admin";
    RoleType["superAdmin"] = "super-admin";
})(RoleType || (exports.RoleType = RoleType = {}));
const getTokenSignature = (type, role) => {
    if (type === TokenType.access) {
        return role === RoleType.user
            ? process.env.ACCESS_TOKEN_USER
            : process.env.ACCESS_TOKEN_ADMIN;
    }
    if (type === TokenType.refresh) {
        return role === RoleType.user
            ? process.env.REFRESH_TOKEN_USER
            : process.env.REFRESH_TOKEN_ADMIN;
    }
    throw new classError_1.AppError("Invalid token type", 500);
};
exports.getTokenSignature = getTokenSignature;
const VerifyToken = ({ token, signature, }) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, signature);
        if (typeof decoded === "string") {
            throw new classError_1.AppError("Invalid token payload", 401);
        }
        return decoded;
    }
    catch {
        throw new classError_1.AppError("Invalid or expired token", 401);
    }
};
exports.VerifyToken = VerifyToken;
const decodTokenAndFetchUser = async (token, signature) => {
    const decoded = (0, exports.VerifyToken)({ token, signature });
    if (!decoded?.email) {
        throw new classError_1.AppError("Invalid token payload", 401);
    }
    const user = await _userModel.findOne({ email: decoded.email });
    if (!user) {
        throw new classError_1.AppError("User not found", 404);
    }
    if (!user.confirmed) {
        throw new classError_1.AppError("Please Confirm First", 403);
    }
    if (await _revoketoken.findOne({ tokenId: decoded?.jti })) {
        throw new classError_1.AppError("Token has been revoked", 401);
    }
    if (user?.changeCredentials?.getTime() > decoded.iat * 1000) {
        throw new classError_1.AppError("Token has been revoked", 401);
    }
    return { decoded, user };
};
exports.decodTokenAndFetchUser = decodTokenAndFetchUser;
const decodeTokenWithoutVerify = (token) => {
    const decoded = jsonwebtoken_1.default.decode(token);
    if (!decoded || typeof decoded === "string") {
        throw new classError_1.AppError("Invalid token payload", 401);
    }
    return decoded;
};
const authMiddleware = async (req, res, next) => {
    try {
        const { authorization } = req.headers;
        if (!authorization) {
            throw new classError_1.AppError("Authorization header missing", 400);
        }
        const [prefix, token] = authorization.split(" ");
        if (!prefix || !token) {
            throw new classError_1.AppError("Invalid token format", 400);
        }
        if (prefix !== "Bearer") {
            throw new classError_1.AppError("Invalid token prefix", 400);
        }
        const decodedTemp = decodeTokenWithoutVerify(token);
        if (!decodedTemp.role) {
            throw new classError_1.AppError("Role not found in token", 401);
        }
        const signature = (0, exports.getTokenSignature)(TokenType.access, decodedTemp.role);
        const { user } = await (0, exports.decodTokenAndFetchUser)(token, signature);
        req.user = user;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authMiddleware = authMiddleware;
