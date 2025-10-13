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
const user_services_1 = __importDefault(require("./user.services"));
const validation_1 = require("../../middleware/validation");
const UV = __importStar(require("./user.validation"));
const authentication_1 = require("../../middleware/authentication");
const multer_1 = require("../../middleware/multer");
const token_1 = require("../../utils/token");
const authorization_1 = require("../../middleware/authorization");
const userRouter = (0, express_1.Router)();
userRouter.post("/signUp", (0, validation_1.Validation)(UV.signUpSchema), user_services_1.default.signUp);
userRouter.get("/dashboard", (0, authentication_1.Authentication)(), (0, authorization_1.Authorization)("dashboard"), user_services_1.default.dashBoard);
userRouter.patch("/changerole/:userId", (0, authentication_1.Authentication)(), (0, authorization_1.Authorization)("dashboard"), user_services_1.default.changeRole);
userRouter.patch("/sendfriendrequest/:userId", (0, authentication_1.Authentication)(), user_services_1.default.sendfriendRequest);
userRouter.patch("/accepetfriendrequest/:requestId", (0, authentication_1.Authentication)(), user_services_1.default.acceptfriendRequest);
userRouter.patch("/confirmEmail", (0, validation_1.Validation)(UV.confirmEmailSchema), user_services_1.default.confirmEmail);
userRouter.post("/signIn", (0, validation_1.Validation)(UV.signInSchema), user_services_1.default.signIn);
userRouter.get("/getProfile", (0, authentication_1.Authentication)(), user_services_1.default.getProfile);
userRouter.post("/logOut", (0, authentication_1.Authentication)(), (0, validation_1.Validation)(UV.logOutSchema), user_services_1.default.logOut);
userRouter.get("/refreshToken", (0, validation_1.Validation)(UV.refreshTokenSchema), user_services_1.default.refreshToken);
userRouter.post("/loginWithGmail", (0, validation_1.Validation)(UV.loginWithGmailSchema), user_services_1.default.loginWithGmail);
userRouter.patch("/forgetPassword", (0, validation_1.Validation)(UV.forgetPasswordSchema), user_services_1.default.forgetPassword);
userRouter.patch("/resetPassword", (0, validation_1.Validation)(UV.resetPasswordSchema), user_services_1.default.resetPassword);
userRouter.post("/uploadImage", (0, authentication_1.Authentication)(), (0, multer_1.multerCloud)({ fileTypes: multer_1.fileValidation.image, storageType: multer_1.StorageEnum.disk }).array("files"), user_services_1.default.uploadImage);
userRouter.patch("/frezze{/:userId}", (0, authentication_1.Authentication)(token_1.TokenType.access), (0, validation_1.Validation)(UV.frezzSchema), user_services_1.default.freezAccount);
userRouter.patch("/unfrezze{/:userId}", (0, authentication_1.Authentication)(token_1.TokenType.access), user_services_1.default.unfreezAccount);
userRouter.post("/block/:userId", (0, authentication_1.Authentication)(), user_services_1.default.blockUser);
userRouter.post("/unblock/:userId", (0, authentication_1.Authentication)(), user_services_1.default.unblockUser);
userRouter.delete("/deleteFriendRequest/:requestId", (0, authentication_1.Authentication)(), user_services_1.default.deleteFriendRequest);
userRouter.delete("/unfriend/:userId", (0, authentication_1.Authentication)(), user_services_1.default.unFriend);
userRouter.delete("/deleteUser/:userId", (0, authentication_1.Authentication)(), user_services_1.default.deleteUser);
userRouter.get("/my-groups", (0, authentication_1.Authentication)(), user_services_1.default.getUserGroups);
userRouter.post("/createGroup", (0, authentication_1.Authentication)(), user_services_1.default.createGroupChat);
exports.default = userRouter;
