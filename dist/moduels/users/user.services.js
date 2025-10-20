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
const user_model_1 = __importStar(require("../../DataBase/models/user.model"));
const classError_1 = require("../../utils/classError");
const user_repositories_1 = require("../../repositories/user.repositories");
const hash_1 = require("../../utils/hash");
const sendEmail_1 = require("../../services/sendEmail");
const event_1 = require("../../utils/event");
const user_validation_1 = require("./user.validation");
const bcrypt_1 = require("bcrypt");
const token_1 = require("../../utils/token");
const authentication_1 = require("../../middleware/authentication");
const uuid_1 = require("uuid");
const revokeToken_model_1 = __importDefault(require("../../DataBase/models/revokeToken.model"));
const revokeToken_repositories_1 = require("../../repositories/revokeToken.repositories");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const s3_config_1 = require("../../utils/s3.config");
const post_repositories_1 = require("../../repositories/post.repositories");
const post_model_1 = __importDefault(require("../../DataBase/models/post.model"));
const friendRequest_repositories_1 = require("../../repositories/friendRequest.repositories");
const friendRequest_models_1 = __importDefault(require("../../DataBase/models/friendRequest.models"));
const comment_model_1 = __importDefault(require("../../DataBase/models/comment.model"));
const conversation_repositories_1 = require("../../repositories/conversation.repositories");
const conversations_models_1 = require("../../DataBase/models/conversations.models");
const friendShip_model_1 = require("../../DataBase/models/friendShip.model");
const friendShip_repositories_1 = require("../../repositories/friendShip.repositories");
const graphql_1 = require("graphql");
class UserServices {
    _userModel = new user_repositories_1.UserRepository(user_model_1.default);
    _revoketoken = new revokeToken_repositories_1.RevokeTokenRepository(revokeToken_model_1.default);
    _postModel = new post_repositories_1.PostRepository(post_model_1.default);
    _friendRequestModel = new friendRequest_repositories_1.FriendRequestRepository(friendRequest_models_1.default);
    _conversationModel = new conversation_repositories_1.ConversationRepository(conversations_models_1.conversationModel);
    _FriendShipModel = new friendShip_repositories_1.FriendShipRepository(friendShip_model_1.FriendShipModel);
    constructor() {
        this._userModel.create;
    }
    signUp = async (req, res, next) => {
        let { FullName, userName, email, password, cPassword, phone, age, address, gender, } = req.body;
        if (await this._userModel.findOne({ email })) {
            throw new classError_1.AppError("email already exist", 409);
        }
        const [fName = "", lName = ""] = FullName.split(" ");
        const hash = await (0, hash_1.Hash)(password);
        const otp = await (0, sendEmail_1.generateOTP)();
        const hashedOtp = await (0, hash_1.Hash)(String(otp));
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
            gender: gender,
        });
        event_1.eventEmitter.emit("confrimEmail", { email, otp });
        return res.status(201).json({ message: "Success", user });
    };
    confirmEmail = async (req, res, next) => {
        const { email, otp } = req.body;
        const user = await this._userModel.findOne({
            email,
            confirmed: { $exists: false },
        });
        if (!user) {
            throw new classError_1.AppError("email not exist or confirmed", 404);
        }
        if (!(await (0, bcrypt_1.compare)(otp, user?.otp))) {
            throw new classError_1.AppError("invalid otp", 400);
        }
        await this._userModel.updateOne({ email: user?.email }, { confirmed: true, $unset: { otp: "" } });
        return res.status(201).json({ message: "Confirmed...." });
    };
    signIn = async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const user = await this._userModel.findOne({
                email: email.toLowerCase(),
                confirmed: true,
            });
            if (!user) {
                throw new classError_1.AppError("Email not found or not confirmed", 404);
            }
            const isMatch = await (0, bcrypt_1.compare)(password, user.password);
            if (!isMatch) {
                throw new classError_1.AppError("Invalid password", 400);
            }
            const jwtid = (0, uuid_1.v4)();
            const accessSignature = user.role === user_model_1.RoleType.user
                ? process.env.ACCESS_TOKEN_USER
                : process.env.ACCESS_TOKEN_ADMIN;
            const refreshSignature = user.role === user_model_1.RoleType.user
                ? process.env.REFRESH_TOKEN_USER
                : process.env.REFRESH_TOKEN_ADMIN;
            if (!accessSignature || !refreshSignature) {
                throw new classError_1.AppError("Token signatures not configured properly", 500);
            }
            const token = (0, token_1.GenerateToken)({
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
            const refreshToken = (0, token_1.GenerateToken)({
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
        }
        catch (error) {
            next(error);
        }
    };
    loginWithGmail = async (req, res, next) => {
        const { idToken } = req.body;
        const client = new google_auth_library_1.OAuth2Client();
        async function verify() {
            const ticket = await client.verifyIdToken({
                idToken,
                audience: process.env.WEB_CLIENT_ID,
            });
            return ticket.getPayload();
        }
        const { email_verified, email, name, picture } = (await verify());
        let user = await this._userModel.findOne({ email });
        if (!email) {
            throw new classError_1.AppError("Email not provided by Google");
        }
        if (!user) {
            user = await this._userModel.create({
                userName: name,
                email,
                confirmed: email_verified,
                image: picture,
                provider: user_model_1.ProviderType.google,
            });
        }
        if (user?.provider === user_model_1.ProviderType.system) {
            throw new classError_1.AppError("Please login with email & password.");
        }
        const jwtid = (0, uuid_1.v4)();
        const token = await (0, token_1.GenerateToken)({
            payload: { id: user._id, email: user.email, role: user.role },
            SIGNATURE: user?.role == user_model_1.RoleType.user
                ? process.env.ACCESS_TOKEN_USER
                : process.env.ACCESS_TOKEN_ADMIN,
            options: { expiresIn: "10h", jwtid },
        });
        const refreshToken = await (0, token_1.GenerateToken)({
            payload: { id: user._id, email: user.email, role: user.role },
            SIGNATURE: user?.role == user_model_1.RoleType.user
                ? process.env.REFRESH_TOKEN_USER
                : process.env.REFRESH_TOKEN_ADMIN,
            options: { expiresIn: "7d", jwtid },
        });
        return res.status(201).json({ message: "Success", token, refreshToken });
    };
    getProfile = async (req, res, next) => {
        if (!req.user) {
            throw new classError_1.AppError("User not found in request", 404);
        }
        const user = await this._userModel.findOneWithPopulate({ _id: req.user._id }, { path: "friends" });
        console.log("req.user:", req.user);
        console.log("user from DB:", user);
        if (!user) {
            throw new classError_1.AppError("User not found", 404);
        }
        return res.status(200).json({
            message: "Success",
            data: {
                user,
            },
        });
    };
    forgetPassword = async (req, res, next) => {
        const { email } = req.body;
        const user = await this._userModel.findOne({
            email,
            confirmed: true,
        });
        if (!user) {
            throw new classError_1.AppError("email not exist or not confirmed", 404);
        }
        const otp = await (0, sendEmail_1.generateOTP)();
        const hashedOtp = await (0, hash_1.Hash)(String(otp));
        event_1.eventEmitter.emit("ForgetPassword", { email, otp });
        await this._userModel.updateOne({ email: user.email }, { otp: hashedOtp });
        return res.status(200).json({
            message: "success Otp Sent",
        });
    };
    resetPassword = async (req, res, next) => {
        const { email, otp, password, cPassword } = req.body;
        const user = await this._userModel.findOne({
            email,
            otp: { $exists: true }
        });
        if (!user) {
            throw new classError_1.AppError("email not exist or not confirmed", 404);
        }
        if (!await (0, hash_1.Compare)(otp, user?.otp)) {
            throw new classError_1.AppError("InviladOtp", 404);
        }
        const hashPassword = await (0, hash_1.Hash)(password);
        await this._userModel.updateOne({ email: user.email }, { password: hashPassword, $unset: { otp: "" } });
        return res.status(200).json({
            message: "Success ",
        });
    };
    logOut = async (req, res, next) => {
        const { flag } = req.body;
        if (flag === user_validation_1.FlagType.all) {
            await this._userModel.updateOne({ _id: req.user?._id }, { changeCredentials: new Date() });
            return res
                .status(200)
                .json({ message: "Success, logged out from all devices" });
        }
        if (!req.decoded?.jti || !req.decoded?.exp) {
            return next(new classError_1.AppError("Invalid token payload", 400));
        }
        await this._revoketoken.create({
            tokenId: req.decoded.jti,
            userId: req.user?._id,
            expireAt: new Date(req.decoded.exp * 1000),
        });
        return res.status(200).json({ message: "Success" });
    };
    refreshToken = async (req, res, next) => {
        const { authorization } = req.headers;
        if (!authorization)
            throw new classError_1.AppError("No token provided", 401);
        const [prefix, token] = authorization.split(" ");
        if (prefix !== "Bearer" || !token) {
            throw new classError_1.AppError("Invalid token format", 401);
        }
        const decodedUnsafe = jsonwebtoken_1.default.decode(token);
        if (!decodedUnsafe?.role || !decodedUnsafe?.id) {
            throw new classError_1.AppError("Invalid refresh token payload", 400);
        }
        const decoded = await (0, token_1.VerifyToken)({
            token,
            signature: decodedUnsafe.role === user_model_1.RoleType.user
                ? process.env.REFRESH_TOKEN_USER
                : process.env.REFRESH_TOKEN_ADMIN,
        });
        if (!decoded?.jti || !decoded?.id) {
            throw new classError_1.AppError("Invalid refresh token payload", 400);
        }
        const jwtid = (0, uuid_1.v4)();
        const newAccessToken = await (0, token_1.GenerateToken)({
            payload: { id: decoded.id, email: decoded.email, role: decoded.role },
            SIGNATURE: decoded.role === user_model_1.RoleType.user
                ? process.env.ACCESS_TOKEN_USER
                : process.env.ACCESS_TOKEN_ADMIN,
            options: { expiresIn: "10h", jwtid },
        });
        const newRefreshToken = await (0, token_1.GenerateToken)({
            payload: { id: decoded.id, email: decoded.email, role: decoded.role },
            SIGNATURE: decoded.role === user_model_1.RoleType.user
                ? process.env.REFRESH_TOKEN_USER
                : process.env.REFRESH_TOKEN_ADMIN,
            options: { expiresIn: "7d", jwtid },
        });
        await this._revoketoken.create({
            tokenId: decoded.jti,
            userId: decoded.id,
            expireAt: new Date(decoded?.exp * 1000),
        });
        return res.status(200).json({
            message: "Success",
            token: newAccessToken,
            refreshToken: newRefreshToken,
        });
    };
    uploadImage = async (req, res, next) => {
        try {
            const { ContentType, originalname } = req.body;
            const Key = `${process.env.APP_NAME}/users/${req.user?._id}/coverImage`;
            const url = await (0, s3_config_1.createUploadFilePressignedUrl)({
                path: `users/${req.user?._id}/coverImage`,
                originalname,
                ContentType,
                expiresIn: 60 * 60
            });
            const user = await this._userModel.findOneAndUpdate({ _id: req.user?._id }, {
                profileImage: Key,
                tempProfileIamge: req.user?.profileImage
            }, { new: true });
            if (!user) {
                throw new classError_1.AppError("User not found", 404);
            }
            event_1.eventEmitter.emit("uploadProfileImage", {
                userId: req.user?._id,
                oldKey: req.user?.profileImage,
                Key,
                expireIn: 60 * 60
            });
            return res.status(200).json({ message: "Success", url, user });
        }
        catch (error) {
            next(error);
        }
    };
    freezAccount = async (req, res, next) => {
        const params = user_validation_1.frezzSchema.params.parse(req.params);
        const { userId } = params;
        if (userId && req.user?.role !== user_model_1.RoleType.admin) {
            throw new classError_1.AppError("unauthorized", 401);
        }
        const user = await this._userModel.findOneAndUpdate({ _id: userId || req.user?._id }, {
            deletedAt: new Date(),
            deletedBy: req.user?._id,
            changeCredentials: new Date()
        }, { new: true });
        if (!user) {
            throw new classError_1.AppError("user not Found", 404);
        }
        return res.status(200).json({ message: "Success" });
    };
    unfreezAccount = async (req, res, next) => {
        try {
            const { userId } = req.params;
            if (!req.user?._id || req.user.role !== user_model_1.RoleType.admin) {
                throw new classError_1.AppError("Unauthorized", 401);
            }
            const user = await this._userModel.findOneAndUpdate({ _id: userId, deletedAt: { $exists: true, $ne: null } }, {
                $unset: { deletedAt: "", deletedBy: "" },
                $set: {
                    restoredAt: new Date(),
                    restoredBy: req.user._id
                }
            }, { new: true });
            if (!user) {
                throw new classError_1.AppError("User not found or already active", 404);
            }
            return res.status(200).json({ message: "Success", user });
        }
        catch (error) {
            next(error);
        }
    };
    dashBoard = async (req, res, next) => {
        const results = await Promise.allSettled([
            this._userModel.find({ filter: {} }),
            this._postModel.find({ filter: {} })
        ]);
        return res.status(200).json({
            message: "Success",
            data: { results },
        });
    };
    changeRole = async (req, res, next) => {
        const { userId } = req.params;
        const { role: newRole } = req.body;
        const denyRols = [newRole, user_model_1.RoleType.superAdmin];
        if (req.user?.role == user_model_1.RoleType.admin) {
            denyRols.push(user_model_1.RoleType.admin);
            if (newRole == user_model_1.RoleType.superAdmin) {
                throw new classError_1.AppError("unAuthorized", 401);
            }
        }
        const user = await this._userModel.findOneAndUpdate({
            _id: userId,
            role: { $nin: denyRols }
        }, {
            role: newRole
        }, {
            new: true
        });
        if (!user) {
            throw new classError_1.AppError("user not fond", 404);
        }
        return res.status(201).json({ message: "success" });
    };
    deleteUser = async (req, res, next) => {
        const { userId } = req.params;
        if (!userId) {
            throw new classError_1.AppError("userId is required", 400);
        }
        const user = await this._userModel.findOne({ _id: userId });
        if (!user) {
            throw new classError_1.AppError("User not found", 404);
        }
        await Promise.all([
            comment_model_1.default.deleteMany({ userId }),
            post_model_1.default.deleteMany({ author: userId }),
            friendRequest_models_1.default.deleteMany({
                $or: [{ sender: userId }, { receiver: userId }]
            }),
        ]);
        return res.status(200).json({
            message: "User deleted forEver",
            deletedUserId: userId,
        });
    };
    sendfriendRequest = async (req, res, next) => {
        const { userId } = req.params;
        const user = await this._userModel.findOne({ _id: userId });
        if (!user) {
            throw new classError_1.AppError("user not fond", 404);
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
            throw new classError_1.AppError("Cannot send friend request — blocked or blocking exists", 400);
        }
        const checkRequest = await this._friendRequestModel.findOne({
            createdBy: { $in: [req.user?._id, userId] },
            sendTo: { $in: [req.user?._id, userId] },
        });
        if (checkRequest) {
            throw new classError_1.AppError("request already sent ", 400);
        }
        const request = await this._friendRequestModel.create({
            createdBy: req.user?._id,
            sendTo: userId
        });
        return res.status(201).json({ message: "Success", request });
    };
    acceptfriendRequest = async (req, res, next) => {
        const { requestId } = req.params;
        const checkRequest = await this._friendRequestModel.findOneAndUpdate({
            _id: requestId,
            sendTo: req?.user?._id,
            acceptedAt: { $exists: false }
        }, {
            acceptedAt: new Date()
        });
        if (!checkRequest) {
            throw new classError_1.AppError("request not found  ", 404);
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
            throw new classError_1.AppError("Cannot accept friend request — block exists between users", 400);
        }
        await Promise.all([
            this._userModel.updateOne({ _id: checkRequest.createdBy }, { $push: { friends: checkRequest.sendTo } }),
            this._userModel.updateOne({ _id: checkRequest.sendTo }, { $push: { friends: checkRequest.createdBy } })
        ]);
        return res.status(201).json({ message: "Accepted", });
    };
    blockUser = async (req, res, next) => {
        const { userId } = req.params;
        if (!userId) {
            throw new classError_1.AppError("userId required", 400);
        }
        if (String(req.user?._id) === String(userId)) {
            throw new classError_1.AppError("You cannot block yourself", 400);
        }
        const targetUser = await this._userModel.findOne({ _id: userId });
        if (!targetUser) {
            throw new classError_1.AppError("user not found", 404);
        }
        await Promise.all([
            this._userModel.updateOne({ _id: req.user?._id }, { $pull: { friends: userId } }),
            this._userModel.updateOne({ _id: userId }, { $pull: { friends: req.user?._id } }),
        ]);
        await friendRequest_models_1.default.deleteMany({
            $or: [
                { createdBy: req.user?._id, sendTo: userId },
                { createdBy: userId, sendTo: req.user?._id },
            ],
        });
        await this._userModel.updateOne({ _id: req.user?._id }, { $addToSet: { blockedUsers: userId } });
        return res.status(200).json({ message: "User blocked successfully" });
    };
    unblockUser = async (req, res, next) => {
        try {
            const { userId } = req.params;
            if (!userId) {
                throw new classError_1.AppError("userId required", 400);
            }
            const targetUser = await this._userModel.findOne({ _id: userId });
            if (!targetUser) {
                throw new classError_1.AppError("user not found", 404);
            }
            await this._userModel.updateOne({ _id: req.user?._id }, { $pull: { blockedUsers: userId } });
            return res.status(200).json({ message: "User unblocked successfully" });
        }
        catch (error) {
            next(error);
        }
    };
    deleteFriendRequest = async (req, res, next) => {
        const { requestId } = req.params;
        const friendRequest = await this._friendRequestModel.findOne({ _id: requestId });
        if (!friendRequest) {
            throw new classError_1.AppError("Friend request not found", 404);
        }
        if (String(friendRequest.createdBy) !== String(req.user?._id)) {
            throw new classError_1.AppError("You are not authorized to delete this request", 403);
        }
        await this._friendRequestModel.deleteOne({ _id: requestId });
        return res.status(200).json({ message: "Friend request deleted successfully" });
    };
    unFriend = async (req, res, next) => {
        const { userId } = req.params;
        if (!userId) {
            throw new classError_1.AppError("userId is required", 400);
        }
        if (String(req.user?._id) === String(userId)) {
            throw new classError_1.AppError("You cannot unfriend yourself", 400);
        }
        const targetUser = await this._userModel.findById(userId);
        if (!targetUser) {
            throw new classError_1.AppError("User not found", 404);
        }
        if (!req.user?._id) {
            throw new classError_1.AppError("User not authenticated", 401);
        }
        const currentUser = await this._userModel.findById(String(req.user._id));
        const isFriend = currentUser?.friends?.some((friendId) => String(friendId) === String(userId));
        if (!isFriend) {
            throw new classError_1.AppError("This user is not in friend list", 404);
        }
        await Promise.all([
            this._userModel.updateOne({ _id: req.user?._id }, { $pull: { friends: userId } }),
            this._userModel.updateOne({ _id: userId }, { $pull: { friends: req.user?._id } }),
        ]);
        return res.status(200).json({ message: "Friend removed success" });
    };
    getFriends = async (req, res, next) => {
        if (!req.user) {
            throw new classError_1.AppError("User not found in request", 404);
        }
        const user = await this._userModel.findOneWithPopulate({ _id: req.user._id }, { path: "friends" }, undefined);
        if (!user)
            return next(new classError_1.AppError("User not found", 404));
        return res.status(200).json({
            message: "Success",
            data: user.friends,
        });
    };
    createGroupChat = async (req, res) => {
        try {
            const _id = req.user._id;
            const { name, memberIds } = req.body;
            if (!name || !Array.isArray(memberIds) || memberIds.length === 0)
                throw new classError_1.AppError("Invalid group data", 400);
            const members = await this._userModel.findDoucuments({
                filter: { _id: { $in: memberIds } },
            });
            if (members.length !== memberIds.length)
                throw new classError_1.AppError("Some members not found", 404);
            const user = await this._userModel.findById(_id.toString());
            if (!user)
                throw new classError_1.AppError("User not found", 404);
            const friendIds = user.friends.map((f) => typeof f === "object" ? f._id.toString() : f.toString());
            const notFriends = memberIds.filter((id) => !friendIds.includes(id));
            if (notFriends.length > 0)
                throw new classError_1.AppError("Some members are not your friends", 404);
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
        }
        catch (error) {
            console.error(error);
            return res
                .status(error.statusCode || 500)
                .json({ message: error.message || "Internal Server Error" });
        }
    };
    getUserGroups = async (req, res) => {
        try {
            const userId = req.user._id;
            const groups = await this._conversationModel.find({
                filter: { type: "group", members: { $in: [userId] } },
                select: "name _id members",
            });
            return res.status(200).json({
                message: "Groups fetched successfully",
                groups,
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error fetching groups" });
        }
    };
    getOneUser = async (parent, args, context) => {
        const { user } = await (0, authentication_1.AuthenticationGraphQl)(context.req.headers.authorization);
        const userExists = await this._userModel.findById(user.id);
        if (!userExists) {
            throw new graphql_1.GraphQLError("User not found", {
                extensions: { statusCode: 404 }
            });
        }
        return userExists;
    };
    getUsers = async () => {
        return await this._userModel.find({ filter: {} });
    };
    createUserGQL = async (parent, args) => {
        const { fName, lName, email, password, gender, age, address, phone, userName } = args;
        if (!fName || !lName || !email || !password || !gender || !age || !address || !phone || !userName) {
            throw new graphql_1.GraphQLError("Missing required fields", {
                extensions: {
                    message: "All required fields must be provided",
                    statusCode: 400
                }
            });
        }
        const user = await this._userModel.findOne({ email });
        if (user) {
            throw new graphql_1.GraphQLError("user already exists", {
                extensions: {
                    message: "user already exists",
                    statusCode: 400
                }
            });
        }
        const hashPassword = await (0, hash_1.Hash)(password, 10);
        const newUser = await this._userModel.create({
            fName,
            lName,
            email,
            password: hashPassword,
            gender,
            age,
            address,
            phone,
            userName
        });
        return newUser;
    };
}
exports.default = new UserServices();
