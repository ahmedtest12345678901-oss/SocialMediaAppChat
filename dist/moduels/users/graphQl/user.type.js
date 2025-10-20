"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userType = exports.GenderEnum = void 0;
const graphql_1 = require("graphql");
const user_model_1 = require("../../../DataBase/models/user.model");
exports.GenderEnum = new graphql_1.GraphQLEnumType({
    name: "GenderEnum",
    values: {
        male: { value: user_model_1.GenderType.male },
        female: { value: user_model_1.GenderType.female },
    }
});
exports.userType = new graphql_1.GraphQLObjectType({
    name: "User",
    fields: {
        _id: { type: graphql_1.GraphQLID },
        userName: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString), resolve: (parent) => {
                return parent.gender == user_model_1.GenderType.male ? "Eng:" + parent.userName : "Eng:" + parent.userName;
            }
        },
        email: { type: graphql_1.GraphQLString },
        gender: { type: new graphql_1.GraphQLNonNull(exports.GenderEnum) },
        age: { type: graphql_1.GraphQLInt },
        friends: { type: new graphql_1.GraphQLList(graphql_1.GraphQLID) }
    }
});
