import { Model } from "mongoose";
import { DBRepository } from "./db.repositories";
import { ConversationDocument } from "../DataBase/models/conversations.models";

export class ConversationRepository extends DBRepository<ConversationDocument> {
    constructor(protected readonly model: Model<ConversationDocument>) {
        super(model);
    }
}
