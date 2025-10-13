import { IUser } from "../DataBase/models/user.model";
import { AppError } from "../utils/classError";
import { DBRepository } from "./db.repositories";
import { HydratedDocument, Model } from "mongoose";

export class UserRepository extends DBRepository<IUser> {
  constructor(protected readonly model: Model<IUser>) {
    super(model);
  }
  async createOneUser(data: Partial<IUser>): Promise<HydratedDocument<IUser>> {
    const user: HydratedDocument<IUser> = await this.model.create(data);
    if (!user) {
      throw new AppError("fail to connect", 404);
    }
    return user;
  }
}