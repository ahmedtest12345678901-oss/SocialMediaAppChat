import mongoose, { Schema, Types } from "mongoose";

export enum OnModelEnum {
    Post = "Post",
    Comment = "Comment",
}

export interface IFriendRequest {
    createdBy: Types.ObjectId;
    sendTo: Types.ObjectId;
    acceptedAt: Date,



}

export const FriendRequestSchema = new Schema<IFriendRequest>({


    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sendTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
    acceptedAt: { type: Date }

}, {

    timestamps: true,
    strictQuery: true,

})

FriendRequestSchema.pre(["find", "findOne", "findOneAndDelete", "findOneAndUpdate"], function (next) {
    const query = this.getQuery();
    const { paranoid, ...rest } = query;

    if (paranoid === false) {
        this.setQuery({ ...rest, deletedAt: { $exists: true } });
    } else {
        this.setQuery({ ...rest, deletedAt: { $exists: false } });
    }

    next();
});



const FriendRequestModel = mongoose.models.FriendRequest || mongoose.model<IFriendRequest>("FriendRequest", FriendRequestSchema);
export default FriendRequestModel
