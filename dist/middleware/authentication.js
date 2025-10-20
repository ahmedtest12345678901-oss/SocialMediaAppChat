"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationGraphQl = exports.Authentication = void 0;
const classError_1 = require("../utils/classError");
const token_1 = require("../utils/token");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const graphql_1 = require("graphql");
const Authentication = (tokenType = token_1.TokenType.access) => {
    return async (req, res, next) => {
        const authorization = req.headers.authorization;
        if (!authorization) {
            throw new classError_1.AppError("Authorization header missing", 400);
        }
        const [prefix, token] = authorization.split(" ");
        if (prefix !== "Bearer" || !token) {
            throw new classError_1.AppError("Invalid token format", 400);
        }
        const decodedTemp = jsonwebtoken_1.default.decode(token);
        if (!decodedTemp || typeof decodedTemp === "string" || !("role" in decodedTemp)) {
            throw new classError_1.AppError("Invalid token payload", 401);
        }
        const signature = (0, token_1.getTokenSignature)(tokenType, decodedTemp.role);
        const { decoded, user } = await (0, token_1.decodTokenAndFetchUser)(token, signature);
        req.user = user;
        req.decoded = decoded;
        return next();
    };
};
exports.Authentication = Authentication;
const AuthenticationGraphQl = async (authorization, tokenType = token_1.TokenType.access) => {
    const [prefix, token] = authorization.split(" ");
    if (prefix !== "Bearer" || !token) {
        throw new graphql_1.GraphQLError("Invalid token format", {
            extensions: {
                message: 'token not found',
                http: {
                    status: 404
                }
            }
        });
    }
    const decodedTemp = jsonwebtoken_1.default.decode(token);
    if (!decodedTemp || typeof decodedTemp === "string" || !("role" in decodedTemp)) {
        throw new graphql_1.GraphQLError("Invalid token paylod", {
            extensions: {
                message: 'token not found',
                http: {
                    status: 401
                }
            }
        });
    }
    const signature = (0, token_1.getTokenSignature)(tokenType, decodedTemp.role);
    const { decoded, user } = await (0, token_1.decodTokenAndFetchUser)(token, signature);
    return { decoded, user };
};
exports.AuthenticationGraphQl = AuthenticationGraphQl;
