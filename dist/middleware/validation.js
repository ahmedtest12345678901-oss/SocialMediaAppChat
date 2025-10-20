"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationGQL = exports.Validation = void 0;
const classError_1 = require("../utils/classError");
const graphql_1 = require("graphql");
const Validation = (schema) => {
    return (req, res, next) => {
        const validationErrors = [];
        for (const key of Object.keys(schema)) {
            if (req.file) {
                req.body.attachments = req.file;
            }
            if (req?.files) {
                req.body.attachments = req.files;
            }
            if (!schema[key])
                continue;
            const result = schema[key].safeParse(req[key]);
            if (!result.success) {
                validationErrors.push(result.error);
            }
        }
        if (validationErrors.length) {
            throw new classError_1.AppError(JSON.parse(validationErrors), 400);
        }
        return next();
    };
};
exports.Validation = Validation;
const ValidationGQL = async (schema, args) => {
    const errorResult = [];
    const result = schema.safeParse(args);
    if (!result.success) {
        errorResult.push(result.error);
    }
    if (errorResult.length) {
        throw new graphql_1.GraphQLError("Validation Error", {
            extensions: {
                message: "Validation",
                http: { status: 400 },
                errors: JSON.parse(errorResult)
            }
        });
    }
};
exports.ValidationGQL = ValidationGQL;
