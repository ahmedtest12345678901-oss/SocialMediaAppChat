import { HydratedDocument } from "mongoose"
import { IUser } from "../DataBase/models/user.model"
import { JwtPayload } from "jsonwebtoken"

declare module "express-serve-static-core"{
    interface Request{
        user?:HydratedDocument<IUser>,
        decoded?:JwtPayload
    }
}