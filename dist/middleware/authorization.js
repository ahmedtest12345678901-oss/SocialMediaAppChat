"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationGQL = exports.Authorization = exports.endpoint = void 0;
const token_1 = require("../utils/token");
const graphql_1 = require("graphql");
exports.endpoint = {
    profile: [token_1.RoleType.user],
    restoreAccount: [token_1.RoleType.admin],
    deleteAccount: [token_1.RoleType.admin],
    dashboard: [token_1.RoleType.admin, token_1.RoleType.superAdmin],
};
const Authorization = (endpointName) => (req, res, next) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: "User not authenticated" });
    }
    const allowedRoles = exports.endpoint[endpointName];
    if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
    }
    next();
};
exports.Authorization = Authorization;
const AuthorizationGQL = async ({ accessRoles = [], role, }) => {
    if (!role || !accessRoles.includes(role)) {
        throw new graphql_1.GraphQLError("UnAuthorized", {
            extensions: {
                message: "UnAuthorized",
                status: 401,
            },
        });
    }
    return true;
};
exports.AuthorizationGQL = AuthorizationGQL;
