import { IComment } from "../DataBase/models/comment.model";
import { DBRepository } from "./db.repositories";
import { Model} from "mongoose";

export class CommentRepository extends DBRepository<IComment> {
    constructor(protected readonly model: Model<IComment>) {
        super(model);
    }

}
