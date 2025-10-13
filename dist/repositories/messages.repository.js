"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesRepository = void 0;
const db_repositories_1 = require("./db.repositories");
class MessagesRepository extends db_repositories_1.DBRepository {
    model;
    constructor(model) {
        super(model);
        this.model = model;
    }
}
exports.MessagesRepository = MessagesRepository;
