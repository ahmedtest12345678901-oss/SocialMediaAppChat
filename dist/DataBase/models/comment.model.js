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
Object.defineProperty(exports, "__esModule", { value: true });
exports.commentSchema = exports.OnModelEnum = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var OnModelEnum;
(function (OnModelEnum) {
    OnModelEnum["Post"] = "Post";
    OnModelEnum["Comment"] = "Comment";
})(OnModelEnum || (exports.OnModelEnum = OnModelEnum = {}));
exports.commentSchema = new mongoose_1.Schema({
    content: {
        type: String, minLength: 5, maxLength: 1000, required: function () {
            return this?.attachments?.length === 0;
        }
    },
    attachments: [String],
    assetFolderId: String,
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    likes: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    deletedAt: { type: Date },
    deletedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    restoredAt: { type: Date },
    restoedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    refId: { type: mongoose_1.Schema.Types.ObjectId, refPath: "OnModel", required: true },
    OnModel: { type: String, enum: OnModelEnum, required: true },
    isFrozen: { type: Boolean, default: false }
}, {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
exports.commentSchema.pre(["find", "findOne", "findOneAndDelete", "findOneAndUpdate"], function (next) {
    const query = this.getQuery();
    const { paranoid, ...rest } = query;
    if (paranoid === false) {
        this.setQuery({ ...rest, deletedAt: { $exists: true } });
    }
    else {
        this.setQuery({ ...rest, deletedAt: { $exists: false } });
    }
    next();
});
exports.commentSchema.virtual("replies", {
    ref: "Comment",
    localField: "_id",
    foreignField: "refId",
    match: { OnModel: "Comment" }
});
exports.commentSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
    const commentId = this._id;
    await mongoose_1.default.model("Comment").deleteMany({ commentId });
    next();
});
const commentModel = mongoose_1.default.models.Comment || mongoose_1.default.model("Comment", exports.commentSchema);
exports.default = commentModel;
