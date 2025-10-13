import { Router } from "express";
import US from "./user.services";
import { Validation } from "../../middleware/validation";
import * as UV from "./user.validation";
import { Authentication } from "../../middleware/authentication";
import { fileValidation, multerCloud, StorageEnum } from "../../middleware/multer";
import { TokenType } from "../../utils/token";
import { Authorization } from "../../middleware/authorization";

const userRouter = Router();

userRouter.post("/signUp", Validation(UV.signUpSchema), US.signUp);



userRouter.get("/dashboard", Authentication(), Authorization("dashboard"), US.dashBoard)
userRouter.patch("/changerole/:userId", Authentication(), Authorization("dashboard"), US.changeRole);
userRouter.patch("/sendfriendrequest/:userId", Authentication(), US.sendfriendRequest)
userRouter.patch("/accepetfriendrequest/:requestId", Authentication(), US.acceptfriendRequest)


userRouter.patch("/confirmEmail", Validation(UV.confirmEmailSchema), US.confirmEmail);

userRouter.post("/signIn", Validation(UV.signInSchema), US.signIn);

userRouter.get("/getProfile", Authentication(), US.getProfile);

userRouter.post("/logOut", Authentication(), Validation(UV.logOutSchema), US.logOut);

userRouter.get("/refreshToken", Validation(UV.refreshTokenSchema), US.refreshToken);

userRouter.post("/loginWithGmail", Validation(UV.loginWithGmailSchema), US.loginWithGmail);

userRouter.patch("/forgetPassword", Validation(UV.forgetPasswordSchema), US.forgetPassword);

userRouter.patch("/resetPassword", Validation(UV.resetPasswordSchema), US.resetPassword);

userRouter.post("/uploadImage", Authentication(), multerCloud({ fileTypes: fileValidation.image, storageType: StorageEnum.disk }).array("files"), US.uploadImage)

userRouter.patch("/frezze{/:userId}", Authentication(TokenType.access), Validation(UV.frezzSchema), US.freezAccount)
userRouter.patch("/unfrezze{/:userId}", Authentication(TokenType.access), US.unfreezAccount)

// userRouter.post("/uploadImage", Authentication(), multerCloud({ fileTypes: fileValidation.image, storageType: StorageEnum.disk }).array("files"), US.uploadImage)


userRouter.post("/block/:userId", Authentication(), US.blockUser);
userRouter.post("/unblock/:userId", Authentication(), US.unblockUser);
userRouter.delete("/deleteFriendRequest/:requestId", Authentication(), US.deleteFriendRequest);
userRouter.delete("/unfriend/:userId", Authentication(), US.unFriend);
userRouter.delete("/deleteUser/:userId", Authentication(), US.deleteUser);


userRouter.get("/my-groups", Authentication(), US.getUserGroups);


userRouter.post("/createGroup", Authentication(), US.createGroupChat)



export default userRouter;
