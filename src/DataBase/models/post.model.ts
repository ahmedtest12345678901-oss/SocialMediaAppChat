import mongoose, { Schema, Types } from "mongoose";


export enum PostAvailabilltyEunm {
    public = "public",
    private = "private",
    friends = "friends"
}
export enum postAllowCommentEunm {
    allow = "allow",
    deny = "deny"
}
export interface IPost {
    content: string;
    tags: Types.ObjectId[];    
    likes: Types.ObjectId[];     
    attachments: string[];
    deletedAt: Date;
    deletedBy: Types.ObjectId;
    createdBy: Types.ObjectId;
    assetFolderId: string;
    restoredAt: Date;
    restoedBy: Types.ObjectId;
    allowComments: postAllowCommentEunm;
    availabillty: PostAvailabilltyEunm;
    isFrozen: boolean;
}


export const postSchema = new Schema<IPost>({
    content: {
        type: String,
        minLength: 5,
        maxLength: 1000,
        required: function () {
            return this?.attachments?.length === 0
        }
    },
    attachments: [String],
    assetFolderId: String,
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: Schema.Types.ObjectId, ref: "User" }],
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    allowComments: { type: String, enum: postAllowCommentEunm, default: postAllowCommentEunm.allow },
    availabillty: { type: String, enum: PostAvailabilltyEunm, default: PostAvailabilltyEunm.public },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    restoredAt: { type: Date },
    restoedBy: { type: Schema.Types.ObjectId, ref: "User" },
    isFrozen: { type: Boolean, default: false }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strictQuery: true,
})

postSchema.pre(["find", "findOne"], function (next) {
    const query = this.getQuery();
    const { paranoid, ...rest } = query;

    if (paranoid === false) {
        this.setQuery({ ...rest, deletedAt: { $exists: true } });
    } else {
        this.setQuery({ ...rest, deletedAt: { $exists: false } });
    }

    next();
});





postSchema.virtual("comments", {
    ref: "Comment",
    localField: "_id",
    foreignField: "refId",
    match: { OnModel: "Post" }
})

postSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
    const postId = this._id;

    const comments = await mongoose.model("Comment").find({ refId: postId, OnModel: "Post" });

    for (const comment of comments) {
        await comment.deleteOne();
    }

    next();
});


const postModel = mongoose.models.Post || mongoose.model<IPost>("Post", postSchema);
export default postModel
