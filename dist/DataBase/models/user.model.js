"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderType = exports.RoleType = exports.GenderType = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const comment_model_1 = __importDefault(require("./comment.model"));
const post_model_1 = __importDefault(require("./post.model"));
var GenderType;
(function (GenderType) {
    GenderType["male"] = "male";
    GenderType["female"] = "female";
})(GenderType || (exports.GenderType = GenderType = {}));
var RoleType;
(function (RoleType) {
    RoleType["user"] = "user";
    RoleType["admin"] = "admin";
    RoleType["superAdmin"] = "super-admin";
})(RoleType || (exports.RoleType = RoleType = {}));
var ProviderType;
(function (ProviderType) {
    ProviderType["system"] = "system";
    ProviderType["google"] = "google";
})(ProviderType || (exports.ProviderType = ProviderType = {}));
const userSchema = new mongoose_1.default.Schema({
    profileImage: { type: String },
    tempProfileIamge: { type: String },
    fName: { type: String, minLength: 2, maxLength: 10, trim: true },
    lName: { type: String, minLength: 2, maxLength: 10, trim: true },
    userName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: {
        type: String,
        required: function () {
            return this.provider === ProviderType.google ? false : true;
        },
    },
    age: {
        type: Number,
        min: 20,
        max: 70,
        required: function () {
            return this.provider === ProviderType.google ? false : true;
        },
    },
    phone: {
        type: String,
        required: function () {
            return this.provider === ProviderType.google ? false : true;
        },
    },
    otp: { type: String },
    confirmed: { type: Boolean },
    changeCredentials: { type: Date },
    address: {
        type: String,
        required: function () {
            return this.provider === ProviderType.google ? false : true;
        },
    },
    gender: {
        type: String,
        enum: Object.values(GenderType),
        required: function () {
            return this.provider === ProviderType.google ? false : true;
        },
    },
    provider: {
        type: String,
        enum: Object.values(ProviderType),
        default: ProviderType.system,
    },
    image: {
        type: String,
    },
    role: {
        type: String,
        enum: Object.values(RoleType),
        default: RoleType.user,
    },
    friends: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" }],
    blockedUsers: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" }],
    deletedAt: { type: Date },
    deletedBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
    restoredAt: { type: Date },
    restoredBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
});
userSchema
    .virtual("FullName")
    .set(function (value) {
    const [fName, lName] = value.split(" ");
    this.set({ fName, lName });
})
    .get(function () {
    return this.fName + " " + this.lName;
});
userSchema.pre("deleteOne", { document: false, query: true }, async function (next) {
    const filter = this.getFilter();
    const userId = filter._id;
    await Promise.all([
        comment_model_1.default.deleteMany({ userId }),
        post_model_1.default.deleteMany({ author: userId }),
    ]);
    next();
});
const userModel = mongoose_1.default.models.User || mongoose_1.default.model("User", userSchema);
exports.default = userModel;
