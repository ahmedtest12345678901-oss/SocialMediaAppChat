import { IFriendRequest } from "../DataBase/models/friendRequest.models";
import { DBRepository } from "./db.repositories";
import { Model } from "mongoose";

export class FriendRequestRepository extends DBRepository<IFriendRequest> {
    constructor(protected readonly model: Model<IFriendRequest>) {
        super(model);
    }

}
