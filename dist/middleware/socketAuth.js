"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuthentication = void 0;
const classError_1 = require("../utils/classError");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const token_1 = require("../utils/token");
const socketAuthentication = async (socket, next) => {
    try {
        const authHeader = socket.handshake.auth?.Authorization || socket.handshake.auth?.token;
        if (!authHeader) {
            throw new classError_1.AppError("Authorization token missing", 400);
        }
        const [prefix, token] = authHeader.split(" ");
        if (prefix !== "Bearer" || !token) {
            throw new classError_1.AppError("Invalid token format", 400);
        }
        const decodedTemp = jsonwebtoken_1.default.decode(token);
        if (!decodedTemp || typeof decodedTemp === "string" || !("role" in decodedTemp)) {
            throw new classError_1.AppError("Invalid token payload", 401);
        }
        const signature = (0, token_1.getTokenSignature)(token_1.TokenType.access, decodedTemp.role);
        const { decoded, user } = await (0, token_1.decodTokenAndFetchUser)(token, signature);
        socket.user = user;
        socket.decoded = decoded;
        next();
    }
    catch (error) {
        console.error(" Socket auth error:", error.message);
        next(new Error(error.message));
    }
};
exports.socketAuthentication = socketAuthentication;
