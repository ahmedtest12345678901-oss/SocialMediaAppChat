"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const classError_1 = require("../utils/classError");
const db_repositories_1 = require("./db.repositories");
class UserRepository extends db_repositories_1.DBRepository {
    model;
    constructor(model) {
        super(model);
        this.model = model;
    }
    async createOneUser(data) {
        const user = await this.model.create(data);
        if (!user) {
            throw new classError_1.AppError("fail to connect", 404);
        }
        return user;
    }
}
exports.UserRepository = UserRepository;
