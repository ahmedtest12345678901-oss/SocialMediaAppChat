import { DBRepository } from "./db.repositories";
import { Model, Types } from "mongoose";
import { IRevokeToken } from "../DataBase/models/revokeToken.model";

export class RevokeTokenRepository extends DBRepository<IRevokeToken> {
  constructor(protected readonly model: Model<IRevokeToken>) {
    super(model);
  }
}
