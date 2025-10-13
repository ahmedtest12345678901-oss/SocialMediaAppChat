import { HydratedDocument } from "mongoose";
import { IUser } from "../../DataBase/models/user.model";
import { JwtPayload } from "jsonwebtoken";
import { Socket } from "socket.io";

export interface SocketWithUser extends Socket {
  user?: Partial<HydratedDocument<IUser>>;
  decoded?: JwtPayload;
}