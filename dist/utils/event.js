"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventEmitter = void 0;
const events_1 = require("events");
const sendEmail_1 = require("../services/sendEmail");
const email_template_1 = require("../services/email.template");
const s3_config_1 = require("./s3.config");
const user_repositories_1 = require("../repositories/user.repositories");
const user_model_1 = __importDefault(require("../DataBase/models/user.model"));
exports.eventEmitter = new events_1.EventEmitter();
exports.eventEmitter.on("confrimEmail", async (data) => {
    const { email, otp } = data;
    await (0, sendEmail_1.sendEmail)({
        to: email,
        subject: "Confirm Email ",
        html: (0, email_template_1.emailTemplate)(otp, "Email Confirmation"),
    });
});
exports.eventEmitter.on("ForgetPassword", async (data) => {
    const { email, otp } = data;
    await (0, sendEmail_1.sendEmail)({
        to: email,
        subject: "ForgetPassword ",
        html: (0, email_template_1.emailTemplate)(otp, "Email Confirmation"),
    });
});
exports.eventEmitter.on("uploadProfileImage", async (data) => {
    const { userId, oldKey, Key, expireIn } = data;
    const _userModel = new user_repositories_1.UserRepository(user_model_1.default);
    setTimeout(async () => {
        try {
            await (0, s3_config_1.getFile)({ Key });
            await _userModel.findOneAndUpdate({ _id: userId }, { $unset: { tempProfileIamge: "" } });
            if (oldKey) {
                await (0, s3_config_1.deleteFile)({ Key: oldKey });
            }
            console.log(" ProfileImage updated & OldImage Deleted.");
        }
        catch (error) {
            console.log(" Error in uploadProfileImage ", error);
            if (error?.Code === "NoSuchKey") {
                if (!oldKey) {
                    await _userModel.findOneAndUpdate({ _id: userId }, { $unset: { profileImage: "" } });
                }
                else {
                    await _userModel.findOneAndUpdate({ _id: userId }, {
                        $set: { profileImage: oldKey },
                        $unset: { tempProfileIamge: "" }
                    });
                }
            }
        }
    }, expireIn * 1000);
});
