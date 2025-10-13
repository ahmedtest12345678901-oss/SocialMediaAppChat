"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalRules = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = __importDefault(require("zod"));
exports.generalRules = {
    id: zod_1.default.string().refine((value) => {
        return mongoose_1.default.Types.ObjectId.isValid(value);
    }, { message: "inValid user id" }),
    email: zod_1.default.email(),
    password: zod_1.default.string().regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/),
    otp: zod_1.default.string().regex(/^[0-9]{6}$/),
    file: zod_1.default.object({
        fieldname: zod_1.default.string(),
        orginalname: zod_1.default.string().optional(),
        encoding: zod_1.default.string(),
        buffer: zod_1.default.any().optional(),
        path: zod_1.default.string().optional(),
        size: zod_1.default.number()
    })
};
