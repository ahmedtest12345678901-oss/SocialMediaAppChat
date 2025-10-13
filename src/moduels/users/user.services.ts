import { NextFunction, Request, Response } from "express";
import userModel, { GenderType, ProviderType, RoleType, } from "../../DataBase/models/user.model";
import { AppError } from "../../utils/classError";
import { UserRepository } from "../../repositories/user.repositories";
import { Compare, Hash } from "../../utils/hash";
import { generateOTP } from "../../services/sendEmail";
import { eventEmitter } from "../../utils/event";
import { confirmEmailSchemaType, FlagType, frezzSchema, frezzSchemaType, loginWithGmailSchema, logOutSchema, signUpSchemaType, } from "./user.validation";
import { compare } from "bcrypt";
import { GenerateToken, VerifyToken } from "../../utils/token";
import { RequestWithUser } from "../../middleware/authentication";
import { v4 as uuidv4 } from "uuid";
import revokeTokenModel from "../../DataBase/models/revokeToken.model";
import { RevokeTokenRepository } from "../../repositories/revokeToken.repositories";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { createUploadFilePressignedUrl, StorageEnum, uploadFile, uploadFiles, uploadLargeFile } from "../../utils/s3.config";
import { PostRepository } from "../../repositories/post.repositories";
import postModel from "../../DataBase/models/post.model";
import { FriendRequestRepository } from "../../repositories/friendRequest.repositories";
import FriendRequestModel, { IFriendRequest } from "../../DataBase/models/friendRequest.models";
import commentModel from "../../DataBase/models/comment.model";
import { populate } from "dotenv";
import { ConversationRepository } from "../../repositories/conversation.repositories";
import { conversationModel } from "../../DataBase/models/conversations.models";
import { FriendShipEnum, FriendShipModel } from "../../DataBase/models/friendShip.model";
import { FriendShipRepository } from "../../repositories/friendShip.repositories";

interface signUpuser {
  FullName: string;
  userName: string;
  email: string;
  password: string;
  cPassword: string;
  phone: string;
  age: number;
  address: string;
  gender: string;
}

class UserServices {
  private _userModel = new UserRepository(userModel);
  private _revoketoken = new RevokeTokenRepository(revokeTokenModel);
  private _postModel = new PostRepository(postModel);
  private _friendRequestModel = new FriendRequestRepository(FriendRequestModel);
  private _conversationModel = new ConversationRepository(conversationModel);
  private _FriendShipModel = new FriendShipRepository(FriendShipModel);

  constructor() {
    this._userModel.create;
  }
  //>>>>>>>>>>>>>>>>>>>>>>signUp>>>>>>>>>>>>>>>>>>>>>>
  signUp = async (req: Request, res: Response, next: NextFunction) => {
    let {
      FullName,
      userName,
      email,
      password,
      cPassword,
      phone,
      age,
      address,
      gender,
    }: signUpuser = req.body;

    if (await this._userModel.findOne({ email })) {
      throw new AppError("email already exist", 409);
    }

    const [fName = "", lName = ""] = FullName.split(" ");

    const hash = await Hash(password);
    const otp = await generateOTP();
    const hashedOtp = await Hash(String(otp));

    const user = await this._userModel.createOneUser({
      fName,
      lName,
      userName,
      email,
      password: hash,
      phone,
      otp: hashedOtp,
      age,
      address,
      gender: gender as GenderType,
    });

    eventEmitter.emit("confrimEmail", { email, otp });
    return res.status(201).json({ message: "Success", user });
  };

