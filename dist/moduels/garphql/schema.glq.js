"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemaGQL = void 0;
const graphql_1 = require("graphql");
const user_fields_1 = __importDefault(require("../users/graphQl/user.fields"));
const post_fields_1 = __importDefault(require("../posts/graphQl/post.fields"));
const userss = [
    { id: 1, name: "ali", email: "ali@gamil.com", password: 134, wife: { name: "yara" } },
    { id: 2, name: "Sayed", email: "Sayed@gamil.com", password: 1345, wife: { name: "yara" } },
    { id: 3, name: "Sokkar", email: "Sokkar@gamil.com", password: 134567, wife: { name: "yara" } },
];
const userType = new graphql_1.GraphQLObjectType({
    name: "geTuSER",
    fields: {
        id: { type: graphql_1.GraphQLID },
        name: { type: graphql_1.GraphQLString },
        email: { type: graphql_1.GraphQLString },
        password: { type: graphql_1.GraphQLString },
        wife: {
            type: new graphql_1.GraphQLObjectType({
                name: "wife",
                fields: {
                    name: { type: graphql_1.GraphQLString },
                }
            })
        }
    }
});
exports.schemaGQL = new graphql_1.GraphQLSchema({
    query: new graphql_1.GraphQLObjectType({
        name: "Query",
        description: "this is description",
        fields: () => ({
            ...user_fields_1.default.query(),
            ...post_fields_1.default.query(),
        }),
    }),
    mutation: new graphql_1.GraphQLObjectType({
        name: "Mutation",
        fields: () => ({
            ...user_fields_1.default.mutation(),
        }),
    }),
});
