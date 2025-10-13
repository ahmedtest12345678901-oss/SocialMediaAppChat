"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIo = exports.initializer = void 0;
const socket_io_1 = require("socket.io");
const classError_1 = require("../../utils/classError");
const token_1 = require("../../utils/token");
const chat_1 = require("../chat/chat");
const connectedSockets = new Map();
let io = null;
function socketAuthentication(socket, next) {
    try {
        const token = socket.handshake.auth.authorization;
        if (!token)
            throw new classError_1.AppError("Missing token", 401);
        const decodedData = (0, token_1.VerifyToken)({
            token,
            signature: process.env.ACCESS_TOKEN_USER,
        });
        socket.data = {
            userId: decodedData._id,
            fName: decodedData.fName,
            lName: decodedData.lName,
            userName: decodedData.userName,
        };
        const userTabs = connectedSockets.get(socket.data.userId) || [];
        userTabs.push(socket.id);
        connectedSockets.set(socket.data.userId, userTabs);
        socket.emit("connect_user", {
            user: {
                _id: socket.data.userId,
                fName: decodedData.fName,
                lName: decodedData.lName,
                userName: decodedData.userName,
            },
        });
        console.log(" User connected:", socket.data.userName);
        next();
    }
    catch (error) {
        next(error);
    }
}
const initializer = (server) => {
    io = new socket_io_1.Server(server, {
        cors: { origin: "*", methods: ["GET", "POST"] },
    });
    io.use(socketAuthentication);
    io.on("connection", (socket) => {
        const userId = socket.data.userId;
        (0, chat_1.ChatInitiation)(socket);
        socket.broadcast.emit("user-online", { userId });
        socket.on("typing", (targetUserId) => {
            const targetTabs = connectedSockets.get(targetUserId) || [];
            for (const tabId of targetTabs) {
                (0, exports.getIo)().to(tabId).emit("typing", { from: userId });
            }
        });
        socket.on("stop-typing", (targetUserId) => {
            const targetTabs = connectedSockets.get(targetUserId) || [];
            for (const tabId of targetTabs) {
                (0, exports.getIo)().to(tabId).emit("stop-typing", { from: userId });
            }
        });
        socket.on("disconnect", () => {
            const userTabs = connectedSockets.get(userId);
            if (userTabs) {
                const remaining = userTabs.filter((id) => id !== socket.id);
                if (remaining.length > 0) {
                    connectedSockets.set(userId, remaining);
                }
                else {
                    connectedSockets.delete(userId);
                    socket.broadcast.emit("user-offline", { userId });
                }
            }
            console.log(` User ${userId} disconnected`);
        });
    });
};
exports.initializer = initializer;
const getIo = () => {
    if (!io)
        throw new classError_1.AppError("Socket.io not initialized");
    return io;
};
exports.getIo = getIo;
