"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderEnum = exports.RoleEnum = exports.GenderEnum = void 0;
const graphql_1 = require("graphql");
const token_1 = require("../../../utils/token");
const user_model_1 = require("../../../DataBase/models/user.model");
exports.GenderEnum = new graphql_1.GraphQLEnumType({
    name: "GenderEnum",
    values: {
        male: { value: user_model_1.GenderType.male },
        female: { value: user_model_1.GenderType.female },
    },
});
exports.RoleEnum = new graphql_1.GraphQLEnumType({
    name: "RoleEnum",
    values: {
        user: { value: token_1.RoleType.user },
        admin: { value: token_1.RoleType.admin },
        superAdmin: { value: token_1.RoleType.superAdmin },
    },
});
exports.ProviderEnum = new graphql_1.GraphQLEnumType({
    name: "ProviderEnum",
    values: {
        system: { value: user_model_1.ProviderType.system },
        google: { value: user_model_1.ProviderType.google },
    },
});
