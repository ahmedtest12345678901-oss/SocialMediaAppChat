"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const user_type_1 = require("./user.type");
const user_services_1 = __importDefault(require("../user.services"));
const user_args_1 = require("./user.args");
class UserFields {
    constructor() { }
    query = () => {
        return {
            getOneUser: {
                type: user_type_1.userType,
                resolve: user_services_1.default.getOneUser
            },
            getAllUsers: {
                type: new graphql_1.GraphQLList((user_type_1.userType)),
                resolve: user_services_1.default.getUsers
            }
        };
    };
    mutation = () => {
        return {
            createUser: {
                type: user_type_1.userType,
                args: user_args_1.createUserArgs,
                resolve: user_services_1.default.createUserGQL
            }
        };
    };
}
exports.default = new UserFields();
