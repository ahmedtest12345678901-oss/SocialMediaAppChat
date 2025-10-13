import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { AppError } from "../../utils/classError";
import { VerifyToken } from "../../utils/token";
import { ChatInitiation } from "../chat/chat";

const connectedSockets = new Map<string, string[]>();
let io: Server | null = null;

function socketAuthentication(socket: Socket, next: Function) {
  try {
    const token = socket.handshake.auth.authorization;
    if (!token) throw new AppError("Missing token", 401);

    const decodedData = VerifyToken({
      token,
      signature: process.env.ACCESS_TOKEN_USER as string,
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
  } catch (error) {
    next(error);
  }
}

export const initializer = (server: HTTPServer) => {
  io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.use(socketAuthentication);

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;

    ChatInitiation(socket);

    socket.broadcast.emit("user-online", { userId });

    socket.on("typing", (targetUserId: string) => {
      const targetTabs = connectedSockets.get(targetUserId) || [];
      for (const tabId of targetTabs) {
        getIo().to(tabId).emit("typing", { from: userId });
      }
    });

    socket.on("stop-typing", (targetUserId: string) => {
      const targetTabs = connectedSockets.get(targetUserId) || [];
      for (const tabId of targetTabs) {
        getIo().to(tabId).emit("stop-typing", { from: userId });
      }
    });

    socket.on("disconnect", () => {
      const userTabs = connectedSockets.get(userId);
      if (userTabs) {
        const remaining = userTabs.filter((id) => id !== socket.id);
        if (remaining.length > 0) {
          connectedSockets.set(userId, remaining);
        } else {
          connectedSockets.delete(userId);
          socket.broadcast.emit("user-offline", { userId });
        }
      }
      console.log(` User ${userId} disconnected`);
    });
  });
};

export const getIo = () => {
  if (!io) throw new AppError("Socket.io not initialized");
  return io;
};
