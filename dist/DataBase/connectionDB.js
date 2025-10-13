"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectionDB = () => {
    mongoose_1.default
        .connect(process.env.URL_DB)
        .then(() => {
        console.log(" Successfully to connect DataBase ..............");
    })
        .catch((error) => {
        console.error(" Failed to connect to DataBase:", error);
    });
};
exports.connectionDB = connectionDB;
exports.default = exports.connectionDB;
