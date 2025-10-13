"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Authorization = exports.endpoint = void 0;
const token_1 = require("../utils/token");
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
