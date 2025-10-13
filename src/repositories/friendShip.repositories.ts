import { IFriendShip } from "../DataBase/models/friendShip.model";
import { DBRepository } from "./db.repositories";
import { Model } from "mongoose";

export class FriendShipRepository extends DBRepository<IFriendShip> {
    constructor(protected readonly model: Model<IFriendShip>) {
        super(model);
    }

}
