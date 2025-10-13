
import mongoose, { Schema, Types } from "mongoose";


export enum OnModelEnum {
    Post = "Post",
    Comment = "Comment",
}

export interface IComment {
    content: string;
    tags: Types.ObjectId;
    likes: string;
    attachments: string[];
    deletedAt: Date;
    deletedBy: Types.ObjectId;
    createdBy: Types.ObjectId;
    assetFolderId: string;
    restoredAt: Date;
    restoedBy: Types.ObjectId;
    refId: Types.ObjectId
    OnModel: OnModelEnum;
    postId?: Types.ObjectId;
    isFrozen: Boolean;

}

export const commentSchema = new Schema<IComment>({
    content: {
        type: String, minLength: 5, maxLength: 1000, required: function () {
            return this?.attachments?.length === 0
        }
    },

    attachments: [String],
    assetFolderId: String,
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: Schema.Types.ObjectId, ref: "User" }],
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    restoredAt: { type: Date },
    restoedBy: { type: Schema.Types.ObjectId, ref: "User" },
    refId: { type: Schema.Types.ObjectId, refPath: "OnModel", required: true },
    OnModel: { type: String, enum: OnModelEnum, required: true },
    isFrozen: { type: Boolean, default: false }
}, {

    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

commentSchema.pre(["find", "findOne", "findOneAndDelete", "findOneAndUpdate"], function (next) {
    const query = this.getQuery();
    const { paranoid, ...rest } = query;

    if (paranoid === false) {
        this.setQuery({ ...rest, deletedAt: { $exists: true } });
    } else {
        this.setQuery({ ...rest, deletedAt: { $exists: false } });
    }

    next();
});

commentSchema.virtual("replies", {
    ref: "Comment",
    localField: "_id",
    foreignField: "refId",
    match: { OnModel: "Comment" }
});


commentSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
    const commentId = this._id;

    await mongoose.model("Comment").deleteMany({ commentId });

    next();
});




const commentModel = mongoose.models.Comment || mongoose.model<IComment>("Comment", commentSchema);
export default commentModel
