import { IComment } from "../DataBase/models/comment.model";
import { IMessages } from "../DataBase/models/messages.model";
import { DBRepository } from "./db.repositories";
import { Model} from "mongoose";

export class MessagesRepository extends DBRepository<IMessages> {
    constructor(protected readonly model: Model<IMessages>) {
        super(model);
    }

}