  //---------------------confirmEmail--------------
  confirmEmail = async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp }: confirmEmailSchemaType = req.body;
    const user = await this._userModel.findOne({
      email,
      confirmed: { $exists: false },
    });
    if (!user) {
      throw new AppError("email not exist or confirmed", 404);
    }
    if (!(await compare(otp, user?.otp!))) {
      throw new AppError("invalid otp", 400);
    }
    await this._userModel.updateOne(
      { email: user?.email },
      { confirmed: true, $unset: { otp: "" } }
    );
    return res.status(201).json({ message: "Confirmed...." });
  };

  // =============signIn========


  signIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password }: signUpSchemaType = req.body;

      const user = await this._userModel.findOne({
        email: email.toLowerCase(),
        confirmed: true,
      });

      if (!user) {
        throw new AppError("Email not found or not confirmed", 404);
      }

      const isMatch = await compare(password, user.password);
      if (!isMatch) {
        throw new AppError("Invalid password", 400);
      }

      const jwtid = uuidv4();

      const accessSignature =
        user.role === RoleType.user
          ? process.env.ACCESS_TOKEN_USER
          : process.env.ACCESS_TOKEN_ADMIN;

      const refreshSignature =
        user.role === RoleType.user
          ? process.env.REFRESH_TOKEN_USER
          : process.env.REFRESH_TOKEN_ADMIN;

      if (!accessSignature || !refreshSignature) {
        throw new AppError("Token signatures not configured properly", 500);
      }

      const token = GenerateToken({
        payload: {
          _id: user._id,          
          fName: user.fName,     
          lName: user.lName,      
          userName: user.userName,
          email: user.email,
          role: user.role
        },
        SIGNATURE: accessSignature,
        options: { expiresIn: "10h", jwtid },
      });

      const refreshToken = GenerateToken({
        payload: {
          _id: user._id,
          fName: user.fName,
          lName: user.lName,
          userName: user.userName,
          email: user.email,
          role: user.role
        },
        SIGNATURE: refreshSignature,
        options: { expiresIn: "7d", jwtid },
      });


      return res.status(200).json({
        message: "Done",
        data: { credentials: { access_token: token, refresh_token: refreshToken } },
      });
    } catch (error) {
      next(error);
    }
  };


  loginWithGmail = async (req: Request, res: Response, next: NextFunction) => {
    const { idToken }: loginWithGmailSchema = req.body;

    const client = new OAuth2Client();
    async function verify() {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.WEB_CLIENT_ID!,
      });
      return ticket.getPayload();
    }

    const { email_verified, email, name, picture } =
      (await verify()) as TokenPayload;

    let user = await this._userModel.findOne({ email });
    if (!email) {
      throw new AppError("Email not provided by Google");
    }

    if (!user) {
      user = await this._userModel.create({
        userName: name!,
        email,
        confirmed: email_verified!,
        image: picture!,
        provider: ProviderType.google,
      });
    }

    if (user?.provider === ProviderType.system) {
      throw new AppError("Please login with email & password.");
    }
    const jwtid = uuidv4();
    const token = await GenerateToken({
      payload: { id: user._id, email: user.email, role: user.role },
      SIGNATURE:
        user?.role == RoleType.user
          ? process.env.ACCESS_TOKEN_USER!
          : process.env.ACCESS_TOKEN_ADMIN!,
      options: { expiresIn: "10h", jwtid },
    });

    const refreshToken = await GenerateToken({
      payload: { id: user._id, email: user.email, role: user.role },
      SIGNATURE:
        user?.role == RoleType.user
          ? process.env.REFRESH_TOKEN_USER!
          : process.env.REFRESH_TOKEN_ADMIN!,
      options: { expiresIn: "7d", jwtid },
    });

    return res.status(201).json({ message: "Success", token, refreshToken });
  };

  //>>>>>>>>>>>>>>>>>>>>>>getProfile>>>>>>>>>>>>>>>>>>>>>>
  getProfile = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      throw new AppError("User not found in request", 404);
    }

    const user = await this._userModel.findOneWithPopulate(
      { _id: req.user._id },
      { path: "friends" }
    );

    console.log("req.user:", req.user);
    console.log("user from DB:", user);


    if (!user) {
      throw new AppError("User not found", 404);
    }
    return res.status(200).json({
      message: "Success",
      data: {
        user,
      },
    });

  }



  //>>>>>>>>>>>>>>><<<<<<<<<<<<<<>>>>>>>forgetPassword>><<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>

  forgetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { email } = req.body;

    const user = await this._userModel.findOne({
      email,
      confirmed: true,
    });

    if (!user) {
      throw new AppError("email not exist or not confirmed", 404);
    }

    const otp = await generateOTP();
    const hashedOtp = await Hash(String(otp));

    eventEmitter.emit("ForgetPassword", { email, otp });

    await this._userModel.updateOne({ email: user.email }, { otp: hashedOtp });

    return res.status(200).json({
      message: "success Otp Sent",
    });
  };

  resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { email, otp, password, cPassword } = req.body;

    const user = await this._userModel.findOne({
      email,
      otp: { $exists: true }
    });

    if (!user) {
      throw new AppError("email not exist or not confirmed", 404);
    }
    if (!await Compare(otp, user?.otp!)) {
      throw new AppError("InviladOtp", 404);

    }
    const hashPassword = await Hash(password)
    await this._userModel.updateOne({ email: user.email }, { password: hashPassword, $unset: { otp: "" } });

    return res.status(200).json({
      message: "Success ",
    });
  };

  //>>>>>>>>>>>>>>>>>>>>>>logOut>>>>>>>>>>>>>>>>>>>>>>

  logOut = async (req: Request, res: Response, next: NextFunction) => {
    const { flag }: logOutSchema = req.body;

    if (flag === FlagType.all) {
      await this._userModel.updateOne(
        { _id: req.user?._id },
        { changeCredentials: new Date() }
      );
      return res
        .status(200)
        .json({ message: "Success, logged out from all devices" });
    }

    if (!req.decoded?.jti || !req.decoded?.exp) {
      return next(new AppError("Invalid token payload", 400));
    }

    await this._revoketoken.create({
      tokenId: req.decoded.jti,
      userId: req.user?._id as Types.ObjectId,
      expireAt: new Date(req.decoded.exp * 1000),
    });

    return res.status(200).json({ message: "Success" });
  };
  //>>>>>>>>>>>>>>>>>>>>>>refreshToken>>>>>>>>>>>>>>>>>>>>>>

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    const { authorization } = req.headers;
    if (!authorization) throw new AppError("No token provided", 401);

    const [prefix, token] = authorization.split(" ");
    if (prefix !== "Bearer" || !token) {
      throw new AppError("Invalid token format", 401);
    }

    const decodedUnsafe: any = jwt.decode(token);
    if (!decodedUnsafe?.role || !decodedUnsafe?.id) {
      throw new AppError("Invalid refresh token payload", 400);
    }

    const decoded: any = await VerifyToken({
      token,
      signature:
        decodedUnsafe.role === RoleType.user
          ? process.env.REFRESH_TOKEN_USER!
          : process.env.REFRESH_TOKEN_ADMIN!,
    });

    if (!decoded?.jti || !decoded?.id) {
      throw new AppError("Invalid refresh token payload", 400);
    }

    const jwtid = uuidv4();

    const newAccessToken = await GenerateToken({
      payload: { id: decoded.id, email: decoded.email, role: decoded.role },
      SIGNATURE:
        decoded.role === RoleType.user
          ? process.env.ACCESS_TOKEN_USER!
          : process.env.ACCESS_TOKEN_ADMIN!,
      options: { expiresIn: "10h", jwtid },
    });

    const newRefreshToken = await GenerateToken({
      payload: { id: decoded.id, email: decoded.email, role: decoded.role },
      SIGNATURE:
        decoded.role === RoleType.user
          ? process.env.REFRESH_TOKEN_USER!
          : process.env.REFRESH_TOKEN_ADMIN!,
      options: { expiresIn: "7d", jwtid },
    });

    await this._revoketoken.create({
      tokenId: decoded.jti,
      userId: decoded.id as Types.ObjectId,
      expireAt: new Date(decoded?.exp! * 1000),
    });

    return res.status(200).json({
      message: "Success",
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  };





  //////////////////////////////////////////////////


  //  uploadImage = async (req: Request, res: Response, next: NextFunction) => {
  //   const files = req.files as Express.Multer.File[];

  //   if (!files || files.length === 0) {
  //     throw new AppError("No files uploaded", 404);
  //   }

  //   const keys = await uploadFiles({
  //     files,
  //     path: `users/${req.user?._id}`,
  //     storageType: StorageEnum.disk,
  //   });

  //   return res.status(200).json({
  //     message: "Upload successful",
  //     key: keys,
  //   });
  // };

  //>>>>>>>>>>>>>>>>>>>>>>uploadImage>>>>>>>>>>>>>>>>>>>>>>



  uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ContentType, originalname } = req.body;

      const Key = `${process.env.APP_NAME}/users/${req.user?._id}/coverImage`;

      const url = await createUploadFilePressignedUrl({
        path: `users/${req.user?._id}/coverImage`,
        originalname,
        ContentType,
        expiresIn: 60 * 60
      });

      const user = await this._userModel.findOneAndUpdate(
        { _id: req.user?._id },
        {
          profileImage: Key,
          tempProfileIamge: req.user?.profileImage
        },
        { new: true }
      );

      if (!user) {
        throw new AppError("User not found", 404);
      }

      eventEmitter.emit("uploadProfileImage", {
        userId: req.user?._id,
        oldKey: req.user?.profileImage,
        Key,
        expireIn: 60 * 60
      });

      return res.status(200).json({ message: "Success", url, user });
    } catch (error) {
      next(error);
    }
  }

  //>>>>>>>>>>>>>>>>>>>>>>freezAccount>>>>>>>>>>>>>>>>>>>>>>


  freezAccount = async (req: Request, res: Response, next: NextFunction) => {
    const params = frezzSchema.params.parse(req.params);
    const { userId } = params;

    if (userId && req.user?.role !== RoleType.admin) {
      throw new AppError("unauthorized", 401);
    }

    const user = await this._userModel.findOneAndUpdate(
      { _id: userId || req.user?._id },
      {
        deletedAt: new Date(),
        deletedBy: req.user?._id,
        changeCredentials: new Date()
      },
      { new: true }
    );

    if (!user) {
      throw new AppError("user not Found", 404);
    }

    return res.status(200).json({ message: "Success" });
  };


  //>>>>>>>>>>>>>>>>>>>>>>unfreezAccount>>>>>>>>>>>>>>>>>>>>>>


  unfreezAccount = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      if (!req.user?._id || req.user.role !== RoleType.admin) {
        throw new AppError("Unauthorized", 401);
      }

      const user = await this._userModel.findOneAndUpdate(
        { _id: userId, deletedAt: { $exists: true, $ne: null } },
        {
          $unset: { deletedAt: "", deletedBy: "" },
          $set: {
            restoredAt: new Date(),
            restoredBy: req.user._id
          }
        },
        { new: true }
      );

      if (!user) {
        throw new AppError("User not found or already active", 404);
      }

      return res.status(200).json({ message: "Success", user });
    } catch (error) {
      next(error);
    }
  };


  //>>>>>>>>>>>>>>>>>>>>>>dashBoard>>>>>>>>>>>>>>>>>>>>>>


  dashBoard = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const results = await Promise.allSettled([
      this._userModel.find({ filter: {} }),
      this._postModel.find({ filter: {} })
    ])
    return res.status(200).json({
      message: "Success",
      data: { results },
    });
  };

  //>>>>>>>>>>>>>>>>>>>>>>changeRole>>>>>>>>>>>>>>>>>>>>>>

  changeRole = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const { userId } = req.params
    const { role: newRole } = req.body

    const denyRols: RoleType[] = [newRole, RoleType.superAdmin]

    if (req.user?.role == RoleType.admin) {
      denyRols.push(RoleType.admin)
      if (newRole == RoleType.superAdmin) {
        throw new AppError("unAuthorized", 401)
      }
    }

    const user = await this._userModel.findOneAndUpdate(
      {
        _id: userId,
        role: { $nin: denyRols }

      },

      {
        role: newRole
      },
      {
        new: true
      })
    if (!user) {
      throw new AppError("user not fond", 404)

    }
    return res.status(201).json({ message: "success" })
  }

  //>>>>>>>>>>>>>>>>>>>>>>deleteUser>>>>>>>>>>>>>>>>>>>>>>

  deleteUser = async (req: RequestWithUser, res: Response, next: NextFunction) => {

    const { userId } = req.params;

    if (!userId) {
      throw new AppError("userId is required", 400);
    }

    const user = await this._userModel.findOne({ _id: userId });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    await Promise.all([
      commentModel.deleteMany({ userId }),
      postModel.deleteMany({ author: userId }),
      FriendRequestModel.deleteMany({
        $or: [{ sender: userId }, { receiver: userId }]
      }),
    ]);

    return res.status(200).json({
      message: "User deleted forEver",
      deletedUserId: userId,
    });

  };

  //>>>>>>>>>>>>>>>>>>>>>>sendfriendRequest>>>>>>>>>>>>>>>>>>>>>>

  sendfriendRequest = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const user = await this._userModel.findOne({ _id: userId });
    if (!user) {
      throw new AppError("user not fond", 404);
    }

    const isBlockedByTarget = await this._userModel.findOne({
      _id: userId,
      blockedUsers: req.user?._id,
    });
    const hasBlockedTarget = await this._userModel.findOne({
      _id: req.user?._id,
      blockedUsers: userId,
    });
    if (isBlockedByTarget || hasBlockedTarget) {
      throw new AppError("Cannot send friend request — blocked or blocking exists", 400);
    }

    const checkRequest = await this._friendRequestModel.findOne({
      createdBy: { $in: [req.user?._id, userId] },
      sendTo: { $in: [req.user?._id, userId] },
    });
    if (checkRequest) {
      throw new AppError("request already sent ", 400);
    }

    const request = await this._friendRequestModel.create({
      createdBy: req.user?._id as unknown as Types.ObjectId,
      sendTo: userId as unknown as Types.ObjectId
    });

    return res.status(201).json({ message: "Success", request })
  }

  //>>>>>>>>>>>>>>>>>>>>>>acceptfriendRequest>>>>>>>>>>>>>>>>>>>>>>

  acceptfriendRequest = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    const { requestId } = req.params

    const checkRequest = await this._friendRequestModel.findOneAndUpdate({
      _id: requestId,
      sendTo: req?.user?._id,
      acceptedAt: { $exists: false }
    }, {
      acceptedAt: new Date()
    })
    if (!checkRequest) {
      throw new AppError("request not found  ", 404)
    }

    const blockedByCreator = await this._userModel.findOne({
      _id: checkRequest.createdBy,
      blockedUsers: checkRequest.sendTo
    });
    const blockedByReceiver = await this._userModel.findOne({
      _id: checkRequest.sendTo,
      blockedUsers: checkRequest.createdBy
    });
    if (blockedByCreator || blockedByReceiver) {
      await this._friendRequestModel.findOneAndUpdate({ _id: requestId }, { $unset: { acceptedAt: "" } });
      throw new AppError("Cannot accept friend request — block exists between users", 400);
    }

    await Promise.all([
      this._userModel.updateOne(
        { _id: checkRequest.createdBy },
        { $push: { friends: checkRequest.sendTo } }
      ),
      this._userModel.updateOne(
        { _id: checkRequest.sendTo },
        { $push: { friends: checkRequest.createdBy } }
      )
    ])

    return res.status(201).json({ message: "Accepted", })
  }
  //>>>>>>>>>>>>>>>>>>>>>>blockUser>>>>>>>>>>>>>>>>>>>>>>


  blockUser = async (req: RequestWithUser, res: Response, next: NextFunction) => {

    const { userId } = req.params;

    if (!userId) {
      throw new AppError("userId required", 400);
    }

    if (String(req.user?._id) === String(userId)) {
      throw new AppError("You cannot block yourself", 400);
    }

    const targetUser = await this._userModel.findOne({ _id: userId });
    if (!targetUser) {
      throw new AppError("user not found", 404);
    }

    await Promise.all([
      this._userModel.updateOne({ _id: req.user?._id }, { $pull: { friends: userId } }),
      this._userModel.updateOne({ _id: userId }, { $pull: { friends: req.user?._id } }),
    ]);

    await FriendRequestModel.deleteMany({
      $or: [
        { createdBy: req.user?._id, sendTo: userId },
        { createdBy: userId, sendTo: req.user?._id },
      ],
    });

    await this._userModel.updateOne(
      { _id: req.user?._id },
      { $addToSet: { blockedUsers: userId } }
    );

    return res.status(200).json({ message: "User blocked successfully" });

  };

  //>>>>>>>>>>>>>>>>>>>>>>unblockUser>>>>>>>>>>>>>>>>>>>>>>


  unblockUser = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        throw new AppError("userId required", 400);
      }

      const targetUser = await this._userModel.findOne({ _id: userId });
      if (!targetUser) {
        throw new AppError("user not found", 404);
      }

      await this._userModel.updateOne(
        { _id: req.user?._id },
        { $pull: { blockedUsers: userId } }
      );

      return res.status(200).json({ message: "User unblocked successfully" });
    } catch (error) {
      next(error);
    }
  };

  //>>>>>>>>>>>>>>>>>>>>>>deleteFriendRequest>>>>>>>>>>>>>>>>>>>>>>

  deleteFriendRequest = async (req: RequestWithUser, res: Response, next: NextFunction) => {

    const { requestId } = req.params;

    const friendRequest = await this._friendRequestModel.findOne({ _id: requestId });

    if (!friendRequest) {
      throw new AppError("Friend request not found", 404);
    }

    if (String(friendRequest.createdBy) !== String(req.user?._id)) {
      throw new AppError("You are not authorized to delete this request", 403);
    }

    await this._friendRequestModel.deleteOne({ _id: requestId });

    return res.status(200).json({ message: "Friend request deleted successfully" });

  };

  //>>>>>>>>>>>>>>>>>>>>>>unFriend>>>>>>>>>>>>>>>>>>>>>>


  unFriend = async (req: RequestWithUser, res: Response, next: NextFunction) => {

    const { userId } = req.params;

    if (!userId) {
      throw new AppError("userId is required", 400);
    }

    if (String(req.user?._id) === String(userId)) {
      throw new AppError("You cannot unfriend yourself", 400);
    }

    const targetUser = await this._userModel.findById(userId);
    if (!targetUser) {
      throw new AppError("User not found", 404);
    }

    if (!req.user?._id) {
      throw new AppError("User not authenticated", 401);
    }

    const currentUser = await this._userModel.findById(String(req.user._id));

    const isFriend = currentUser?.friends?.some(
      (friendId) => String(friendId) === String(userId)
    );

    if (!isFriend) {
      throw new AppError("This user is not in friend list", 404);
    }

    await Promise.all([
      this._userModel.updateOne(
        { _id: req.user?._id },
        { $pull: { friends: userId } }
      ),
      this._userModel.updateOne(
        { _id: userId },
        { $pull: { friends: req.user?._id } }
      ),
    ]);

    return res.status(200).json({ message: "Friend removed success" });

  };











  getFriends = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("User not found in request", 404);
    }

    const user = await this._userModel.findOneWithPopulate(
      { _id: req.user._id },
      { path: "friends" },
      undefined
    );
    if (!user) return next(new AppError("User not found", 404));

    return res.status(200).json({
      message: "Success",
      data: user.friends,
    });
  };





