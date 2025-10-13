"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const comment_services_1 = __importDefault(require("./comment.services"));
const CV = __importStar(require("./comment.validation"));
const validation_1 = require("../../middleware/validation");
const multer_1 = require("../../middleware/multer");
const authentication_1 = require("../../middleware/authentication");
const commentRouter = (0, express_1.Router)({ mergeParams: true });
commentRouter.post("/", (0, authentication_1.Authentication)(), (0, multer_1.multerCloud)({ fileTypes: multer_1.fileValidation.image }).array("attachments", 2), (0, validation_1.Validation)(CV.createcommentSchema), comment_services_1.default.createComment);
commentRouter.post("/:commentId/reply", (0, authentication_1.Authentication)(), (0, multer_1.multerCloud)({ fileTypes: multer_1.fileValidation.image }).array("attachments", 2), (0, validation_1.Validation)(CV.createcommentSchema), comment_services_1.default.createCommentReply);
commentRouter.patch("/freeze/:commentId", (0, authentication_1.Authentication)(), (0, validation_1.Validation)(CV.commentActionSchema), comment_services_1.default.freezeComment);
commentRouter.delete("/hardDeleteComment/:commentId", (0, authentication_1.Authentication)(), (0, validation_1.Validation)(CV.commentActionSchema), comment_services_1.default.hardDeleteComment);
commentRouter.put("/:commentId", (0, authentication_1.Authentication)(), (0, validation_1.Validation)(CV.updateCommentSchema), comment_services_1.default.updateComment);
``;
commentRouter.get("/:commentId", (0, validation_1.Validation)(CV.getCommentSchema), comment_services_1.default.getCommentById);
commentRouter.get("/getCommentWithReplies/:commentId", (0, validation_1.Validation)(CV.getCommentWithReplySchema), comment_services_1.default.getCommentWithReply);
exports.default = commentRouter;
