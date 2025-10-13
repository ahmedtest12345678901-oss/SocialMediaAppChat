import { IPost } from "../DataBase/models/post.model";
import { DBRepository } from "./db.repositories";
import { Model} from "mongoose";

export class PostRepository extends DBRepository<IPost> {
    constructor(protected readonly model: Model<IPost>) {
        super(model);
    }

}