///>>>><<<<<<<<<<<<>>>>>>>>><<<<<<<<<group<>>>>>>>>><<<<<<<<<<<<>>>>>>>


  createGroupChat = async (req: Request, res: Response) => {
    try {
      const _id = req.user!._id;
      const { name, memberIds } = req.body;

      if (!name || !Array.isArray(memberIds) || memberIds.length === 0)
        throw new AppError("Invalid group data", 400);

      const members = await this._userModel.findDoucuments({
        filter: { _id: { $in: memberIds } },
      });

      if (members.length !== memberIds.length)
        throw new AppError("Some members not found", 404);

      const user = await this._userModel.findById(_id.toString());
      if (!user) throw new AppError("User not found", 404);

      const friendIds = user.friends.map((f: any) =>
        typeof f === "object" ? f._id.toString() : f.toString()
      );

      const notFriends = memberIds.filter((id: string) => !friendIds.includes(id));

      if (notFriends.length > 0)
        throw new AppError("Some members are not your friends", 404);

      const uniqueMembers = [...new Set([...memberIds, _id.toString()])];
      const group = await this._conversationModel.createNewDocument({
        type: "group",
        name,
        members: uniqueMembers,
      });

      return res.status(200).json({
        message: "Group created successfully",
        group,
      });
    } catch (error: any) {
      console.error(error);
      return res
        .status(error.statusCode || 500)
        .json({ message: error.message || "Internal Server Error" });
    }
  };



  getUserGroups = async (req: Request, res: Response) => {
    try {
      const userId = req.user!._id;

      const groups = await this._conversationModel.find({
        filter: { type: "group", members: { $in: [userId] } },
        select: "name _id members",
      });


      return res.status(200).json({
        message: "Groups fetched successfully",
        groups,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "Error fetching groups" });
    }
  };
















  

}



export default new UserServices();
