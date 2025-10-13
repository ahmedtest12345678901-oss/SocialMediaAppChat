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
const PV = __importStar(require("./post.validation"));
const post_services_1 = __importDefault(require("./post.services"));
const validation_1 = require("../../middleware/validation");
const multer_1 = require("../../middleware/multer");
const authentication_1 = require("../../middleware/authentication");
const comment_controller_1 = __importDefault(require("../comments/comment.controller"));
const postRouter = (0, express_1.Router)();
postRouter.use("/:postId/comments", comment_controller_1.default);
postRouter.post("/createPost", (0, authentication_1.Authentication)(), (0, multer_1.multerCloud)({ fileTypes: multer_1.fileValidation.image }).array("attachments", 2), (0, validation_1.Validation)(PV.createPostSchema), post_services_1.default.createPost);
postRouter.patch("/:postId", (0, authentication_1.Authentication)(), (0, validation_1.Validation)(PV.likePostSchema), post_services_1.default.likePost);
postRouter.patch("/update/:postId", (0, authentication_1.Authentication)(), (0, multer_1.multerCloud)({ fileTypes: multer_1.fileValidation.image }).array("attachments", 2), (0, validation_1.Validation)(PV.updatePostSchema), post_services_1.default.updatePost);
postRouter.get("/", post_services_1.default.getPosts);
postRouter.delete("/hardDelete/:postId", (0, authentication_1.Authentication)(), post_services_1.default.hardDeletePost);
postRouter.get("/getPostById/:postId", (0, authentication_1.Authentication)(), post_services_1.default.getPostById);
postRouter.patch("/freeze/:postId", (0, authentication_1.Authentication)(), post_services_1.default.freezePost);
postRouter.patch("/unfreeze/:postId", (0, authentication_1.Authentication)(), post_services_1.default.unfreezePost);
exports.default = postRouter;
