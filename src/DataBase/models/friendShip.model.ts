import { Schema, model, Document, Types } from "mongoose";

export enum FriendShipEnum {
    Pending = "pending",
    Accepted = "accepted",
    Rejected = "rejected",
}

export interface IFriendShip extends Document {
    requestFromId: Types.ObjectId;
    requestToId: Types.ObjectId;
    status: FriendShipEnum;
    createdAt?: Date;
    updatedAt?: Date;
}

const friendShipSchema = new Schema<IFriendShip>(
    {
        requestFromId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        requestToId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(FriendShipEnum),
            default: FriendShipEnum.Pending,
        },
    },
    {
        timestamps: true,
    }
);

// 🔸 optional: منع تكرار نفس العلاقة بين نفس المستخدمين
friendShipSchema.index(
    { requestFromId: 1, requestToId: 1 },
    { unique: true }
);

export const FriendShipModel = model<IFriendShip>("FriendShip", friendShipSchema);
