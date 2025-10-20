"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const post_services_1 = __importDefault(require("../post.services"));
const post_type_1 = require("./post.type");
class PostFields {
    constructor() { }
    query = () => {
        return {
            getPosts: {
                type: new graphql_1.GraphQLList((post_type_1.postType)),
                resolve: post_services_1.default.getPostsGQL
            }
        };
    };
}
exports.default = new PostFields();
