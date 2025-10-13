"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRepository = void 0;
const db_repositories_1 = require("./db.repositories");
class ChatRepository extends db_repositories_1.DBRepository {
    model;
    constructor(model) {
        super(model);
        this.model = model;
    }
}
exports.ChatRepository = ChatRepository;
