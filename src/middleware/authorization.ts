import { NextFunction, Request, Response } from "express";
import { RoleType } from "../utils/token";
import { GraphQLError } from "graphql";

export const endpoint = {
    profile: [RoleType.user],
    restoreAccount: [RoleType.admin],
    deleteAccount: [RoleType.admin],
    dashboard: [RoleType.admin, RoleType.superAdmin],
};

export const Authorization =
    (endpointName: keyof typeof endpoint) =>
        (req: Request, res: Response, next: NextFunction) => {
            const user = (req as any).user;

            if (!user) {
                return res.status(401).json({ message: "User not authenticated" });
            }

            const allowedRoles = endpoint[endpointName];

            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({ message: "Access denied" });
            }

            next();
        };



export const AuthorizationGQL = async ({
    accessRoles = [],
    role,
}: {
    accessRoles: RoleType[];
    role: RoleType | undefined;
}) => {
    if (!role || !accessRoles.includes(role)) {
        throw new GraphQLError("UnAuthorized", {
            extensions: {
                message: "UnAuthorized",
                status: 401,
            },
        });
    }
    return true;
};
