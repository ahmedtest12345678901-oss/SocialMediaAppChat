import { EventEmitter } from "events";
import { sendEmail } from "../services/sendEmail";
import { emailTemplate } from "../services/email.template";
import { deleteFile, getFile } from "./s3.config";
import { UserRepository } from "../repositories/user.repositories";
import userModel from "../DataBase/models/user.model";

export const eventEmitter = new EventEmitter();

eventEmitter.on("confrimEmail", async (data) => {
  const { email, otp } = data;


  await sendEmail({
    to: email,
    subject: "Confirm Email ",
    html: emailTemplate(otp as unknown as string, "Email Confirmation"),
  });
});
eventEmitter.on("ForgetPassword", async (data) => {
  const { email, otp } = data;


  await sendEmail({
    to: email,
    subject: "ForgetPassword ",
    html: emailTemplate(otp as unknown as string, "Email Confirmation"),
  });
});


eventEmitter.on("uploadProfileImage", async (data) => {
  const { userId, oldKey, Key, expireIn } = data;
  const _userModel = new UserRepository(userModel);

  setTimeout(async () => {
    try {
      await getFile({ Key });

      await _userModel.findOneAndUpdate(
        { _id: userId },
        { $unset: { tempProfileIamge: "" } }
      );

      if (oldKey) {
        await deleteFile({ Key: oldKey });
      }

      console.log(" ProfileImage updated & OldImage Deleted.");
    } catch (error: any) {
      console.log(" Error in uploadProfileImage ", error);

      if (error?.Code === "NoSuchKey") {
        if (!oldKey) {
          await _userModel.findOneAndUpdate(
            { _id: userId },
            { $unset: { profileImage: "" } }
          );
        } else {
          await _userModel.findOneAndUpdate(
            { _id: userId },
            {
              $set: { profileImage: oldKey },
              $unset: { tempProfileIamge: "" }
            }
          );
        }
      }
    }
  }, expireIn * 1000);
});
