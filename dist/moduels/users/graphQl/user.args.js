"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserArgs = exports.getUserArgs = void 0;
const graphql_1 = require("graphql");
const user_model_1 = require("../../../DataBase/models/user.model");
exports.getUserArgs = {
    id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) },
};
exports.createUserArgs = {
    fName: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
    lName: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
    email: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
    password: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
    gender: {
        type: new graphql_1.GraphQLNonNull(new graphql_1.GraphQLEnumType({
            name: "Gender",
            values: {
                male: { value: user_model_1.GenderType.male },
                female: { value: user_model_1.GenderType.female },
            },
        })),
    },
    age: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt) },
    address: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
    phone: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
    userName: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
};
